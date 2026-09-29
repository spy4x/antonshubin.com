import { crossOriginPreconnect } from "./preconnect.ts";
export const DOMAIN = Deno.env.get("DOMAIN") || "antonshubin.com";
export const BASE_URL = DOMAIN.startsWith("https://")
  ? DOMAIN
  : `https://${DOMAIN}`;
export const SCHEDULE_URL = Deno.env.get("SCHEDULE_URL") || "";
/** Shown after `LOCATION` in the footer (#293); Da Nang is ICT. */
export const TIMEZONE_LABEL = "UTC+7";
/**
 * Where Anton lives (#294): the About page, the Person JSON-LD's
 * `homeLocation` and both llms files read it, so a move changes one line.
 * Change `TIMEZONE_LABEL` with it.
 */
export const LOCATION = "Da Nang, Vietnam";
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
/**
 * Anton's company: its legal name, country and Singapore registration number
 * (UEN). The invoices sentence, both llms files and the `Organization`
 * JSON-LD read it here, so a change of company is one edit.
 */
export const COMPANY = {
  name: "NeatSoft PTE LTD",
  country: "Singapore",
  uen: "202300222R",
} as const;

/** The company as one line: name, country and UEN. */
export const COMPANY_LINE =
  `${COMPANY.name}, ${COMPANY.country} (UEN ${COMPANY.uen})`;

/**
 * The invoices sentence (#293): the footer, `/contact-me` and `/about` show
 * it.
 */
export const INVOICE_NOTE =
  `Invoices are issued by ${COMPANY_LINE}, where I'm co-founder and CEO.`;

/** Anton's X handle, confirmed on 27 Sep 2026 (#193). */
export const X_HANDLE = "@spy4x";
