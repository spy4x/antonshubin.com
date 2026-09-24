import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";
import { buildCsp, originOf, readFreshNonce } from "./lib/csp.ts";
import { SCHEDULE_URL, UMAMI_PRECONNECT_ORIGIN } from "./lib/config.ts";
import { cacheControlFor, isStagingHost } from "./lib/cache-control.ts";
import { redirectTarget } from "./lib/redirects.ts";

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

// Cache middleware: Cache-Control per response (lib/cache-control.ts), and
// noindex on every staging response.
app.use(async (ctx) => {
  const resp = await ctx.next();
  const staging = isStagingHost(ctx.url.hostname);
  if (staging) resp.headers.set("X-Robots-Tag", "noindex, nofollow");

  const cacheControl = cacheControlFor({
    pathname: ctx.url.pathname,
    status: resp.status,
    staging,
    current: resp.headers.get("Cache-Control"),
  });
  if (cacheControl) resp.headers.set("Cache-Control", cacheControl);
  return resp;
});

// Trailing-slash post/project URLs and retired slugs (#193) — placed after
// the CSP and cache middlewares above, so a redirect response still gets
// their headers: returning here without calling ctx.next() still lets those
// two middlewares' post-ctx.next() code run, since they already called
// ctx.next() and are waiting on it to resolve (see main.ts's own header rule
// in AGENTS.md — change headers on the response ctx.next() returned, never
// rebuild it; this middleware is the thing ctx.next() resolves to for them).
app.use(async (ctx) => {
  const target = redirectTarget(ctx.url.pathname);
  if (!target) return await ctx.next();
  return new Response(null, {
    status: 301,
    headers: { Location: target + ctx.url.search },
  });
});

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
