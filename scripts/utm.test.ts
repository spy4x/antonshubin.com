import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  articleCampaign,
  buildTaggedUrl,
  channel,
  CHANNELS,
  channelUrl,
  stripTrailingSlash,
} from "./utm.ts";

const BASE = "https://antonshubin.com";
const OPUS_POST = "/blog/opus-5-5-vs-sonnet-5-agent-costs";

Deno.test("drops a trailing slash from a non-root path", () => {
  assertEquals(
    stripTrailingSlash("/work/rostok/"),
    "/work/rostok",
  );
});

Deno.test("keeps a path with no trailing slash unchanged", () => {
  assertEquals(stripTrailingSlash("/blog/rostok"), "/blog/rostok");
});

Deno.test("keeps the root path as a single slash", () => {
  assertEquals(stripTrailingSlash("/"), "/");
});

Deno.test("builds a tagged url with source, medium and campaign in order", () => {
  const url = buildTaggedUrl(BASE, "/blog/rostok-self-hosted-scaffolder", {
    source: "reddit",
    medium: "social",
    campaign: "rostok-launch",
  });
  assertEquals(
    url,
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder" +
      "?utm_source=reddit&utm_medium=social&utm_campaign=rostok-launch",
  );
});

Deno.test("strips a trailing slash before tagging, so the link needs no redirect", () => {
  const url = channelUrl(
    BASE,
    "/blog/rostok-self-hosted-scaffolder/",
    "github",
    "rostok-launch",
  );
  assertEquals(
    url,
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder" +
      "?utm_source=github&utm_medium=oss&utm_campaign=rostok-launch",
  );
});

Deno.test("reproduces the opus55-vs-sonnet5 links shared by hand, byte for byte", () => {
  const expected = [
    [
      "x",
      undefined,
      "?utm_source=x&utm_medium=social&utm_campaign=opus55-vs-sonnet5",
    ],
    [
      "linkedin",
      undefined,
      "?utm_source=linkedin&utm_medium=social&utm_campaign=opus55-vs-sonnet5",
    ],
    [
      "hn",
      undefined,
      "?utm_source=hn&utm_medium=social&utm_campaign=opus55-vs-sonnet5",
    ],
    [
      "reddit",
      "r-claudeai",
      "?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudeai",
    ],
    [
      "reddit",
      "r-claudecode",
      "?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudecode",
    ],
  ] as const;
  for (const [source, content, query] of expected) {
    assertEquals(
      channelUrl(BASE, OPUS_POST, source, "opus55-vs-sonnet5", content),
      `${BASE}${OPUS_POST}${query}`,
    );
  }
});

Deno.test("leaves utm_content out when it is unset", () => {
  const url = new URL(channelUrl(BASE, "/", "x", "evergreen"));
  assertEquals([...url.searchParams.keys()], [
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ]);
});

Deno.test("rejects a campaign that is not lowercase kebab-case", () => {
  assertThrows(
    () => channelUrl(BASE, "/", "x", "Opus55_vs_Sonnet5"),
    Error,
    "utm_campaign",
  );
});

Deno.test("rejects a content value that is not lowercase kebab-case", () => {
  assertThrows(
    () => channelUrl(BASE, "/", "reddit", "evergreen", "r/ClaudeAI"),
    Error,
    "utm_content",
  );
});

Deno.test("takes the medium from the channel table, so youtube is always video", () => {
  const url = new URL(channelUrl(BASE, "/", "youtube", "mcp-yt"));
  assertEquals(url.searchParams.get("utm_medium"), "video");
});

Deno.test("fails loudly on a channel that is not in the table", () => {
  assertThrows(() => channel("twitter"), Error, "Unknown channel");
});

Deno.test("an article's campaign is its utmCampaign front matter when set", () => {
  assertEquals(
    articleCampaign("opus-5-5-vs-sonnet-5-agent-costs", {
      utmCampaign: "opus55-vs-sonnet5",
    }),
    "opus55-vs-sonnet5",
  );
});

Deno.test("an article's campaign falls back to its slug", () => {
  assertEquals(articleCampaign("ship-it-today", {}), "ship-it-today");
});

/** Parses the markdown table under `heading` into rows of cells, backticks stripped. */
function markdownTable(markdown: string, heading: string): string[][] {
  const start = markdown.indexOf(`\n${heading}\n`);
  if (start === -1) throw new Error(`docs/utm.md has no "${heading}" section`);
  const rest = markdown.slice(start + heading.length + 2);
  const end = rest.search(/\n## /);
  const section = end === -1 ? rest : rest.slice(0, end);
  const rows = section.split("\n").filter((line) => line.startsWith("|"));
  return rows
    .slice(2) // header and separator
    .map((line) =>
      line.slice(1, -1).split("|").map((cell) =>
        cell.trim().replace(/^`|`$/g, "")
      )
    );
}

Deno.test("docs/utm.md's channel table matches the code's channel table", async () => {
  const doc = await Deno.readTextFile(
    new URL("../docs/utm.md", import.meta.url),
  );
  const rows = markdownTable(doc, "## Channels");
  assertEquals(
    rows,
    CHANNELS.map((c) => [c.source, c.medium, c.label]),
  );
});
