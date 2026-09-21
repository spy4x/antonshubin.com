import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { buildDevToPayload, createDevToDraft } from "./devto.ts";

Deno.test("buildDevToPayload creates a draft with a clean, untagged canonical url", () => {
  const payload = buildDevToPayload(
    "rostok launch post",
    "rostok-self-hosted-scaffolder",
    "body text",
  );
  assertEquals(payload.article.title, "rostok launch post");
  assertEquals(payload.article.body_markdown, "body text");
  assertEquals(payload.article.published, false);
  assertEquals(
    payload.article.canonical_url,
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder",
  );
  assertEquals(payload.article.canonical_url.includes("utm_"), false);
});

Deno.test("createDevToDraft skips the network call and does not throw when DEVTO_API_KEY is unset", async () => {
  const previous = Deno.env.get("DEVTO_API_KEY");
  Deno.env.delete("DEVTO_API_KEY");
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (() => {
    calls++;
    return Promise.reject(new Error("fetch should not have been called"));
  }) as typeof fetch;
  try {
    await createDevToDraft("title", "slug", "body");
    assertEquals(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) Deno.env.delete("DEVTO_API_KEY");
    else Deno.env.set("DEVTO_API_KEY", previous);
  }
});

Deno.test("createDevToDraft warns instead of throwing when the request fails", async () => {
  Deno.env.set("DEVTO_API_KEY", "test-key");
  const originalFetch = globalThis.fetch;
  globalThis.fetch =
    (() =>
      Promise.resolve(new Response("nope", { status: 500 }))) as typeof fetch;
  try {
    // Must resolve, not reject — a failed Dev.to draft never blocks a publish.
    await createDevToDraft("title", "slug", "body");
  } finally {
    globalThis.fetch = originalFetch;
    Deno.env.delete("DEVTO_API_KEY");
  }
});
