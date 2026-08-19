import { crossOriginPreconnect } from "./preconnect.ts";
export const DOMAIN = Deno.env.get("DOMAIN") || "antonshubin.com";
export const BASE_URL = DOMAIN.startsWith("https://")
  ? DOMAIN
  : `https://${DOMAIN}`;
export const SCHEDULE_URL = Deno.env.get("SCHEDULE_URL") || "";
export const UPWORK_URL = Deno.env.get("UPWORK_URL") ||
  "https://www.upwork.com/freelancers/ashubin";
export const UMAMI_URL = Deno.env.get("UMAMI_URL") || "";
export const UMAMI_ID = Deno.env.get("UMAMI_ID") || "";
/**
 * Origin (scheme + host) of the Umami script URL, for `<link rel="preconnect">`
 * and `dns-prefetch` — but only when it is genuinely cross-origin.
 *
 * Empty when analytics is disabled, when UMAMI_URL is relative (no parseable
 * origin), or when the script is served from our own origin. The latter is the
 * current production setup: #66 moved Umami behind the `/umami/` Traefik proxy
 * on the main domain, and preconnecting to the origin already serving the
 * document is a no-op the browser discards.
 */
export const UMAMI_PRECONNECT_ORIGIN = crossOriginPreconnect(
  UMAMI_URL,
  BASE_URL,
);

export const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") || "";
export const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
export const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
export const SMTP_FROM = Deno.env.get("SMTP_FROM") || "";
export const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
export const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
export const SAME_AS_URLS = [
  "https://www.upwork.com/freelancers/ashubin",
  "https://github.com/spy4x",
] as const;
