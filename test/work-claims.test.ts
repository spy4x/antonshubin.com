// The caldav-tasks-web public demo at todos.antonshubin.com stopped running,
// and the claim was removed from the site on 21 September 2026. Nothing in
// the code stops it coming back in a link, a JSON-LD block or an llms file,
// so this guard fetches every page that can carry a project claim and fails
// if the dead host shows up anywhere in the raw response body.
//
// The page set is not hand-written: a hand-written list missed
// /saas-architecture-guide (which renders project descriptions), /pay (a real
// page, deliberately left out of the sitemap because it is noindex) and
// /catalog/<slug> (see PR review round 1). Instead the set is the union of
// (1) every path in the built /sitemap.xml, (2) the routes the sitemap never
// lists (/llms.txt, /llms-full.txt, /sitemap.xml, /rss.xml, /pay), and
// (3) every project and blog slug read straight from lib/data.ts, so a page
// that drops out of the sitemap by accident is still fetched.
import { assert } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { blogArticles, projects } from "../lib/data.ts";

/** Registers a test that gets a running copy of the built site and always stops it. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

const DEAD_HOST = /todos\.antonshubin\.com/i;

/** Every `<loc>` path listed in the built `/sitemap.xml`. */
async function sitemapPaths(site: Site): Promise<string[]> {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

/** Routes that never appear in /sitemap.xml but can still carry a project claim. */
const EXTRA_PATHS = [
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/rss.xml",
  "/pay",
];

const projectPaths = [...projects.my, ...projects.freelance]
  .filter((p) => p.slug)
  .map((p) => `/work/${p.slug}`);

const blogPaths = blogArticles.map((a) => `/blog/${a.slug}`);

/** The de-duplicated union described in the file header above. */
async function guardPaths(site: Site): Promise<string[]> {
  const fromSitemap = await sitemapPaths(site);
  return [
    ...new Set([...fromSitemap, ...EXTRA_PATHS, ...projectPaths, ...blogPaths]),
  ];
}

siteTest(
  "the guard's page set is not vacuous and covers every project claim page",
  async (site) => {
    const fromSitemap = await sitemapPaths(site);
    assert(fromSitemap.length > 0, "sitemap.xml is empty");
    assert(projectPaths.length > 0, "no project pages found in lib/data.ts");
    assert(blogPaths.length > 0, "no blog pages found in lib/data.ts");
    const paths = await guardPaths(site);
    assert(
      paths.includes("/saas-architecture-guide"),
      "/saas-architecture-guide is missing from the guard's page set",
    );
    assert(paths.includes("/pay"), "/pay is missing from the guard's page set");
    assert(
      paths.some((p) => p.startsWith("/catalog/")),
      "no /catalog/<slug> page is in the guard's page set",
    );
    assert(
      paths.includes("/work/todoapp-caldav"),
      "the caldav project page is missing from the guard's page set",
    );
  },
);

siteTest(
  "no page or llms file mentions the dead todos.antonshubin.com demo",
  async (site) => {
    const paths = await guardPaths(site);
    for (const path of paths) {
      const body = await site.html(path);
      assert(!DEAD_HOST.test(body), `${path} mentions todos.antonshubin.com`);
    }
  },
);
