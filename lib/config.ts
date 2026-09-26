import { crossOriginPreconnect } from "./preconnect.ts";
export const DOMAIN = Deno.env.get("DOMAIN") || "antonshubin.com";
export const BASE_URL = DOMAIN.startsWith("https://")
  ? DOMAIN
  : `https://${DOMAIN}`;
export const SCHEDULE_URL = Deno.env.get("SCHEDULE_URL") || "";
/** Shown next to the name in the phone header (#185); Da Nang is ICT. */
export const TIMEZONE_LABEL = "UTC+7";
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

/**
 * Secret key for signing unsubscribe links (#177). Read at call time, not at
 * module load: the rest of the site boots fine without it, so only the code
 * path that actually needs a token (building or verifying one) should fail,
 * and only when it's called. Throws instead of falling back to an empty or
 * short secret — a weak or missing key would make tokens guessable or
 * trivially forgeable.
 *
 * The rule is the ts-libs signed payload codec's (#233), so a secret this
 * accepts never makes the codec throw later: printable ASCII only, and at
 * least 32 characters once surrounding whitespace is trimmed. The secret
 * itself is used untrimmed, as it always was, so existing links still verify.
 */
export function getUnsubscribeSecret(): string {
  const secret = Deno.env.get("UNSUBSCRIBE_SECRET") || "";
  const trimmed = secret.trim();
  if (trimmed.length < 32 || !/^[\x20-\x7e]+$/.test(trimmed)) {
    throw new Error(
      "UNSUBSCRIBE_SECRET is not set, shorter than 32 characters, or not " +
        "printable ASCII. Generate one with `openssl rand -base64 48` " +
        "(see .env.example).",
    );
  }
  return secret;
}

export const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") || "";
export const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
export const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
export const SMTP_FROM = Deno.env.get("SMTP_FROM") || "";
export const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
export const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
export const SAME_AS_URLS = [
  "https://www.upwork.com/freelancers/ashubin",
  "https://github.com/spy4x",
  "https://www.linkedin.com/in/anton-shubin",
  "https://www.youtube.com/@anton-shubin",
  "https://x.com/spy4x",
] as const;

/** Anton's X handle, confirmed on 27 Sep 2026 (#193). */
export const X_HANDLE = "@spy4x";
