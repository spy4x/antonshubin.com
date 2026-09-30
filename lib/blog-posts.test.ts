import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  byNewest,
  fillProof,
  parseBlogArticle,
  TLDR_MAX_CHARS,
} from "./blog-posts.ts";
import { blogArticles } from "./data.ts";
import { proof } from "./proof.ts";

const VALID = `---
title: "A post"
description: "What it is about"
tldr:
  - "First point."
  - "Second point."
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
    tldr: ["First point.", "Second point."],
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

Deno.test("a post without a TL;DR of two to four short lines fails naming the file", () => {
  const LIST = 'tldr:\n  - "First point."\n  - "Second point."\n';
  const lines = (n: number) =>
    `tldr:\n${
      Array.from({ length: n }, (_, i) => `  - "Point ${i + 1}."\n`).join("")
    }`;
  const cases: [string, string][] = [
    [variant(LIST, ""), '"tldr" is missing'],
    [variant(LIST, "tldr: []\n"), "2 to 4 lines"],
    [variant(LIST, 'tldr: "One string."\n'), "2 to 4 lines"],
    [variant(LIST, lines(1)), "2 to 4 lines"],
    [variant(LIST, lines(5)), "2 to 4 lines"],
    [
      variant(LIST, 'tldr:\n  - "First point."\n  - "  "\n'),
      "non-empty string",
    ],
    [variant(LIST, 'tldr:\n  - "First point."\n  - 42\n'), "non-empty string"],
    [
      variant(
        LIST,
        `tldr:\n  - "First point."\n  - "${"x".repeat(TLDR_MAX_CHARS + 1)}"\n`,
      ),
      `over ${TLDR_MAX_CHARS} characters`,
    ],
  ];
  for (const [raw, message] of cases) {
    const err = assertThrows(() => parseBlogArticle("bad-post", raw));
    const text = (err as Error).message;
    assertEquals(text.includes("content/blog/bad-post.md"), true, text);
    assertEquals(text.includes(message), true, `${message} not in: ${text}`);
  }
  // Four lines of exactly the limit are the most a TL;DR may be.
  const most = parseBlogArticle(
    "a-post",
    variant(
      LIST,
      `tldr:\n${`  - "${"x".repeat(TLDR_MAX_CHARS)}"\n`.repeat(4)}`,
    ),
  );
  assertEquals(most.tldr.length, 4);
});

Deno.test("a coverImage is kept when it names a PNG under static/img", () => {
  const dir = Deno.makeTempDirSync();
  try {
    Deno.mkdirSync(`${dir}/img/blog`, { recursive: true });
    Deno.writeFileSync(`${dir}/img/blog/cover.png`, new Uint8Array([1]));
    const post = parseBlogArticle(
      "a-post",
      variant("readTime: 8", 'readTime: 8\ncoverImage: "/img/blog/cover.png"'),
      dir,
    );
    assertEquals(post.coverImage, "/img/blog/cover.png");
    assertEquals(parseBlogArticle("a-post", VALID, dir).coverImage, undefined);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("a coverImage outside static/img, of another type, or missing fails naming the file", () => {
  const dir = Deno.makeTempDirSync();
  try {
    Deno.mkdirSync(`${dir}/img/blog`, { recursive: true });
    Deno.writeFileSync(`${dir}/img/blog/cover.webp`, new Uint8Array([1]));
    Deno.writeFileSync(`${dir}/secret.png`, new Uint8Array([1]));
    const cases: [string, string][] = [
      ["https://example.com/cover.png", "must be a /img/... path"],
      ["/img/../secret.png", "must be a /img/... path"],
      ["/img/blog/cover.webp", "must be a /img/... path"],
      ["/img/blog/missing.png", "is not a file under"],
    ];
    for (const [path, message] of cases) {
      const raw = variant("readTime: 8", `readTime: 8\ncoverImage: "${path}"`);
      const err = assertThrows(() => parseBlogArticle("bad-post", raw, dir));
      const text = (err as Error).message;
      assertEquals(text.includes("content/blog/bad-post.md"), true, text);
      assertEquals(text.includes(message), true, `${message} not in: ${text}`);
    }
  } finally {
    Deno.removeSync(dir, { recursive: true });
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

Deno.test("a {proof:<id>} placeholder in a TL;DR line is filled with the figure", () => {
  const article = parseBlogArticle(
    "a-post",
    variant('- "First point."', '- "Over {proof:jobs}+ projects."'),
  );
  assertEquals(article.tldr, [
    `Over ${proof("jobs")}+ projects.`,
    "Second point.",
  ]);
});
