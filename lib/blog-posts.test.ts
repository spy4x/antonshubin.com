import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  byNewest,
  fillProof,
  LETTER_FIELDS_FROM,
  parseBlogArticle,
  postCover,
  postCoverAlt,
  postIntro,
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

Deno.test("every post's Dev.to cover is a 1000x420 PNG", () => {
  const withCover = blogArticles.filter((a) => a.coverImage);
  assertEquals(withCover.length > 0, true, "no post has a coverImage");
  for (const { slug, coverImage } of withCover) {
    const png = Deno.readFileSync(`static${coverImage}`);
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    // A PNG's IHDR chunk holds the width and height at bytes 16 and 20.
    assertEquals(
      [view.getUint32(16), view.getUint32(20)],
      [1000, 420],
      `${slug}: ${coverImage}`,
    );
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

Deno.test("a post published on or after the cutoff needs intro, coverImage and coverAlt, naming the one missing", () => {
  const dir = Deno.makeTempDirSync();
  try {
    Deno.mkdirSync(`${dir}/img/blog`, { recursive: true });
    Deno.writeFileSync(`${dir}/img/blog/cover.png`, new Uint8Array([1]));
    const dated = (extra: string) =>
      variant(
        'publishedAt: "2026-09-26"',
        `publishedAt: "${LETTER_FIELDS_FROM}"\n${extra}`,
      );
    const all = [
      'intro: "Why I wrote it."',
      'coverImage: "/img/blog/cover.png"',
      'coverAlt: "A screenshot."',
    ];
    const post = parseBlogArticle("a-post", dated(all.join("\n")), dir);
    assertEquals(post.intro, "Why I wrote it.");
    assertEquals(post.coverAlt, "A screenshot.");
    for (const [i, key] of ["intro", "coverImage", "coverAlt"].entries()) {
      const without = all.filter((_, j) => j !== i).join("\n");
      assertThrows(
        () => parseBlogArticle("a-post", dated(without), dir),
        Error,
        `"${key}" is missing`,
      );
    }
    // The day before the cutoff, none of the three is needed.
    parseBlogArticle("a-post", VALID, dir);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("an older post falls back to its description, its OG preview and its title", () => {
  const post = parseBlogArticle("a-post", VALID);
  assertEquals(postIntro(post), "What it is about");
  assertEquals(postCover(post), "/img/og/blog/a-post.png");
  assertEquals(postCoverAlt(post), "A post");
  const set = { ...post, intro: "I", coverImage: "/img/x.png", coverAlt: "A" };
  assertEquals(
    [postIntro(set), postCover(set), postCoverAlt(set)],
    ["I", "/img/x.png", "A"],
  );
});

Deno.test("every post's OG fallback cover exists as a file", () => {
  for (const a of blogArticles) {
    Deno.statSync(`static${postCover({ ...a, coverImage: undefined })}`);
  }
});
