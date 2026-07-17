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
 * Origin (scheme + host) of the Umami script URL, suitable for
 * `<link rel="preconnect">` and `dns-prefetch`. Empty when analytics disabled.
 */
export const UMAMI_URL_ORIGIN = (() => {
  if (!UMAMI_URL) return "";
  try {
    return new URL(UMAMI_URL).origin;
  } catch {
    return "";
  }
})();

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
