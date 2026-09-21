import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { buildTaggedUrl, stripTrailingSlash } from "./utm.ts";

Deno.test("drops a trailing slash from a non-root path", () => {
  assertEquals(
    stripTrailingSlash("/projects/smartlite/"),
    "/projects/smartlite",
  );
});

Deno.test("keeps a path with no trailing slash unchanged", () => {
  assertEquals(stripTrailingSlash("/blog/rostok"), "/blog/rostok");
});

Deno.test("keeps the root path as a single slash", () => {
  assertEquals(stripTrailingSlash("/"), "/");
});

Deno.test("builds a tagged url with source, medium and campaign in order", () => {
  const url = buildTaggedUrl(
    "https://antonshubin.com",
    "/blog/rostok-self-hosted-scaffolder",
    {
      source: "reddit",
      medium: "social",
      campaign: "rostok-launch",
    },
  );
  assertEquals(
    url,
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder" +
      "?utm_source=reddit&utm_medium=social&utm_campaign=rostok-launch",
  );
});

Deno.test("strips a trailing slash before tagging, so the link never 404s", () => {
  const url = buildTaggedUrl(
    "https://antonshubin.com",
    "/projects/smartlite/",
    {
      source: "github",
      medium: "oss",
      campaign: "template-launch",
    },
  );
  assertEquals(
    url,
    "https://antonshubin.com/projects/smartlite" +
      "?utm_source=github&utm_medium=oss&utm_campaign=template-launch",
  );
});
