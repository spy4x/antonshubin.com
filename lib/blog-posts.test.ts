import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { byNewest, fillProof, parseBlogArticle } from "./blog-posts.ts";
import { blogArticles } from "./data.ts";
import { proof } from "./proof.ts";

const VALID = `---
title: "A post"
description: "What it is about"
publishedAt: "2026-09-26"
readTime: 8
topic: "ai-mcp"
---

Body.
`;

/** VALID with one front matter line replaced, added or removed. */
function variant(from: string, to: string): string {
  if (!VALID.includes(from)) throw new Error(`fixture has no "${from}"`);
  return VALID.replace(from, to);
}

Deno.test("a post's front matter becomes its metadata", () => {
  assertEquals(parseBlogArticle("a-post", VALID), {
    slug: "a-post",
    title: "A post",
    description: "What it is about",
    publishedAt: "2026-09-26",
    readTime: 8,
    topic: "ai-mcp",
  });
});

Deno.test("a missing, mistyped or unknown front matter field fails naming the file", () => {
  const cases: [string, string][] = [
    [variant('title: "A post"\n', ""), '"title" is missing'],
    [variant('topic: "ai-mcp"', 'topic: "dev-tips"'), 'topic "dev-tips"'],
    [
      variant('publishedAt: "2026-09-26"', 'publishedAt: "26 Sep"'),
      "YYYY-MM-DD",
    ],
    [variant("readTime: 8", 'readTime: "8"'), "whole number"],
    [
      variant("readTime: 8", "readTime: 8\nupdatedat: 2026-09-27"),
      'unknown front matter field "updatedat"',
    ],
    [
      variant("readTime: 8", 'readTime: 8\narchiveNote: "x"'),
      '"archiveNote" needs "archived: true"',
    ],
    ["No front matter at all.\n", "no readable front matter"],
  ];
  for (const [raw, message] of cases) {
    const err = assertThrows(() => parseBlogArticle("bad-post", raw));
    const text = (err as Error).message;
    assertEquals(text.includes("content/blog/bad-post.md"), true, text);
    assertEquals(text.includes(message), true, `${message} not in: ${text}`);
  }
});

Deno.test("a {proof:<id>} placeholder reads the figure from lib/proof.ts", () => {
  assertEquals(
    fillProof("from {proof:jobs}+ projects"),
    `from ${proof("jobs")}+ projects`,
  );
  assertThrows(
    () => fillProof("{proof:nope}"),
    Error,
    'no proof figure "nope"',
  );
});

Deno.test("every post in content/blog loads, newest first, with the template title from lib/proof.ts", () => {
  assertEquals(blogArticles.length > 10, true, "too few posts loaded");
  const sorted = [...blogArticles].sort(byNewest);
  assertEquals(blogArticles.map((a) => a.slug), sorted.map((a) => a.slug));
  const template = blogArticles.find((a) =>
    a.slug === "deno-platform-template"
  );
  assertEquals(
    template?.title,
    `Deno Platform Template: distilling ${
      proof("jobs")
    }+ client projects into one repo`,
  );
});

Deno.test("posts published the same day keep one order by slug", () => {
  const a = parseBlogArticle("b-second", VALID);
  const b = parseBlogArticle("a-first", VALID);
  assertEquals([a, b].sort(byNewest).map((x) => x.slug), [
    "a-first",
    "b-second",
  ]);
});
