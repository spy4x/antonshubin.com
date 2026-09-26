// Issue #156: `SCHEDULE_URL` falls back to the empty string when unset
// (lib/config.ts), and nine "book a call" call sites rendered
// `<a href={SCHEDULE_URL}>` directly, so an unset variable produced
// `href=""` — a click just reloaded the current page in a new tab.
// components/BookCallLink.tsx fixes this by rendering nothing when its
// resolved URL is empty. This guard walks every page a regression in that
// component, or a call site reverting to a plain `<a href={SCHEDULE_URL}>`,
// could break, and fails on any `<a>` with a missing or empty `href`.
//
// The page set mirrors test/work-claims.test.ts: the union of every path
// in the built `/sitemap.xml`, `/pay` (a real page left out of the sitemap
// because it is noindex), and every project and blog slug from lib/data.ts,
// so a page that drops out of the sitemap by accident is still fetched.
import { assert } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { blogArticles, projects } from "../lib/data.ts";

/** Every `<loc>` path listed in the built `/sitemap.xml`. */
async function sitemapPaths(site: Site): Promise<string[]> {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

// A real page, deliberately left out of the sitemap because it is noindex.
const EXTRA_PATHS = ["/pay"];

const projectPaths = [...projects.my, ...projects.freelance]
  .filter((p) => p.slug)
  .map((p) => `/work/${p.slug}`);

const blogPaths = blogArticles.map((a) => `/blog/${a.slug}`);

/** Sitemap paths, `/pay`, and every project/blog slug, de-duplicated. */
async function guardPaths(site: Site): Promise<string[]> {
  const fromSitemap = await sitemapPaths(site);
  return [
    ...new Set([
      ...fromSitemap,
      ...EXTRA_PATHS,
      ...projectPaths,
      ...blogPaths,
    ]),
  ];
}

/** All `<a ...>` opening tags in `html`, in document order. */
function anchorTags(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
}

/**
 * The `href` value of an anchor opening tag, or `null` when there is no
 * `href` attribute at all (including a bare `href` with no `=`).
 */
function hrefValue(tag: string): string | null {
  const match = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? "";
}

/** True when `tag` has no `href`, or one that is empty or whitespace-only. */
function hasDeadHref(tag: string): boolean {
  const value = hrefValue(tag);
  return value === null || value.trim() === "";
}

Deno.test("no page renders a dead <a href> when SCHEDULE_URL is unset", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.delete("SCHEDULE_URL");
  const site = await startSite();
  try {
    const paths = await guardPaths(site);
    assert(paths.length > 0, "the guard's page set is empty");
    for (const path of paths) {
      const body = await site.html(path);
      for (const tag of anchorTags(body)) {
        assert(
          !hasDeadHref(tag),
          `${path}: found an <a> with a missing or empty href: ${tag}`,
        );
      }
    }
  } finally {
    await site.stop();
    if (previous !== undefined) Deno.env.set("SCHEDULE_URL", previous);
  }
});
