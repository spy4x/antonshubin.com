import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  INDEXNOW_KEY_PATH,
  pingIndexNow,
} from "./indexnow.ts";

Deno.test("the ping posts the host, key, key location and URLs", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fake = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(null, { status: 202 }));
  }) as typeof fetch;
  const line = await pingIndexNow(fake, "https://antonshubin.com", [
    "https://antonshubin.com/blog/x",
  ]);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, INDEXNOW_ENDPOINT);
  assertEquals(calls[0].init?.method, "POST");
  assertEquals(JSON.parse(String(calls[0].init?.body)), {
    host: "antonshubin.com",
    key: INDEXNOW_KEY,
    keyLocation: `https://antonshubin.com${INDEXNOW_KEY_PATH}`,
    urlList: ["https://antonshubin.com/blog/x"],
  });
  assertStringIncludes(line, "submitted 1 URL(s), answered 202");
});

Deno.test("a refused or failed ping is reported, never thrown", async () => {
  const refused =
    (() =>
      Promise.resolve(new Response(null, { status: 403 }))) as typeof fetch;
  assertStringIncludes(
    await pingIndexNow(refused, "https://antonshubin.com", []),
    "answered 403",
  );
  const down = (() => Promise.reject(new Error("dns failed"))) as typeof fetch;
  assertStringIncludes(
    await pingIndexNow(down, "https://antonshubin.com", []),
    "ping failed (dns failed)",
  );
});
