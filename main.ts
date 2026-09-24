import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";
import { buildCsp, originOf, readFreshNonce } from "./lib/csp.ts";
import { SCHEDULE_URL, UMAMI_PRECONNECT_ORIGIN } from "./lib/config.ts";

export const app = new App<State>();

// www → non-www redirect (301 permanent)
app.use(async (ctx) => {
  const hostname = ctx.url.hostname;
  if (hostname.startsWith("www.")) {
    const target = new URL(ctx.url);
    target.hostname = hostname.slice(4);
    return Response.redirect(target.toString(), 301);
  }
  return await ctx.next();
});

// Content-Security-Policy (#177) — every response, not just pages. Own
// middleware instead of Fresh's csp() — see lib/csp.ts's header for why.
// SCHEDULE_URL/UMAMI_URL don't change per request, so their origins are
// computed once here rather than on every response.
const SCHEDULE_ORIGIN = originOf(SCHEDULE_URL);
app.use(async (ctx) => {
  const res = await ctx.next();
  const nonce = readFreshNonce(res);
  res.headers.set(
    "Content-Security-Policy",
    buildCsp({
      nonce,
      umamiOrigin: UMAMI_PRECONNECT_ORIGIN,
      scheduleOrigin: SCHEDULE_ORIGIN,
    }),
  );
  return res;
});

// Core static page routes that change infrequently (cached 3 days at edge).
const CORE_PAGES = new Set([
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

const isAsset = (url: string) =>
  url.startsWith("/assets/") || url.startsWith("/_fresh/");
const isImage = (url: string) => url.startsWith("/img/");

// Cache middleware: set Cache-Control per content type.
// On staging (website-stag.*), skip HTML caching for instant feedback.
app.use(async (ctx) => {
  const url = ctx.url.pathname;

  const resp = await ctx.next();
  const isStaging = ctx.url.hostname.startsWith("website-stag.");

  // Never cache an error. A 404 for a core page (for example /hackathons
  // while its list is empty) would otherwise stay in browsers and at the edge
  // for three days after the page comes back.
  if (resp.status >= 400) {
    resp.headers.set("Cache-Control", "no-store");
    if (isStaging) resp.headers.set("X-Robots-Tag", "noindex, nofollow");
    return resp;
  }

  // Staging: cache assets but NOT HTML (instant feedback on deploys)
  if (isStaging) {
    resp.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (isAsset(url)) {
      resp.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
    } else if (isImage(url)) {
      resp.headers.set(
        "Cache-Control",
        "public, max-age=604800, stale-while-revalidate=86400",
      );
    } else {
      resp.headers.set("Cache-Control", "no-cache, must-revalidate");
    }
    return resp;
  }

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

  // Content-hashed assets — cache forever (fingerprint = immutable)
  if (isAsset(url)) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } // Images (rare changes) — cache 7 days, serve stale while refreshing
  else if (isImage(url)) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400",
    );
  } // Core static pages — cache 3 days at edge, stale-while-revalidate
  // for PWA background refreshes. The site content changes every few
  // days, so 3 days balances freshness with max edge cache HIT rate.
  else if (CORE_PAGES.has(url)) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=259200, stale-while-revalidate=43200",
    );
  }

  return resp;
});

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
