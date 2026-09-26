import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type BodyError, readFormBody, readJsonBody } from "./request-body.ts";

const URL_ = "http://127.0.0.1/";

/** A request whose body arrives as a stream of 1 KiB chunks. */
function streamed(bytes: number, type: string): Request {
  const chunk = new Uint8Array(1024).fill(0x61);
  let sent = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= bytes) return controller.close();
      sent += chunk.length;
      controller.enqueue(chunk);
    },
  });
  return new Request(URL_, {
    method: "POST",
    headers: { "content-type": type },
    body,
  });
}

function post(body: string, type: string): Request {
  return new Request(URL_, {
    method: "POST",
    headers: { "content-type": type },
    body,
  });
}

Deno.test("reads a JSON body under the cap", async () => {
  const read = await readJsonBody(
    post(`{"email":"a@example.com"}`, "application/json"),
    64,
  );
  assertEquals(read, { ok: true, value: { email: "a@example.com" } });
});

Deno.test("answers 413 to a JSON body over the cap, in one chunk or many", async () => {
  const over: BodyError = {
    ok: false,
    status: 413,
    error: "Request body too large",
  };
  const whole = post(`{"email":"${"a".repeat(100)}"}`, "application/json");
  assertEquals(await readJsonBody(whole, 64), over);
  assertEquals(
    await readJsonBody(streamed(64 * 1024, "application/json"), 4096),
    over,
  );
});

Deno.test("answers 400 with the caller's text to a body that is not JSON", async () => {
  assertEquals(await readJsonBody(post("{", "application/json"), 64, "Bad"), {
    ok: false,
    status: 400,
    error: "Bad",
  });
});

Deno.test("reads a url-encoded form under the cap", async () => {
  const read = await readFormBody(
    post("token=abc&x=1", "application/x-www-form-urlencoded"),
    64,
  );
  assertEquals(read.ok && read.value.get("token"), "abc");
});

Deno.test("reads an empty url-encoded body as an empty form", async () => {
  const read = await readFormBody(
    post("", "application/x-www-form-urlencoded"),
    64,
  );
  assertEquals(read.ok && [...read.value.keys()], []);
});

Deno.test("answers 400 to a form body with no Content-Type or one that does not parse", async () => {
  const invalid: BodyError = {
    ok: false,
    status: 400,
    error: "Invalid form body",
  };
  const requests = [
    new Request(URL_, {
      method: "POST",
      body: new TextEncoder().encode("token=abc"),
    }),
    post("token=abc", "text/plain"),
    post("", "multipart/form-data; boundary=x"),
  ];
  for (const req of requests) {
    assertEquals(
      await readFormBody(req, 64),
      invalid,
      req.headers.get("content-type") ?? "no content type",
    );
  }
});

Deno.test("answers 413 to a form body over the cap, in one chunk or many", async () => {
  const over: BodyError = {
    ok: false,
    status: 413,
    error: "Request body too large",
  };
  const whole = post(
    `token=${"a".repeat(100)}`,
    "application/x-www-form-urlencoded",
  );
  assertEquals(await readFormBody(whole, 64), over);
  assertEquals(
    await readFormBody(
      streamed(64 * 1024, "application/x-www-form-urlencoded"),
      4096,
    ),
    over,
  );
});
