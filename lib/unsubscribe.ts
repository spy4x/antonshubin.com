/**
 * Signed unsubscribe tokens (#177). Before this, `/api/unsubscribe` removed
 * any address on a plain `GET ?email=...` — no proof the visitor owned the
 * address. Now a link carries a token instead of the address itself, and the
 * server only acts on a token it can verify.
 *
 * Token = base64url(HMAC-SHA256(secret, "unsubscribe:" + normalized email)).
 * The token carries no email of its own, so verifying one means recomputing
 * it for each stored address and comparing (see `findSubscriberByToken`) —
 * that keeps the email out of the URL and out of server logs.
 */
import type { Subscriber } from "./subscribers.ts";
import { BASE_URL, getUnsubscribeSecret } from "./config.ts";

const ENC = new TextEncoder();

/** Same normalization `routes/api/subscribe.ts` applies before storing an
 * address, so a token is verifiable regardless of how the caller cased or
 * padded the email it started from. */
function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(
    "=",
    "",
  );
}

/** Returns `null` instead of throwing on a malformed token — callers treat
 * that the same as "no subscriber matches", never as a crash. */
function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - (value.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Signs `email` with `secret`, producing the token an unsubscribe link carries. */
export async function createUnsubscribeToken(
  email: string,
  secret: string,
): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    ENC.encode(`unsubscribe:${normalize(email)}`),
  );
  return toBase64Url(sig);
}

/** Constant-time check that `token` was signed for `email` under `secret`
 * (via `crypto.subtle.verify`, not a string comparison). */
export async function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string,
): Promise<boolean> {
  const bytes = fromBase64Url(token);
  if (!bytes) return false;
  const key = await importHmacKey(secret);
  return await crypto.subtle.verify(
    "HMAC",
    key,
    // Uint8Array.from()'s TS type is generic over ArrayBufferLike (which
    // includes SharedArrayBuffer), while `verify()` wants the narrower
    // ArrayBuffer-backed BufferSource -- this array is always freshly
    // allocated by `fromBase64Url`, never shared, so the cast is safe.
    bytes as BufferSource,
    ENC.encode(`unsubscribe:${normalize(email)}`),
  );
}

/**
 * Finds which subscriber, if any, `token` was issued for. A token carries no
 * email, so this recomputes the expected token for every stored address and
 * compares. A forged token and an address that was already removed both
 * return `undefined` — the caller can't tell them apart, and neither can
 * whoever is holding the link.
 */
export async function findSubscriberByToken(
  subscribers: Subscriber[],
  token: string,
  secret: string,
): Promise<Subscriber | undefined> {
  for (const subscriber of subscribers) {
    if (await verifyUnsubscribeToken(subscriber.email, token, secret)) {
      return subscriber;
    }
  }
  return undefined;
}

/**
 * The one helper every outgoing email uses to build an unsubscribe link
 * (`routes/api/subscribe.ts`'s welcome and owner-notification mails,
 * `scripts/send-newsletter.ts`) — `${BASE_URL}/unsubscribe?token=...`, never
 * the address itself. Throws when `UNSUBSCRIBE_SECRET` is missing or too
 * short (see `getUnsubscribeSecret`), so a caller that builds the link before
 * saving anything fails the whole request instead of saving an address with
 * no working unsubscribe link.
 */
export async function unsubscribeLink(email: string): Promise<string> {
  const token = await createUnsubscribeToken(email, getUnsubscribeSecret());
  return `${BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}
