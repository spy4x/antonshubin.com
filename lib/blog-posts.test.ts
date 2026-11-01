import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0"
import {
  byNewest,
  coverWebp,
  fillProof,
  LETTER_FIELDS_FROM,
  parseBlogArticle,
  postIntro,
  TLDR_MAX_CHARS,
} from "./blog-posts.ts"
import { blogArticles } from "./data.ts"
import { proof } from "./proof.ts"

const VALID = `---
title: "A post"
description: "What it is about"
tldr:
  - "First point."
  - "Second point."
publishedAt: "2026-09-26"
readTime: 8
topic: "ai-mcp"
coverImage: "/img/blog/ship-it-today/cover.png"
coverAlt: "A cover."
coverSize: "500x375"
---

Body.
`

/** VALID with one front matter line replaced, added or removed. */
function variant(from: string, to: string): string {
  if (!VALID.includes(from)) throw new Error(`fixture has no "${from}"`)
  return VALID.replace(from, to)
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
    coverImage: "/img/blog/ship-it-today/cover.png",
    coverAlt: "A cover.",
    coverSize: { width: 500, height: 375 },
  })
})

Deno.test("a missing, mistyped or unknown front matter field fails naming the file", () => {
  const cases: [string, string][] = [
    [variant('title: "A post"\n', ""), '"title" is missing'],
    [variant('topic: "ai-mcp"', 'topic: "dev-tips"'), 'topic "dev-tips"'],
    [
      variant('publishedAt: "2026-09-26"', 'publishedAt: "26 Sep"'),
      "YYYY-MM-DD",
    ],
    [variant("readTime: 8", 'readTime: "8"'), "whole number"],
    [variant('coverSize: "500x375"\n', ""), '"coverSize" is missing'],
    [variant('"500x375"', '"500"'), '"coverSize" must be'],
    [variant('"500x375"', '"0x375"'), '"coverSize" must be'],
    [variant('"500x375"', '"500 x 375"'), '"coverSize" must be'],
    [
      variant("readTime: 8", "readTime: 8\nupdatedat: 2026-09-27"),
      'unknown front matter field "updatedat"',
    ],
    [
      variant("readTime: 8", 'readTime: 8\narchiveNote: "x"'),
      '"archiveNote" needs "archived: true"',
    ],
    ["No front matter at all.\n", "no readable front matter"],
  ]
  for (const [raw, message] of cases) {
    const err = assertThrows(() => parseBlogArticle("bad-post", raw))
    const text = (err as Error).message
    assertEquals(text.includes("content/blog/bad-post.md"), true, text)
    assertEquals(text.includes(message), true, `${message} not in: ${text}`)
  }
})

Deno.test("a post without a TL;DR of two to four short lines fails naming the file", () => {
  const LIST = 'tldr:\n  - "First point."\n  - "Second point."\n'
  const lines = (n: number) =>
    `tldr:\n${
      Array.from({ length: n }, (_, i) => `  - "Point ${i + 1}."\n`).join("")
    }`
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
  ]
  for (const [raw, message] of cases) {
    const err = assertThrows(() => parseBlogArticle("bad-post", raw))
    const text = (err as Error).message
    assertEquals(text.includes("content/blog/bad-post.md"), true, text)
    assertEquals(text.includes(message), true, `${message} not in: ${text}`)
  }
  // Four lines of exactly the limit are the most a TL;DR may be.
  const most = parseBlogArticle(
    "a-post",
    variant(
      LIST,
      `tldr:\n${`  - "${"x".repeat(TLDR_MAX_CHARS)}"\n`.repeat(4)}`,
    ),
  )
  assertEquals(most.tldr.length, 4)
})

/** A static dir holding a cover PNG under `img/blog/<dir>/` and the named WebPs. */
function coverDir(covers: Record<string, string[]>): string {
  const dir = Deno.makeTempDirSync()
  for (const [name, files] of Object.entries(covers)) {
    Deno.mkdirSync(`${dir}/img/blog/${name}`, { recursive: true })
    for (const file of files) {
      Deno.writeFileSync(`${dir}/img/blog/${name}/${file}`, new Uint8Array([1]))
    }
  }
  return dir
}

/** Every file a post's cover needs, as `scripts/blog-cover.sh` writes them. */
const ALL_COVER_FILES = [
  "cover.png",
  "cover.webp",
  "cover-480.webp",
  "cover-full.webp",
  "cover-full-480.webp",
]

const WITH_COVER = (path: string) =>
  VALID.replace("/img/blog/ship-it-today/cover.png", path)

Deno.test("a cover PNG under static/img with its four WebP copies beside it is kept", () => {
  const dir = coverDir({ ok: ALL_COVER_FILES })
  try {
    const post = parseBlogArticle(
      "a-post",
      WITH_COVER("/img/blog/ok/cover.png"),
      dir,
    )
    assertEquals(post.coverImage, "/img/blog/ok/cover.png")
    assertEquals(coverWebp(post.coverImage), {
      full: "/img/blog/ok/cover.webp",
      small: "/img/blog/ok/cover-480.webp",
      whole: "/img/blog/ok/cover-full.webp",
      wholeSmall: "/img/blog/ok/cover-full-480.webp",
    })
  } finally {
    Deno.removeSync(dir, { recursive: true })
  }
})

Deno.test("a missing cover or alt, a cover outside static/img, of another type, or without its WebP copies fails naming the file", () => {
  const dir = coverDir({
    ok: ALL_COVER_FILES,
    "no-webp": ALL_COVER_FILES.filter((f) => f !== "cover.webp"),
    "no-small": ALL_COVER_FILES.filter((f) => f !== "cover-480.webp"),
    "no-whole": ALL_COVER_FILES.filter((f) => f !== "cover-full.webp"),
    "no-whole-small": ALL_COVER_FILES.filter(
      (f) => f !== "cover-full-480.webp",
    ),
  })
  Deno.writeFileSync(`${dir}/secret.png`, new Uint8Array([1]))
  try {
    const cases: [string, string][] = [
      [WITH_COVER("https://example.com/cover.png"), "must be a /img/... path"],
      [WITH_COVER("/img/../secret.png"), "must be a /img/... path"],
      [WITH_COVER("/img/blog/ok/cover.webp"), "must be a /img/... path"],
      [
        WITH_COVER("/img/blog/missing/cover.png"),
        "/img/blog/missing/cover.png is not a file under",
      ],
      [
        WITH_COVER("/img/blog/no-webp/cover.png"),
        "/img/blog/no-webp/cover.webp is not a file under",
      ],
      [
        WITH_COVER("/img/blog/no-small/cover.png"),
        "/img/blog/no-small/cover-480.webp is not a file under",
      ],
      [
        WITH_COVER("/img/blog/no-whole/cover.png"),
        "/img/blog/no-whole/cover-full.webp is not a file under",
      ],
      [
        WITH_COVER("/img/blog/no-whole-small/cover.png"),
        "/img/blog/no-whole-small/cover-full-480.webp is not a file under",
      ],
      [
        variant('coverImage: "/img/blog/ship-it-today/cover.png"\n', ""),
        '"coverImage" is missing',
      ],
      [
        WITH_COVER("/img/blog/ok/cover.png").replace(
          'coverAlt: "A cover."\n',
          "",
        ),
        '"coverAlt" is missing',
      ],
    ]
    for (const [raw, message] of cases) {
      const err = assertThrows(() => parseBlogArticle("bad-post", raw, dir))
      const text = (err as Error).message
      assertEquals(text.includes("content/blog/bad-post.md"), true, text)
      assertEquals(text.includes(message), true, `${message} not in: ${text}`)
    }
  } finally {
    Deno.removeSync(dir, { recursive: true })
  }
})

Deno.test("every post's cover is a 1000x420 PNG", () => {
  for (const { slug, coverImage } of blogArticles) {
    const png = Deno.readFileSync(`static${coverImage}`)
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    // A PNG's IHDR chunk holds the width and height at bytes 16 and 20.
    assertEquals(
      [view.getUint32(16), view.getUint32(20)],
      [1000, 420],
      `${slug}: ${coverImage}`,
    )
  }
})

Deno.test("a {proof:<id>} placeholder reads the figure from lib/proof.ts", () => {
  assertEquals(
    fillProof("from {proof:projects} projects"),
    `from ${proof("projects")} projects`,
  )
  assertThrows(
    () => fillProof("{proof:nope}"),
    Error,
    'no proof figure "nope"',
  )
})

Deno.test("every post in content/blog loads, newest first, with the Seed title from lib/proof.ts", () => {
  assertEquals(blogArticles.length > 10, true, "too few posts loaded")
  const sorted = [...blogArticles].sort(byNewest)
  assertEquals(blogArticles.map((a) => a.slug), sorted.map((a) => a.slug))
  const seed = blogArticles.find((a) => a.slug === "seed-saas-starter")
  assertEquals(
    seed?.title,
    `Seed: the SaaS starter I distilled from ${
      proof("projects")
    } projects, and how I over-engineered v1`,
  )
})

Deno.test("posts published the same day keep one order by slug", () => {
  const a = parseBlogArticle("b-second", VALID)
  const b = parseBlogArticle("a-first", VALID)
  assertEquals([a, b].sort(byNewest).map((x) => x.slug), [
    "a-first",
    "b-second",
  ])
})

Deno.test("a {proof:<id>} placeholder in a TL;DR line is filled with the figure", () => {
  const article = parseBlogArticle(
    "a-post",
    variant('- "First point."', '- "Over {proof:projects} projects."'),
  )
  assertEquals(article.tldr, [
    `Over ${proof("projects")} projects.`,
    "Second point.",
  ])
})

Deno.test("a post published on or after the cutoff needs an intro", () => {
  const dated = (extra: string) =>
    variant(
      'publishedAt: "2026-09-26"',
      `publishedAt: "${LETTER_FIELDS_FROM}"${extra}`,
    )
  const post = parseBlogArticle("a-post", dated('\nintro: "Why I wrote it."'))
  assertEquals(post.intro, "Why I wrote it.")
  assertThrows(
    () => parseBlogArticle("a-post", dated("")),
    Error,
    '"intro" is missing',
  )
  // The day before the cutoff, no intro is needed.
  parseBlogArticle("a-post", VALID)
})

Deno.test("an older post's intro falls back to its description", () => {
  const post = parseBlogArticle("a-post", VALID)
  assertEquals(postIntro(post), "What it is about")
  assertEquals(postIntro({ ...post, intro: "I" }), "I")
})
