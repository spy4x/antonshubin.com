// Guards for fixes that exist only in rendered HTML — see issue #135. Two
// separate reviewers restored retired copy, a duplicate <h1>, a missing RSS
// link, and an empty thumbnail alt in throwaway worktrees and watched
// `deno task check` pass every time, because nothing here fetched a built
// page and looked. These tests do that.
//
// Kept deliberately small: assert on structure (counts, presence of a short
// phrase) and never on whole paragraphs of prose, because the prose is being
// rewritten this week and a test that pins a paragraph gets deleted the
// first time it goes red for the wrong reason.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";

/** Every `<loc>` path listed in the built `/sitemap.xml`. */
async function sitemapPaths(site: Site): Promise<string[]> {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

/** Blog post slugs, derived from the sitemap rather than `content/blog/` so this
 * guards what actually ships, not what's on disk. */
async function blogSlugsFromSitemap(site: Site): Promise<string[]> {
  const paths = await sitemapPaths(site);
  return paths
    .filter((p) => p.startsWith("/blog/"))
    .map((p) => p.slice("/blog/".length));
}

Deno.test("how-i-work renders exactly five promise cards", async () => {
  const site = await startSite();
  try {
    const body = await site.html("/how-i-work");
    assertEquals(count(body, /\bdata-promise\b/g), 5);
  } finally {
    await site.stop();
  }
});

// Retired by issue #119 / PR #131. Confirmed absent from every page below on
// `main` at 8af3288 before this guard was added (curled each page and
// grepped case-insensitively for each phrase; zero hits).
//
// Two phrases from the issue's own list are deliberately left out:
//  - "Fixed-price milestones, plain-English decisions" — still live today in
//    the `Person` JSON-LD in components/SEOHead.tsx, which renders on every
//    page below (issue #134, not yet fixed). Asserting it here would fail on
//    today's correct-per-scope `main`, so it stays out until #134 lands.
//  - "48 hours" / "fractional CTO" — issue #134 says a follow-up PR handles
//    these; out of scope for this guard.
const RETIRED_PHRASES = [
  "14-Day",
  "Mutual Alignment Guarantee",
  "no questions asked",
  "Scope Lock",
  "Terms of Engagement",
  "No Jargon Guarantee",
  "Zero micromanagement",
  "IP Sovereignty",
  "V2 Backlog",
];

const RETIRED_PHRASE_PAGES = [
  "/",
  "/how-i-work",
  "/catalog",
  "/contact-me",
  "/llms.txt",
  "/llms-full.txt",
];

Deno.test("retired promise copy does not reappear on rendered pages", async (t) => {
  const site = await startSite();
  try {
    for (const path of RETIRED_PHRASE_PAGES) {
      await t.step(path, async () => {
        const body = (await site.html(path)).toLowerCase();
        for (const phrase of RETIRED_PHRASES) {
          assert(
            !body.includes(phrase.toLowerCase()),
            `${path} still contains retired phrase "${phrase}"`,
          );
        }
      });
    }
  } finally {
    await site.stop();
  }
});

Deno.test("every blog post renders exactly one h1", async (t) => {
  const site = await startSite();
  try {
    const slugs = await blogSlugsFromSitemap(site);
    assert(
      slugs.length > 0,
      "sitemap.xml lists no /blog/ pages — the loop below would pass vacuously",
    );
    for (const slug of slugs) {
      await t.step(slug, async () => {
        const body = await site.html(`/blog/${slug}`);
        assertEquals(count(body, /<h1\b/gi), 1);
      });
    }
  } finally {
    await site.stop();
  }
});

Deno.test("every sitemap page announces /rss.xml exactly once", async (t) => {
  const site = await startSite();
  try {
    const paths = await sitemapPaths(site);
    assert(
      paths.length > 0,
      "sitemap.xml is empty — the loop below would pass vacuously",
    );
    for (const path of paths) {
      await t.step(path, async () => {
        const body = await site.html(path);
        assertEquals(count(body, /application\/rss\+xml/g), 1);
      });
    }
  } finally {
    await site.stop();
  }
});

/**
 * An `<img>` passes only with a non-empty `alt="..."`, unless it is marked
 * decorative (`aria-hidden="true"` or `role="presentation"`) — none of the
 * site's current images are, but the exception is here so a legitimately
 * decorative image doesn't force a fake alt text later. Fresh's precompiled
 * JSX renders an empty `alt=""` as a bare, valueless `alt` attribute rather
 * than `alt=""` (see PR #132's evidence), so "missing" and "present but
 * empty" both simply fail to match `alt="<at least one char>"` — no need to
 * special-case them.
 */
function imagesWithBadAlt(html: string): string[] {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  return tags.filter((tag) => {
    const decorative = /aria-hidden\s*=\s*"true"/i.test(tag) ||
      /role\s*=\s*"presentation"/i.test(tag);
    return !decorative && !/\balt\s*=\s*"[^"]+"/i.test(tag);
  });
}

Deno.test("no rendered image has an empty or missing alt", async (t) => {
  const site = await startSite();
  try {
    const paths = await sitemapPaths(site);
    assert(
      paths.length > 0,
      "sitemap.xml is empty — the loop below would pass vacuously",
    );
    for (const path of paths) {
      await t.step(path, async () => {
        const body = await site.html(path);
        const bad = imagesWithBadAlt(body);
        assertEquals(
          bad,
          [],
          `${path} has an <img> without a real alt: ${bad.join(", ")}`,
        );
      });
    }
  } finally {
    await site.stop();
  }
});

interface FaqEntry {
  name: string;
  acceptedAnswer: { text: string };
}

function isFaqPage(value: unknown): value is { mainEntity: FaqEntry[] } {
  return typeof value === "object" && value !== null &&
    (value as Record<string, unknown>)["@type"] === "FAQPage";
}

/**
 * Splits on sentence-ending punctuation rather than checking the whole
 * (desc + " " + why) string as one run: the visible page inserts the label
 * "Why this matters:" between desc and why (confirmed in PR #131), so the
 * joined JSON-LD string is never contiguous in the rendered text even when
 * the page is correct. Each individual sentence, though, is exactly what one
 * of the two source strings contains, so it must appear verbatim.
 */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

Deno.test("how-i-work FAQ JSON-LD matches the visible text", async () => {
  const site = await startSite();
  try {
    const body = await site.html("/how-i-work");
    const text = visibleText(body);
    const faq = jsonLd(body).find(isFaqPage);
    assert(faq, "no FAQPage JSON-LD found on /how-i-work");
    assert(
      faq.mainEntity.length > 0,
      "FAQPage JSON-LD has no questions — the loop below would pass vacuously",
    );
    for (const entry of faq.mainEntity) {
      assert(
        text.includes(entry.name),
        `question missing from visible text: "${entry.name}"`,
      );
      for (const sentence of sentences(entry.acceptedAnswer.text)) {
        assert(
          text.includes(sentence),
          `answer sentence missing from visible text: "${sentence}"`,
        );
      }
    }
  } finally {
    await site.stop();
  }
});

Deno.test("every sitemap page responds 200", async (t) => {
  const site = await startSite();
  try {
    const paths = await sitemapPaths(site);
    assert(
      paths.length > 0,
      "sitemap.xml is empty — the loop below would pass vacuously",
    );
    for (const path of paths) {
      await t.step(path, async () => {
        const res = await site.get(path);
        await res.body?.cancel();
        assertEquals(res.status, 200, `GET ${path}`);
      });
    }
  } finally {
    await site.stop();
  }
});
