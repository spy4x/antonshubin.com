// The 301 redirect table for URLs that no longer exist as written: a
// trailing slash on a post or project URL, and a slug retired by a rename
// (#193, #231). Pure and unit-tested without a server, the same pattern lib/csp.ts
// uses — main.ts's middleware is the only caller, and it's the one that
// touches the request.

/** Old blog slug -> the post that absorbed it. */
const RETIRED_BLOG_SLUGS: Record<string, string> = {
  "self-hosted-caldav-pwa-architecture": "self-hosted-caldav-web-ui-tasks-org",
};

/** Old project slug -> the project that replaced it (#231: homelab was reborn as rostok). */
const RETIRED_PROJECT_SLUGS: Record<string, string> = {
  "homelab": "rostok",
};

/**
 * Returns the canonical path `pathname` should 301 to, or undefined when it
 * needs no redirect. Never touches the query string — the caller keeps it.
 *
 * A `[slug]` route 404s on a trailing slash (lib/head.ts's breadcrumb
 * comment explains why: canonical URLs never carry one), so any
 * `/blog/<slug>/` or `/projects/<slug>/` redirects to the slash-free form
 * regardless of whether `<slug>` itself is valid — an unknown slug then
 * 404s the normal way instead of via a broken trailing-slash 404.
 *
 * The trailing slash is stripped before the retired-slug lookup, so
 * `/blog/self-hosted-caldav-pwa-architecture/` resolves in one 301, not a
 * 301-to-a-301: a visitor (or crawler) following the old slug with a
 * trailing slash lands on the current post directly.
 */
export function redirectTarget(pathname: string): string | undefined {
  // "/" is the one route that keeps its trailing slash and must never redirect.
  if (pathname === "/") return undefined;

  const trailingSlash = pathname.match(/^(\/(?:blog|projects)\/[^/]+)\/$/);
  const withoutTrailingSlash = trailingSlash ? trailingSlash[1] : pathname;

  const retired = withoutTrailingSlash.match(/^\/blog\/([^/]+)$/);
  if (retired && RETIRED_BLOG_SLUGS[retired[1]]) {
    return `/blog/${RETIRED_BLOG_SLUGS[retired[1]]}`;
  }

  const retiredProject = withoutTrailingSlash.match(/^\/projects\/([^/]+)$/);
  if (retiredProject && RETIRED_PROJECT_SLUGS[retiredProject[1]]) {
    return `/projects/${RETIRED_PROJECT_SLUGS[retiredProject[1]]}`;
  }

  if (trailingSlash) return withoutTrailingSlash;

  return undefined;
}
