import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { parseRange, withByteRange } from "./byte-range.ts";

const BODY = new TextEncoder().encode("0123456789");

/** A 200 like Fresh's static files send: the body in two chunks, a length and a strong ETag. */
function clip(): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(BODY.subarray(0, 4));
      controller.enqueue(BODY.subarray(4));
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "content-length": String(BODY.length),
      "content-type": "video/mp4",
      etag: `"v1"`,
    },
  });
}

function get(headers: Record<string, string> = {}): Request {
  return new Request("http://site.test/video/tools/x/clip.mp4", { headers });
}

Deno.test("parseRange reads a closed, an open and a suffix range", () => {
  assertEquals(parseRange("bytes=0-1", 10), { start: 0, end: 1 });
  assertEquals(parseRange("bytes=4-", 10), { start: 4, end: 9 });
  assertEquals(parseRange("bytes=-3", 10), { start: 7, end: 9 });
  assertEquals(parseRange("bytes=8-99", 10), { start: 8, end: 9 });
});

Deno.test("parseRange refuses a range past the end or one it cannot read", () => {
  assertEquals(parseRange("bytes=10-", 10), null);
  assertEquals(parseRange("bytes=5-2", 10), null);
  assertEquals(parseRange("bytes=-0", 10), null);
  assertEquals(parseRange("items=0-1", 10), null);
  assertEquals(parseRange("bytes=-", 10), null);
  assertEquals(parseRange("bytes=0-1,4-5", 10), "multiple");
});

Deno.test("a range request for a clip answers 206 with only those bytes", async () => {
  const res = withByteRange(get({ range: "bytes=2-5" }), clip());
  assertEquals(res.status, 206);
  assertEquals(res.headers.get("content-range"), "bytes 2-5/10");
  assertEquals(res.headers.get("content-length"), "4");
  assertEquals(res.headers.get("accept-ranges"), "bytes");
  assertEquals(res.headers.get("content-type"), "video/mp4");
  assertEquals(await res.text(), "2345");
});

Deno.test("Safari's first probe, bytes=0-1, gets the first two bytes", async () => {
  const res = withByteRange(get({ range: "bytes=0-1" }), clip());
  assertEquals(res.status, 206);
  assertEquals(await res.text(), "01");
});

Deno.test("a range past the end answers 416 naming the size", async () => {
  const res = withByteRange(get({ range: "bytes=10-20" }), clip());
  assertEquals(res.status, 416);
  assertEquals(res.headers.get("content-range"), "bytes */10");
  assertEquals(await res.text(), "");
});

Deno.test("a request without Range gets the whole clip and Accept-Ranges", async () => {
  const res = withByteRange(get(), clip());
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("accept-ranges"), "bytes");
  assertEquals(await res.text(), "0123456789");
});

Deno.test("an If-Range that no longer matches the ETag gets the whole clip", async () => {
  const stale = withByteRange(
    get({ range: "bytes=0-1", "if-range": `"v0"` }),
    clip(),
  );
  assertEquals(stale.status, 200);
  assertEquals(await stale.text(), "0123456789");
  const fresh = withByteRange(
    get({ range: "bytes=0-1", "if-range": `"v1"` }),
    clip(),
  );
  assertEquals(fresh.status, 206);
  await fresh.body?.cancel();
});

Deno.test("an If-Range with a weak ETag gets the whole clip", async () => {
  const res = withByteRange(
    get({ range: "bytes=0-1", "if-range": `W/"v1"` }),
    clip(),
  );
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "0123456789");
});

Deno.test("a 304 or a 404 page passes through untouched", () => {
  const notModified = new Response(null, { status: 304 });
  assertEquals(
    withByteRange(get({ range: "bytes=0-1" }), notModified),
    notModified,
  );
  const notFound = new Response("not found", {
    status: 404,
    headers: { "content-length": "9" },
  });
  assertEquals(
    withByteRange(get({ range: "bytes=0-1" }), notFound),
    notFound,
  );
});
