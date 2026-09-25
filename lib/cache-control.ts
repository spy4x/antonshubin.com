// Cache-Control policy per response, applied by main.ts's cache middleware.
// A pure function of the request's path, the response's status and header,
// and whether the request came in on the staging host, so a unit test can
// cover the staging branch: a test's fetch cannot set a Host header.

// Core static page routes that change infrequently (cached 3 days at edge).
export const CORE_PAGES = new Set([
  "/",
  "/how-i-work",
  "/infrastructure",
  "/contact-me",
  "/blog",
  "/projects",
  "/tools",
  "/catalog",
  "/pay",
  "/saas-architecture-guide",
  "/hackathons",
]);

const isAsset = (pathname: string) =>
  pathname.startsWith("/assets/") || pathname.startsWith("/_fresh/");
const isImage = (pathname: string) => pathname.startsWith("/img/");

/**
 * Favicons, `manifest.json` and other small static files at the site root —
 * served straight off disk by Fresh's `staticFiles()`, same as `/img/*`, but
 * not under an `/img/` or content-hashed `/assets/`/`/_fresh/` prefix.
 * Treated the same as `/img/*` below.
 */
const isStaticRootFile = (pathname: string) =>
  pathname === "/manifest.json" ||
  /^\/(favicon|apple-icon)[\w.-]*\.(png|ico)$/.test(pathname);

/** True when the host is the staging site (website-stag.*). */
export const isStagingHost = (hostname: string) =>
  hostname.startsWith("website-stag.");

/** What {@link cacheControlFor} decides from. */
export interface CacheInput {
  pathname: string;
  status: number;
  /** Request came in on the staging host (see {@link isStagingHost}). */
  staging: boolean;
  /** The Cache-Control header the route already set, if any. */
  current: string | null;
}

/**
 * Returns the Cache-Control value to set on a response, or `undefined` to
 * leave the route's own header (or none) in place.
 *
 * Order matters, and the static-file tiers (assets/images/static root files)
 * are checked *before* the "respect the route's own no-store" rule below —
 * see that check's own comment for why (#183 follow-up: Fresh's
 * `staticFiles()` stamps every static file it doesn't recognise as
 * content-hashed with `Cache-Control: no-store` by default, and checking
 * `current` first meant that default silently beat every static-file tier
 * below it, on `/fonts/*`, `/img/*`, favicons and unstamped JS chunks alike).
 * A error is never cached, then assets/images/static files, then a route's
 * own deliberate `no-store` (routes/unsubscribe.tsx shows one subscriber's
 * address), then staging's blanket "revalidate every HTML page", then
 * production's core pages.
 */
export function cacheControlFor(
  { pathname, status, staging, current }: CacheInput,
): string | undefined {
  // Never cache an error. A 404 for a core page (for example /hackathons
  // while its list is empty) would otherwise stay in browsers and at the edge
  // for three days after the page comes back.
  if (status >= 400) return "no-store";

  // Content-hashed assets — cache forever (fingerprint = immutable)
  if (isAsset(pathname)) return "public, max-age=31536000, immutable";

  // Images and small static root files (rare changes) — cache 7 days,
  // serve stale while refreshing. Checked before the `current` no-store
  // check below: Fresh's static-file middleware stamps a plain `no-store`
  // on any static file it doesn't itself recognise as content-hashed, and
  // that must not shadow this tier (see this function's own doc comment).
  if (isImage(pathname) || isStaticRootFile(pathname)) {
    return "public, max-age=604800, stale-while-revalidate=86400";
  }

  // A route's own deliberate no-store (not a static file, checked above —
  // routes/unsubscribe.tsx shows one subscriber's address, and every
  // status >= 400 response already returned above) wins from here down.
  if (current?.includes("no-store")) return undefined;

  // Staging: cache assets but NOT HTML (instant feedback on deploys)
  if (staging) return "no-cache, must-revalidate";

  // ── Production caching strategy ──────────────────────────────
  //
  // Cloudflare (orange-cloud) accepts these Cache-Control headers
  // for static assets and caches them at the edge automatically.
  // HTML pages are treated as DYNAMIC by default — to enable edge
  // caching for HTML too, add a CF Cache Rule:
  //   Field: Hostname = antonshubin.com
  //   Then:  Cache Eligibility → Eligible for cache
  //   Edge TTL → 3 days
  // Without that rule, these headers still help the browser cache
  // and the PWA service worker (stale-while-revalidate).
  // Before adding that rule: pages differ by user agent (routes/_app.tsx
  // leaves Umami out for known bots, see lib/bots.ts) and Cloudflare ignores
  // Vary for HTML. A single cached copy would reach everyone, so a bot's
  // page would drop analytics for every visitor. The rule needs a cache key
  // that separates bots from browsers.

  // Core static pages — cache 3 days at edge, stale-while-revalidate
  // for PWA background refreshes. The site content changes every few
  // days, so 3 days balances freshness with max edge cache HIT rate.
  if (CORE_PAGES.has(pathname)) {
    return "public, max-age=259200, stale-while-revalidate=43200";
  }

  return undefined;
}
