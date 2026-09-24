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
  "/catalog",
  "/pay",
  "/saas-architecture-guide",
  "/hackathons",
]);

const isAsset = (pathname: string) =>
  pathname.startsWith("/assets/") || pathname.startsWith("/_fresh/");
const isImage = (pathname: string) => pathname.startsWith("/img/");

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
 * Order matters: an error is never cached, then a route's own `no-store`
 * wins over every tier below it (routes/unsubscribe.tsx shows one
 * subscriber's address), then assets and images, then staging's blanket
 * "revalidate every HTML page", then production's core pages.
 */
export function cacheControlFor(
  { pathname, status, staging, current }: CacheInput,
): string | undefined {
  // Never cache an error. A 404 for a core page (for example /hackathons
  // while its list is empty) would otherwise stay in browsers and at the edge
  // for three days after the page comes back.
  if (status >= 400) return "no-store";

  if (current?.includes("no-store")) return undefined;

  // Content-hashed assets — cache forever (fingerprint = immutable)
  if (isAsset(pathname)) return "public, max-age=31536000, immutable";

  // Images (rare changes) — cache 7 days, serve stale while refreshing
  if (isImage(pathname)) {
    return "public, max-age=604800, stale-while-revalidate=86400";
  }

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
