import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import { startSite } from "../test/harness.ts";
import {
  linkLines,
  parseLinksArgs,
  readPostFrontMatter,
  resolveCampaign,
} from "./links.ts";
import { CHANNELS } from "./utm.ts";

const BASE = "https://antonshubin.com";
const OPUS_POST = "/blog/opus-5-5-vs-sonnet-5-agent-costs";

/** The URL half of each `<source>  <url>` line. */
function urlsOf(lines: string[]): string[] {
  return lines.map((line) => line.trim().split(/\s+/)[1]);
}

Deno.test("parses the path, --campaign and --content in both flag forms", () => {
  assertEquals(
    parseLinksArgs([
      OPUS_POST,
      "--campaign",
      "opus55-vs-sonnet5",
      "--content=r-claudeai",
    ]),
    { path: OPUS_POST, campaign: "opus55-vs-sonnet5", content: "r-claudeai" },
  );
});

Deno.test("fails without a path, and on a path that is not site-absolute", () => {
  assertThrows(() => parseLinksArgs([]), Error, "Usage");
  assertThrows(() => parseLinksArgs(["blog/x"]), Error, `start with "/"`);
});

Deno.test("fails on a flag with no value", () => {
  assertThrows(
    () => parseLinksArgs(["/", "--campaign"]),
    Error,
    "needs a value",
  );
});

Deno.test("prints one tagged url per channel, each with its own source", () => {
  const lines = linkLines(BASE, OPUS_POST, "opus55-vs-sonnet5");
  assertEquals(lines.length, CHANNELS.length);
  const urls = urlsOf(lines).map((u) => new URL(u));
  assertEquals(
    urls.map((u) => u.searchParams.get("utm_source")),
    CHANNELS.map((c) => c.source),
  );
  for (const url of urls) {
    assertEquals(url.pathname, OPUS_POST);
    assertEquals(url.searchParams.get("utm_campaign"), "opus55-vs-sonnet5");
  }
});

Deno.test("an explicit --campaign wins over the post's front matter", async () => {
  const campaign = await resolveCampaign(OPUS_POST, "custom", () => {
    throw new Error("front matter must not be read");
  });
  assertEquals(campaign, "custom");
});

Deno.test("a blog path with no --campaign takes the post's utmCampaign", async () => {
  const campaign = await resolveCampaign(
    "/blog/some-post",
    undefined,
    (slug) =>
      Promise.resolve(
        slug === "some-post" ? { utmCampaign: "some-campaign" } : {},
      ),
  );
  assertEquals(campaign, "some-campaign");
});

Deno.test("a blog path with no --campaign and no utmCampaign takes the slug", async () => {
  const campaign = await resolveCampaign(
    "/blog/some-post",
    undefined,
    () => Promise.resolve({}),
  );
  assertEquals(campaign, "some-post");
});

Deno.test("a non-blog path with no --campaign is an error", async () => {
  await assertRejects(
    () => resolveCampaign("/how-i-work", undefined, () => Promise.resolve({})),
    Error,
    "pass --campaign",
  );
});

Deno.test("reads a real post's front matter, and names the file when the post is missing", async () => {
  const attrs = await readPostFrontMatter("rostok-self-hosted-scaffolder");
  assertEquals(typeof attrs.title, "string");
  await assertRejects(
    () => readPostFrontMatter("no-such-post"),
    Error,
    "content/blog/no-such-post.md",
  );
});

Deno.test("a post with no front matter at all defaults to its slug", async () => {
  // ship-it-today.md starts straight with "## What is it about?".
  assertEquals(
    await resolveCampaign("/blog/ship-it-today", undefined),
    "ship-it-today",
  );
});

Deno.test("every printed link and every example url in docs/utm.md answers 200 on the built site", async () => {
  const doc = await Deno.readTextFile(
    new URL("../docs/utm.md", import.meta.url),
  );
  const docUrls = doc.match(/https:\/\/antonshubin\.com[^\s`)]*/g) ?? [];
  if (docUrls.length === 0) throw new Error("docs/utm.md has no example urls");
  const urls = [
    ...urlsOf(linkLines(BASE, OPUS_POST, "opus55-vs-sonnet5")),
    ...docUrls,
  ];
  const site = await startSite();
  try {
    for (const url of urls) {
      const { pathname, search } = new URL(url);
      const res = await site.get(pathname + search);
      await res.body?.cancel();
      assertEquals(res.status, 200, url);
    }
  } finally {
    await site.stop();
  }
});
