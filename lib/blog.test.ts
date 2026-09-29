import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  archiveNoteText,
  latestPostDate,
  postTitleTag,
  readNext,
  relatedService,
  relatedToolLink,
  serviceLabel,
} from "./blog.ts";
import type { BlogArticle } from "./blog-posts.ts";
import { blogArticles } from "./data.ts";
import { toolsForPost } from "./tools.ts";

function post(slug: string, extra: Partial<BlogArticle> = {}): BlogArticle {
  return {
    slug,
    title: `Post ${slug}`,
    description: "About it",
    readTime: 5,
    publishedAt: "2026-01-01",
    topic: "self-hosting",
    ...extra,
  };
}

Deno.test("every post's relatedTool and catalogSlug resolve", () => {
  for (const article of blogArticles) {
    relatedToolLink(article);
    relatedService(article);
  }
});

Deno.test("an unknown relatedTool or catalogSlug throws", () => {
  assertThrows(
    () => relatedToolLink(post("x", { relatedTool: "no-such-tool" })),
    Error,
    'relatedTool "no-such-tool"',
  );
  assertThrows(
    () => relatedService(post("x", { catalogSlug: "no-such-item" })),
    Error,
    'no catalog item "no-such-item"',
  );
});

Deno.test("a relatedTool links its /tools page in one hop and its repository", () => {
  assertEquals(relatedToolLink(post("x", { relatedTool: "mig" })), {
    slug: "mig",
    name: "mig",
    href: "/tools/mig",
    repoUrl: "https://github.com/spy4x/mig",
  });
  assertEquals(
    relatedToolLink(post("x", { relatedTool: "ts-libs" }))?.href,
    "/tools/ts-libs",
  );
});

Deno.test("the service label reads the title and price from lib/catalog.ts", () => {
  const item = relatedService(post("x", { catalogSlug: "strategy-call" }))!;
  assertEquals(
    serviceLabel(item),
    "The same work for you: Strategy session, $150",
  );
});

Deno.test("read next is the same topic, current posts only, newest first", () => {
  const list = [
    post("old", { publishedAt: "2026-01-01" }),
    post("self", { publishedAt: "2026-02-01" }),
    post("new", { publishedAt: "2026-03-01" }),
    post("archived", { publishedAt: "2026-04-01", archived: true }),
    post("other-topic", { publishedAt: "2026-05-01", topic: "ai-mcp" }),
    post("newest", { publishedAt: "2026-06-01" }),
  ];
  assertEquals(readNext(list[1], 3, list).map((a) => a.slug), [
    "newest",
    "new",
    "old",
  ]);
  assertEquals(readNext(list[1], 2, list).map((a) => a.slug), [
    "newest",
    "new",
  ]);
});

Deno.test("no post suggests an archived post under Read next", () => {
  for (const article of blogArticles) {
    for (const next of readNext(article)) {
      assertEquals(
        next.archived ?? false,
        false,
        `${article.slug} -> ${next.slug}`,
      );
    }
  }
});

Deno.test("an archived post's note names the month and year it was written", () => {
  assertEquals(
    archiveNoteText(post("x", { publishedAt: "2022-04-27", archived: true })),
    "Written in April 2022. Kept as written.",
  );
  assertEquals(
    archiveNoteText(
      post("x", {
        publishedAt: "2023-02-12",
        archived: true,
        archiveNote: "I now use Woodpecker.",
      }),
    ),
    "Written in February 2023. Kept as written. I now use Woodpecker.",
  );
});

Deno.test("a title tag drops the name suffix past 55 characters, or uses seoTitle", () => {
  assertEquals(
    postTitleTag(post("x", { title: "Short title" })),
    "Short title — Anton Shubin",
  );
  const long = "A title that is long enough to be cut off by a search result";
  assertEquals(postTitleTag(post("x", { title: long })), long);
  assertEquals(
    postTitleTag(post("x", { title: long, seoTitle: "Short" })),
    "Short",
  );
});

Deno.test("the latest post date skips archived posts and counts updates", () => {
  assertEquals(
    latestPostDate([
      post("a", { publishedAt: "2026-01-01", updatedAt: "2026-05-01" }),
      post("b", { publishedAt: "2026-03-01" }),
      post("c", { publishedAt: "2026-09-01", archived: true }),
    ]),
    "2026-05-01",
  );
});

Deno.test("a post's relatedTool is the tool whose posts list names it, and only that one", () => {
  // lib/tools.ts lists each tool's posts (#273) and a post's front matter
  // names its tool: the two must never disagree.
  for (const article of blogArticles) {
    assertEquals(
      article.relatedTool,
      toolsForPost(article.slug)[0]?.slug,
      article.slug,
    );
    assertEquals(toolsForPost(article.slug).length <= 1, true, article.slug);
  }
});
