/**
 * Refuses cross-site POSTs to the routes that mail or change the subscriber
 * list (#253): `/api/subscribe`, `/api/lead`, `/unsubscribe` and
 * `/subscribe/confirm`. Fresh's `csrf()` does the check: a browser request
 * from another site answers 403, the site's own forms pass, and a request with
 * neither `Origin` nor `Sec-Fetch-Site` passes too. That last case is what a
 * mail client's one-click unsubscribe (RFC 8058) sends.
 *
 * The allowed origin is the configured base URL's, not a fixed host, so
 * staging (`website-stag.antonshubin.com`) accepts its own forms.
 */
import { csrf } from "fresh";
import type { Middleware } from "fresh";
import { BASE_URL } from "./config.ts";
import type { State } from "./utils.ts";

/** The paths the guard covers, without a trailing slash. */
export const CSRF_PATHS = [
  "/api/subscribe",
  "/api/lead",
  "/unsubscribe",
  "/subscribe/confirm",
];

/** True for a path in {@link CSRF_PATHS}, with or without a trailing slash. */
export function isCsrfPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return CSRF_PATHS.includes(path);
}

/** Middleware that applies Fresh's `csrf()` to {@link CSRF_PATHS} only. */
export function siteCsrf(baseUrl = BASE_URL): Middleware<State> {
  const guard = csrf<State>({ origin: new URL(baseUrl).origin });
  return (ctx) => isCsrfPath(ctx.url.pathname) ? guard(ctx) : ctx.next();
}
