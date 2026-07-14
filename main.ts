import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";

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
