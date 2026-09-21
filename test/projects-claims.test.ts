// The caldav-tasks-web public demo at todos.antonshubin.com stopped running,
// and the claim was removed from the site on 21 September 2026. Nothing in
// the code stops it coming back in a link, a JSON-LD block or an llms file,
// so this guard fetches every page that can carry a project claim and fails
// if the dead host shows up anywhere in the raw response body.
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

const projectPaths = [...projects.my, ...projects.freelance]
  .filter((p) => p.slug)
  .map((p) => `/projects/${p.slug}`);

const blogPaths = blogArticles.map((a) => `/blog/${a.slug}`);

Deno.test("the guard's page lists are not empty", () => {
  assert(projectPaths.length > 0, "no project pages found");
  assert(blogPaths.length > 0, "no blog pages found");
  assert(
    projectPaths.includes("/projects/todoapp-caldav"),
    "the caldav project page is missing from the list this guard fetches",
  );
});

const PATHS = [
  "/",
  "/projects",
  ...projectPaths,
  "/blog",
  ...blogPaths,
  "/how-i-work",
  "/contact-me",
  "/infrastructure",
  "/catalog",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/rss.xml",
];

siteTest(
  "no page or llms file mentions the dead todos.antonshubin.com demo",
  async (site) => {
    for (const path of PATHS) {
      const body = await site.html(path);
      assert(!DEAD_HOST.test(body), `${path} mentions todos.antonshubin.com`);
    }
  },
);
