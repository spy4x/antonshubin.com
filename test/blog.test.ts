// Rendered-page guards for the Writing redesign (#274, with #191): the post
// header, contents list, archive, author box, "Read next", feed, redirects
// and structured data, read from the built site. See AGENTS.md
// "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { blogArticles } from "../lib/data.ts";
import { TOC_MIN_MINUTES } from "../lib/blog.ts";
import { findTool } from "../lib/tools.ts";

const SITE = "https://antonshubin.com";

function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    // Book only renders with a booking URL (#175); RFC 2606 host.
    const site = await startSite({
      env: { SCHEDULE_URL: "https://meet.example.com" },
    });
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

/** The element carrying `marker`, up to its first closing `tag`. */
function block(html: string, marker: string, tag: string): string {
  const start = html.indexOf(marker);
  if (start === -1) return "";
  const end = html.indexOf(`</${tag}>`, start);
  return html.slice(start, end === -1 ? undefined : end);
}

/** The `<section>` that starts at `marker`, including nested elements. */
function section(html: string, marker: string): string {
  const start = html.indexOf(marker);
  if (start === -1) return "";
  return html.slice(start, html.indexOf("</section>", start));
}

const current = blogArticles.filter((a) => !a.archived);
const archived = blogArticles.filter((a) => a.archived);

Deno.test("the fixture posts cover both current and archived posts", () => {
  assert(current.length > 3, "fewer than four current posts");
  assert(archived.length > 3, "fewer than four archived posts");
  assert(
    blogArticles.some((a) => a.readTime >= TOC_MIN_MINUTES) &&
      blogArticles.some((a) => a.readTime < TOC_MIN_MINUTES),
    "no post on one side of the contents threshold",
  );
});

siteTest(
  "every post opens with its topic, H1, byline, dates and read time",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      assertEquals(count(html, /<h1\b/), 1, article.slug);
      const byline = block(html, "data-byline", "p");
      assert(byline, `${article.slug} has no byline`);
      const text = visibleText(byline);
      assert(text.includes("Anton Shubin"), `${article.slug}: ${text}`);
      assert(
        byline.includes(`<time datetime="${article.publishedAt}">`),
        `${article.slug} does not print its published date`,
      );
      assert(text.includes(`${article.readTime} min read`), text);
      assertEquals(
        text.includes("Updated"),
        article.updatedAt !== undefined,
        `${article.slug}: "Updated" must show exactly when updatedAt is set`,
      );
      if (article.updatedAt) {
        assert(byline.includes(`<time datetime="${article.updatedAt}">`));
      }
      // The cover no longer sits above the H1 (UX 1): no image before it
      // but the byline's portrait and the nav's.
      const beforeH1 = html.slice(html.indexOf("<main"), html.indexOf("<h1"));
      assertEquals(
        count(beforeH1, /\/img\/blog\//),
        0,
        `${article.slug} shows a cover above its H1`,
      );
    }
  },
);

siteTest(
  "every heading id on a post is unique and every h2 and h3 has one",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      const content = html.slice(html.indexOf('class="blog-content'));
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      assertEquals(dupes, [], `${article.slug} repeats ids`);
      const bare = count(
        content.slice(0, content.indexOf("data-closing-band")),
        /<h[23]>/,
      );
      assertEquals(bare, 0, `${article.slug} has a heading without an id`);
    }
  },
);

siteTest(
  "a contents list shows on posts of eight minutes or more, and only there",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      const long = article.readTime >= TOC_MIN_MINUTES;
      assertEquals(html.includes("data-toc"), long, article.slug);
      assertEquals(
        html.includes('aria-label="On this page"'),
        long,
        `${article.slug}: the side column follows the same rule`,
      );
      if (long) {
        const toc = block(html, "data-toc", "details");
        const targets = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
        assert(targets.length > 1, `${article.slug}'s contents list is empty`);
        for (const id of targets) {
          assert(html.includes(`<h2 id="${id}">`), `${article.slug}: #${id}`);
        }
      }
    }
  },
);

siteTest(
  "archived posts carry a dated note and never show up under Read next",
  async (site) => {
    const archivedHrefs = archived.map((a) => `href="/blog/${a.slug}"`);
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      const note = block(html, "data-archive-note", "p");
      if (article.archived) {
        const year = article.publishedAt.slice(0, 4);
        assert(
          visibleText(note).includes(`Written in`) &&
            visibleText(note).includes(year) &&
            visibleText(note).includes("Kept as written."),
          `${article.slug}'s note: ${visibleText(note)}`,
        );
      } else {
        assertEquals(note, "", `${article.slug} is current but has a note`);
      }
      const readNext = section(html, "data-read-next");
      for (const href of archivedHrefs) {
        assert(!readNext.includes(href), `${article.slug} suggests ${href}`);
      }
    }
  },
);

siteTest(
  "Read next lists newer posts of the same topic first",
  async (site) => {
    const html = await site.html("/blog/zond-sso-probe-bridge");
    const readNext = section(html, "data-read-next");
    const slugs = [...readNext.matchAll(/href="\/blog\/([^"]+)"/g)].map((m) =>
      m[1]
    );
    const expected = current
      .filter((a) =>
        a.topic === "self-hosting" && a.slug !== "zond-sso-probe-bridge"
      )
      .slice(0, 3)
      .map((a) => a.slug);
    assertEquals(slugs, expected);
  },
);

siteTest(
  "every post ends with the author box in the closing band: author, Book and the post's own next step",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      // The shared band (#270), with the author in its children slot.
      const box = section(html, "data-closing-band");
      assert(box, `${article.slug} has no closing band`);
      const author = block(box, "data-author-box", "div");
      assert(
        visibleText(author).includes("Anton Shubin"),
        `${article.slug}: the band's children slot holds no author`,
      );
      assertEquals(count(box, /data-primary-book/), 1, article.slug);
      assert(
        box.indexOf("data-author-box") < box.indexOf("data-primary-book"),
        `${article.slug}: the author must come before Book`,
      );
      const text = visibleText(box);
      assert(text.includes("Need this for your product?"), text);
      assert(text.includes("I build greenfield SaaS"), text);
      if (article.catalogSlug) {
        assert(
          box.includes(`href="/catalog/${article.catalogSlug}"`),
          `${article.slug} does not link its service`,
        );
        assert(text.includes("The same work for you:"), text);
      } else if (article.relatedTool) {
        assert(text.includes("The code:"), `${article.slug}: ${text}`);
      } else {
        assert(box.includes('href="/catalog"'), `${article.slug}: ${text}`);
      }
      // One set of links after the post, not five (Mkt 1, 8, 9).
      assert(
        !html.includes("data-post-nav"),
        `${article.slug} keeps Prev/Next`,
      );
      assert(
        !html.includes("twitter.com/intent"),
        `${article.slug} keeps Share`,
      );
    }
  },
);

siteTest(
  "every post in the sitemap opens with its TL;DR heading and list before any other heading",
  async (site) => {
    const xml = await site.html("/sitemap.xml");
    const slugs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => p.startsWith("/blog/"))
      .map((p) => p.slice("/blog/".length));
    assertEquals(
      [...slugs].sort(),
      blogArticles.map((a) => a.slug).sort(),
      "the sitemap and content/blog list different posts",
    );
    let updateNotes = 0;
    for (const slug of slugs) {
      const article = blogArticles.find((a) => a.slug === slug)!;
      const html = await site.html(`/blog/${slug}`);
      const afterTitle = html.slice(html.indexOf("</h1>"));
      const firstHeading = afterTitle.match(/<h[1-6]\b[^>]*>[^<]*/)?.[0] ?? "";
      assert(
        firstHeading.includes('id="tldr"') && firstHeading.endsWith("TL;DR"),
        `${slug}: the first heading after the H1 is ${firstHeading}`,
      );
      const box = section(html, "data-tldr");
      assertEquals(count(box, /<h2\b/), 1, `${slug}: TL;DR heading`);
      assertEquals(count(box, /<li\b/), article.tldr.length, slug);
      const text = visibleText(box);
      for (const line of article.tldr) {
        assert(text.includes(line), `${slug}: no "${line}" in ${text}`);
      }
      // A note at the top of the Markdown (an update) sits directly below
      // the TL;DR, with nothing in between.
      const markdown = await Deno.readTextFile(`content/blog/${slug}.md`);
      const body = markdown.replace(/^---[\s\S]*?---\s*/, "");
      if (!body.startsWith(">")) continue;
      updateNotes++;
      const afterBox = html.slice(
        html.indexOf("</section>", html.indexOf("data-tldr")),
      );
      assert(
        /^<\/section>\s*<div[^>]*class="blog-content[^"]*"[^>]*>\s*<blockquote\b/
          .test(afterBox),
        `${slug}: its update note does not follow the TL;DR`,
      );
    }
    assert(updateNotes > 0, "no post opens with an update note to check");
  },
);

siteTest(
  "a post with a video shows its TL;DR before the video",
  async (site) => {
    const withVideo = blogArticles.filter((a) => a.youtubeVideoId);
    assert(withVideo.length > 0, "no post has a video to check");
    for (const article of withVideo) {
      const html = await site.html(`/blog/${article.slug}`);
      const video = html.indexOf("youtube.com/embed/");
      assert(video > 0, `${article.slug}: no video`);
      const tldr = html.indexOf('id="tldr"');
      assert(tldr > 0, `${article.slug}: no TL;DR heading`);
      assert(
        tldr < video,
        `${article.slug}: the video comes before the TL;DR`,
      );
    }
  },
);

siteTest(
  "every post about a tool shows its live link and repository above the TL;DR, and no other post has the row",
  async (site) => {
    let lives = 0;
    let repos = 0;
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      if (!article.relatedTool) {
        assert(
          !html.includes("data-code-link"),
          `${article.slug} has a project row without a project`,
        );
        continue;
      }
      const tool = findTool(article.relatedTool)!;
      const row = block(html, "data-code-link", "p");
      assert(
        row && html.indexOf("data-code-link") < html.indexOf('id="tldr"'),
        `${article.slug}: no project row above the TL;DR`,
      );
      assert(row.includes(`href="/tools/${tool.slug}"`), row);
      if (tool.live) {
        lives++;
        assert(
          row.includes(`href="${tool.live.href}"`),
          `${article.slug}: no live link in ${row}`,
        );
      }
      if (tool.repo) {
        repos++;
        assert(
          row.includes(`href="https://github.com/${tool.repo}"`),
          `${article.slug}: no repository link in ${row}`,
        );
      }
    }
    assert(lives > 0 && repos > 0, "no post's tool has a live link or a repo");
  },
);

siteTest(
  "each post's BlogPosting uses its 1200x630 PNG and belongs to the Blog",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      const posting = jsonLd(html).find((b) =>
        (b as { "@type"?: string })["@type"] === "BlogPosting"
      ) as Record<string, unknown> | undefined;
      assert(posting, `${article.slug} has no BlogPosting`);
      assertEquals(posting.image, {
        "@type": "ImageObject",
        "url": `${SITE}/img/og/blog/${article.slug}.png`,
        "width": 1200,
        "height": 630,
      });
      assertEquals(posting.isPartOf, {
        "@type": "Blog",
        "@id": `${SITE}/blog#blog`,
        "name": "Writing",
        "url": `${SITE}/blog`,
      });
      assertEquals(
        posting.dateModified,
        article.updatedAt ?? article.publishedAt,
      );
    }
  },
);

siteTest(
  "/blog lists every current post under its topic and the old ones under Archive",
  async (site) => {
    const html = await site.html("/blog");
    assertEquals(
      visibleText(html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)![0]),
      "Writing",
    );
    const archiveAt = html.indexOf('<h2 id="archive"');
    assert(archiveAt > 0, "no Archive heading");
    for (const article of current) {
      const at = html.indexOf(`href="/blog/${article.slug}"`);
      assert(at > 0 && at < archiveAt, `${article.slug} is not above Archive`);
      const topicAt = html.lastIndexOf("<h2 id=", at);
      assert(
        html.startsWith(`<h2 id="${article.topic}"`, topicAt),
        `${article.slug} is not under its topic ${article.topic}`,
      );
    }
    for (const article of archived) {
      const at = html.indexOf(`href="/blog/${article.slug}"`);
      assert(at > archiveAt, `${article.slug} is not under Archive`);
    }
    // The chips jump within the page; no ?tab= URL is left (SEO 4).
    assert(!html.includes("?tab="), "a ?tab= link is left on /blog");
    assertEquals(count(html, /<form\b/), 1, "/blog has no newsletter form");

    const blog = jsonLd(html).find((b) =>
      (b as { "@type"?: string })["@type"] === "Blog"
    ) as { "@id": string; blogPost: { "@id": string }[] } | undefined;
    assert(blog, "no Blog JSON-LD");
    assertEquals(blog["@id"], `${SITE}/blog#blog`);
    assertEquals(
      blog.blogPost.map((p) => p["@id"]).sort(),
      blogArticles.map((a) => `${SITE}/blog/${a.slug}#article`).sort(),
    );
  },
);

siteTest(
  "an old /blog?tab= URL answers one 301 to /blog and keeps other parameters",
  async (site) => {
    const cases: [string, string][] = [
      ["/blog?tab=startups", "/blog"],
      ["/blog?tab=dev-tips&utm_source=x", "/blog?utm_source=x"],
    ];
    for (const [from, to] of cases) {
      const res = await site.get(from);
      await res.body?.cancel();
      assertEquals(res.status, 301, from);
      assertEquals(res.headers.get("location"), to, from);
    }
    const plain = await site.get("/blog?utm_source=x");
    await plain.body?.cancel();
    assertEquals(
      plain.status,
      200,
      "a /blog URL without tab must not redirect",
    );
  },
);

siteTest(
  "the feed lists current posts only and says when it was last built",
  async (site) => {
    const xml = await site.html("/rss.xml");
    assert(xml.includes("<title>Anton Shubin — Writing</title>"), "feed title");
    for (const article of current) {
      assert(xml.includes(`/blog/${article.slug}</link>`), article.slug);
    }
    for (const article of archived) {
      assert(!xml.includes(`/blog/${article.slug}</link>`), article.slug);
    }
    assertEquals(count(xml, /<lastBuildDate>[^<]+<\/lastBuildDate>/), 1);
  },
);

siteTest(
  "the sitemap dates /blog by its newest post and ranks archived posts lower",
  async (site) => {
    const xml = await site.html("/sitemap.xml");
    const entry = (path: string) =>
      xml.match(
        new RegExp(`<url>\\s*<loc>${SITE}${path}</loc>[\\s\\S]*?</url>`),
      )?.[0] ?? "";
    const newest = current
      .map((a) => a.updatedAt ?? a.publishedAt)
      .sort()
      .at(-1)!;
    assert(
      entry("/blog").includes(`<lastmod>${newest}</lastmod>`),
      entry("/blog"),
    );
    for (const article of archived) {
      assert(
        entry(`/blog/${article.slug}`).includes("<priority>0.3</priority>"),
        article.slug,
      );
    }
    for (const article of current) {
      assert(
        entry(`/blog/${article.slug}`).includes("<priority>0.7</priority>"),
        article.slug,
      );
    }
  },
);
