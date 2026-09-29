// The one 301 table for URLs that no longer exist as written (#188): the old
// `/projects` section, retired blog and project slugs, and a trailing slash on
// a post or project URL. Every entry points at a page that answers 200, never
// at another redirect. Pure and unit-tested without a server, the same pattern
// lib/csp.ts uses — main.ts's middleware is the only caller, and it keeps the
// query string (launch links carry UTM tags).
import { WORK_PATH, workHref, workProjects } from "./work.ts";
import { movedSlugs } from "./tools.ts";

const TOOLS_PATH = "/tools";

/** Old blog slug -> the post that absorbed it. */
const RETIRED_BLOG_SLUGS: Record<string, string> = {
  "self-hosted-caldav-pwa-architecture": "self-hosted-caldav-web-ui-tasks-org",
};

/** Old project slug -> the tool page that replaced it (#231: homelab was reborn as rostok). */
const RETIRED_PROJECT_SLUGS: Record<string, string> = {
  "homelab": "rostok",
};

/** What the table is built from: every slug with a work page and every own project that moved. */
export interface RedirectSources {
  workSlugs: string[];
  /** Old `/work` and `/projects` slug -> its tool page's slug (`lib/tools.ts`'s `movedSlugs`). */
  movedSlugs: Readonly<Record<string, string>>;
}

/**
 * Builds the old-path -> new-path table. Each old path is listed with and
 * without a trailing slash, so both resolve in one hop:
 *
 * - `/projects` -> `/work`;
 * - `/projects/<slug>` -> `/work/<slug>` for a client project;
 * - `/projects/<old>` and `/work/<old>` -> `/tools/<new>` for an own project
 *   that moved to `/tools` (#273);
 * - `/projects/homelab` -> `/tools/rostok` (retired slug);
 * - `/blog/<retired>` -> the post that absorbed it.
 *
 * A `/projects/<x>` with no new home is not in the table and answers 404: a
 * 301 to `/work` for a page that no longer exists is a soft 404 to a search
 * engine.
 */
export function buildRedirectTable(
  { workSlugs, movedSlugs }: RedirectSources,
): Map<string, string> {
  const table = new Map<string, string>();
  const add = (from: string, to: string) => {
    table.set(from, to);
    table.set(`${from}/`, to);
  };
  add("/projects", WORK_PATH);
  for (const slug of workSlugs) add(`/projects/${slug}`, workHref(slug));
  for (const [old, now] of Object.entries(movedSlugs)) {
    add(`/projects/${old}`, `${TOOLS_PATH}/${now}`);
    add(workHref(old), `${TOOLS_PATH}/${now}`);
  }
  for (const [old, now] of Object.entries(RETIRED_PROJECT_SLUGS)) {
    add(`/projects/${old}`, `${TOOLS_PATH}/${now}`);
  }
  for (const [old, now] of Object.entries(RETIRED_BLOG_SLUGS)) {
    add(`/blog/${old}`, `/blog/${now}`);
  }
  return table;
}

/** The site's redirect table, built from `lib/data.ts` and `lib/tools.ts`. */
export const redirectTable: ReadonlyMap<string, string> = buildRedirectTable({
  workSlugs: workProjects().map((p) => p.slug!),
  movedSlugs,
});

/**
 * Returns the path `pathname` should 301 to, or undefined when it needs no
 * redirect. Never touches the query string — the caller keeps it.
 *
 * Besides the table, a `[slug]` route 404s on a trailing slash (lib/head.ts's
 * breadcrumb comment explains why: canonical URLs never carry one), so any
 * `/blog/<slug>/`, `/work/<slug>/` or `/tools/<slug>/` redirects to the slash-free form
 * regardless of whether `<slug>` itself is valid — an unknown slug then 404s
 * the normal way.
 */
export function redirectTarget(
  pathname: string,
  table: ReadonlyMap<string, string> = redirectTable,
): string | undefined {
  // "/" is the one route that keeps its trailing slash and must never redirect.
  if (pathname === "/") return undefined;
  const target = table.get(pathname);
  if (target) return target;
  return pathname.match(/^(\/(?:blog|work|tools)\/[^/]+)\/$/)?.[1];
}

/**
 * `/blog?tab=<topic>` was the old list's filter (#274, SEO 4): the topics
 * are sections of one page now, so any `tab` answers a 301 to `/blog`,
 * keeping every other query parameter (launch links carry UTM tags).
 * Returns undefined for any other URL. `routes/blog/index.tsx` calls it.
 */
export function blogTabRedirect(url: URL): string | undefined {
  if (url.pathname !== "/blog" || !url.searchParams.has("tab")) {
    return undefined;
  }
  const params = new URLSearchParams(url.search);
  params.delete("tab");
  const rest = params.toString();
  return rest ? `/blog?${rest}` : "/blog";
}
