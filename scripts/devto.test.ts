import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  absolutizeImageUrls,
  buildDevToPayload,
  createDevToDraft,
} from "./devto.ts";

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

Deno.test("buildDevToPayload rewrites a site-relative image path to an absolute url", () => {
  const payload = buildDevToPayload(
    "post title",
    "post-slug",
    "before ![alt text](/img/blog/x.png) after",
  );
  assertEquals(
    payload.article.body_markdown,
    "before ![alt text](https://antonshubin.com/img/blog/x.png) after",
  );
});

Deno.test("buildDevToPayload leaves a body with no images unchanged", () => {
  const body = "just text, and a [link](/blog/other-post) with no image";
  const payload = buildDevToPayload("post title", "post-slug", body);
  assertEquals(payload.article.body_markdown, body);
});

Deno.test("buildDevToPayload leaves an already-absolute image url alone", () => {
  const body = "![alt](https://cdn.example.com/img/x.png)";
  const payload = buildDevToPayload("post title", "post-slug", body);
  assertEquals(payload.article.body_markdown, body);
});

Deno.test("buildDevToPayload rewrites images to the same origin as canonical_url", () => {
  const payload = buildDevToPayload(
    "post title",
    "post-slug",
    "![alt](/img/blog/x.png)",
  );
  const canonicalOrigin = new URL(payload.article.canonical_url).origin;
  const imageUrlMatch = payload.article.body_markdown.match(
    /\((https?:\/\/[^)]+)\)/,
  );
  assertEquals(imageUrlMatch !== null, true);
  const imageOrigin = new URL(imageUrlMatch![1]).origin;
  assertEquals(imageOrigin, canonicalOrigin);
});

Deno.test("absolutizeImageUrls leaves a protocol-relative image url alone", () => {
  const body = "![alt](//cdn.example.com/img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves a data uri image alone", () => {
  const body = "![alt](data:image/png;base64,AAAA)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves a relative, non-rooted image path alone", () => {
  const body = "![alt](img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls rewrites an image whose alt text contains a bracket", () => {
  const body = "![a [b] c](/img/blog/x.png)";
  assertEquals(
    absolutizeImageUrls(body),
    "![a [b] c](https://antonshubin.com/img/blog/x.png)",
  );
});

Deno.test("absolutizeImageUrls rewrites an image whose alt text nests brackets two levels deep", () => {
  const body = "![a [b [c] d] e](/img/blog/x.png)";
  assertEquals(
    absolutizeImageUrls(body),
    "![a [b [c] d] e](https://antonshubin.com/img/blog/x.png)",
  );
});

Deno.test("absolutizeImageUrls leaves an image inside a ``` fence untouched but still rewrites one outside it", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "```",
    "![alt](/img/blog/b.png)",
    "```",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "```",
    "![alt](/img/blog/b.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls leaves an image inside a ~~~ fence untouched but still rewrites one outside it", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "~~~",
    "![alt](/img/blog/b.png)",
    "~~~",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "~~~",
    "![alt](/img/blog/b.png)",
    "~~~",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls treats a shorter fence line inside a longer fence as fenced content", () => {
  const body = [
    "````",
    "```",
    "![alt](/img/blog/x.png)",
    "````",
    "after ![alt](/img/blog/y.png)",
  ].join("\n");
  const expected = [
    "````",
    "```",
    "![alt](/img/blog/x.png)",
    "````",
    "after ![alt](https://antonshubin.com/img/blog/y.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls leaves an image inside an unclosed fence untouched to the end of the document", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "```md",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "```md",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls rewrites an image again once a fence has closed", () => {
  const body = [
    "```",
    "![alt](/img/blog/a.png)",
    "```",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  const expected = [
    "```",
    "![alt](/img/blog/a.png)",
    "```",
    "![alt](https://antonshubin.com/img/blog/b.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls treats a fence indented by three spaces as a real fence", () => {
  const body = [
    "   ```",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not treat a fence indented by four spaces as a fence", () => {
  const body = [
    "    ```",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  const expected = [
    "    ```",
    "![alt](https://antonshubin.com/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls does not close a fence on a delimiter line followed by text", () => {
  const body = [
    "```",
    "``` not actually closing",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not let a ~~~ line close a ``` fence", () => {
  const body = [
    "```",
    "~~~",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not treat two backticks as a fence delimiter", () => {
  const body = [
    "``",
    "![alt](/img/blog/x.png)",
  ].join("\n");
  const expected = [
    "``",
    "![alt](https://antonshubin.com/img/blog/x.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls never rewrites an image written in the opening fence line's info string", () => {
  const body = [
    "```md ![alt](/img/blog/x.png)",
    "content",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves an image alone when its alt text has an unmatched opening bracket", () => {
  const body = "![a [b](/img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls skips only the malformed image and still rewrites a later well-formed one on the same line", () => {
  const body = "![a [b](/img/x.png) and ![c](/img/y.png)";
  const expected =
    "![a [b](/img/x.png) and ![c](https://antonshubin.com/img/y.png)";
  assertEquals(absolutizeImageUrls(body), expected);
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
