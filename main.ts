import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";
import { buildCsp, originOf, readFreshNonce } from "./lib/csp.ts";
import { SCHEDULE_URL, UMAMI_PRECONNECT_ORIGIN } from "./lib/config.ts";
import { cacheControlFor, isStagingHost } from "./lib/cache-control.ts";

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

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
