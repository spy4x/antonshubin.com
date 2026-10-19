// Byte ranges for the tool clips under /video/* (#454). Safari plays an MP4
// only from a server that answers a `Range` request with 206 Partial Content,
// and Fresh's static files ignore `Range`. `main.ts` passes each /video/*
// response through `withByteRange()`, which cuts the one range asked for out
// of the body Fresh already produced, so it needs no file path and runs on
// any runtime.

/** One range of a body, both ends inclusive, as `Content-Range` writes it. */
export interface ByteRange {
  start: number;
  end: number;
}

/**
 * The range a `Range` header asks for in a body of `size` bytes: `bytes=a-b`,
 * `bytes=a-` (to the end) or `bytes=-n` (the last n bytes), with `b` capped at
 * the last byte. `"multiple"` for a list of ranges, which this server answers
 * with the whole body; `null` for a header it cannot satisfy or parse, which
 * answers 416.
 */
export function parseRange(
  header: string,
  size: number,
): ByteRange | "multiple" | null {
  const match = /^bytes=(.*)$/i.exec(header.trim());
  if (!match) return null;
  if (match[1].includes(",")) return "multiple";
  const parts = /^\s*(\d*)-(\d*)\s*$/.exec(match[1]);
  if (!parts || (parts[1] === "" && parts[2] === "")) return null;
  if (parts[1] === "") {
    const suffix = Number(parts[2]);
    if (suffix === 0 || size === 0) return null;
    return { start: Math.max(size - suffix, 0), end: size - 1 };
  }
  const start = Number(parts[1]);
  const end = parts[2] === "" ? size - 1 : Math.min(Number(parts[2]), size - 1);
  // `end` is capped at the last byte, so a start past the end lands here too.
  if (end < start) return null;
  return { start, end };
}

/** The bytes `[start, end]` of `body`, read only as far as `end`; the rest is cancelled. */
function sliceStream(
  body: ReadableStream<Uint8Array>,
  { start, end }: ByteRange,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let position = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return controller.close();
        const from = Math.max(start - position, 0);
        const to = Math.min(end + 1 - position, value.length);
        position += value.length;
        if (to > from) controller.enqueue(value.subarray(from, to));
        if (position > end) {
          await reader.cancel();
          return controller.close();
        }
        if (to > from) return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/**
 * `response` answered as `request`'s `Range` asks: 206 with `Content-Range`
 * and only those bytes, 416 with a `Content-Range` that names only the size
 * for a range past the end or one it cannot parse, or `response` itself for a request
 * with no `Range`, a list of ranges, an `If-Range` that no longer matches the
 * strong `ETag`, or a response that is not a 200 with a known length. Every 200 it
 * returns says `Accept-Ranges: bytes`.
 */
export function withByteRange(request: Request, response: Response): Response {
  const length = response.headers.get("content-length");
  const size = Number(length);
  if (
    response.status !== 200 || !response.body || length === null ||
    !Number.isInteger(size)
  ) {
    return response;
  }
  response.headers.set("Accept-Ranges", "bytes");
  const header = request.headers.get("range");
  if (!header || request.method !== "GET") return response;
  const ifRange = request.headers.get("if-range");
  // A weak ETag never matches (RFC 9110, If-Range), so the whole body goes.
  if (
    ifRange &&
    (ifRange.startsWith("W/") || ifRange !== response.headers.get("etag"))
  ) return response;

  const range = parseRange(header, size);
  if (range === "multiple") return response;
  const headers = new Headers(response.headers);
  if (!range) {
    response.body.cancel();
    headers.delete("content-length");
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(range.end - range.start + 1));
  return new Response(sliceStream(response.body, range), {
    status: 206,
    headers,
  });
}
