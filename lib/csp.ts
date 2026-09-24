/**
 * Content-Security-Policy builder (#177). `main.ts` wires this into its own
 * middleware instead of using Fresh's `csp()` (`jsr:@fresh/core`'s
 * `middlewares/csp.ts`): Fresh's nonce mode falls back to `'unsafe-inline'`
 * for `script-src`/`style-src` whenever a response carries no render nonce
 * — exactly the hand-built-HTML case this policy exists to close (JSON
 * responses, redirects, the bot-rewritten HTML in
 * `routes/_middleware.ts`). Here, no nonce means no inline script is
 * allowed, full stop.
 *
 * Pure and side-effect-free — no `Deno.env` reads — so it's testable without
 * touching the runtime; `main.ts` reads env-derived origins and passes them
 * in.
 */

/**
 * Fresh writes the current render's nonce onto the `Response` at this key —
 * see `NONCE_SYMBOL` in `jsr:@fresh/core`'s `middlewares/csp.ts` (not
 * re-exported from its main module, so the symbol itself, not an import, is
 * the contract) — on every `ctx.render()` call, and injects the same value
 * as `nonce=` on every JSX `<script>`/`<style>` vnode it renders.
 */
export const FRESH_NONCE_SYMBOL: unique symbol = Symbol.for("__freshNonce");

export interface CspOptions {
  /** The current response's render nonce, if any (see `FRESH_NONCE_SYMBOL`). */
  nonce?: string;
  /** Umami script's origin, only when genuinely cross-origin (see
   * `lib/config.ts`'s `UMAMI_PRECONNECT_ORIGIN`) — "" adds nothing. */
  umamiOrigin?: string;
  /** `SCHEDULE_URL`'s origin, for the booking iframe — "" adds nothing. */
  scheduleOrigin?: string;
}

/** Origin of `url`, or `""` when `url` is empty or not a parseable absolute URL. */
export function originOf(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Builds the `Content-Security-Policy` header value. Directives (#177's
 * design decision D-007):
 * - `script-src`/`connect-src` add the Umami origin only when it's
 *   cross-origin (staging reuses the production `UMAMI_URL`).
 * - `style-src` keeps `'unsafe-inline'` — 14 server-rendered `style="..."`
 *   attributes exist, and a nonce only covers `<style>` elements, not
 *   attributes.
 * - `frame-src` always allows YouTube (blog/project video embeds) and adds
 *   the booking widget's origin only when `SCHEDULE_URL` is set.
 * - No `upgrade-insecure-requests`: production HSTS already forces https,
 *   and the directive would break the plain-http rendered-page tests.
 */
export function buildCsp(options: CspOptions = {}): string {
  const { nonce, umamiOrigin = "", scheduleOrigin = "" } = options;

  const scriptSrc = ["'self'", nonce && `'nonce-${nonce}'`, umamiOrigin]
    .filter(Boolean).join(" ");
  const connectSrc = ["'self'", "https://api.github.com", umamiOrigin]
    .filter(Boolean).join(" ");
  const frameSrc = [
    "https://www.youtube.com",
    "https://youtube.com",
    scheduleOrigin,
  ].filter(Boolean).join(" ");

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");
}
