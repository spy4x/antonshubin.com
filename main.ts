import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";

export const app = new App<State>();

// Cache middleware: set Cache-Control per content type.
// On staging (website-stag.*), skip HTML caching for instant feedback.
app.use(async (ctx) => {
  const url = ctx.url.pathname;

  const resp = await ctx.next();
  const isStaging = ctx.url.hostname.startsWith("website-stag.");

  // Staging: cache assets but NOT HTML (instant feedback on deploys)
  if (isStaging) {
    if (
      url.startsWith("/assets/") || url.startsWith("/_fresh/")
    ) {
      resp.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
    } else if (url.startsWith("/img/")) {
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
  if (url.startsWith("/assets/") || url.startsWith("/_fresh/")) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } // Images (rare changes) — cache 7 days, serve stale while refreshing
  else if (url.startsWith("/img/")) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400",
    );
  } // Core static pages — cache 3 days at edge, stale-while-revalidate
  // for PWA background refreshes. The site content changes every few
  // days, so 3 days balances freshness with max edge cache HIT rate.
  else if (
    url === "/" || url === "/how-i-work" || url === "/infrastructure" ||
    url === "/contact-me" || url === "/blog" || url === "/projects" ||
    url === "/catalog" || url === "/pay"
  ) {
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
