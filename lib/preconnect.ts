/**
 * Pure preconnect helpers. Side-effect-free so they can be unit-tested without
 * touching Deno.env or the Preact/DOM runtime.
 */

/**
 * Origin to emit as `<link rel="preconnect">` for a third-party script.
 *
 * Returns "" — meaning "emit no hint" — when the script URL is empty, is not
 * absolute (a relative path has no origin to connect to), or already lives on
 * the site's own origin. A preconnect to the origin currently serving the
 * document is a no-op the browser discards, and `href=""` resolves back to the
 * document itself, so both cases must be suppressed rather than emitted.
 */
export function crossOriginPreconnect(
  scriptUrl: string,
  siteUrl: string,
): string {
  if (!scriptUrl) return "";
  try {
    const scriptOrigin = new URL(scriptUrl).origin;
    return scriptOrigin === new URL(siteUrl).origin ? "" : scriptOrigin;
  } catch {
    return "";
  }
}
