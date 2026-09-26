/**
 * Signed unsubscribe tokens (see #177, #233). A link carries a token, never
 * the subscriber's address, and the server only acts on a token it can verify.
 *
 * New links use the ts-libs signed payload codec
 * (`jsr:@spy4x/platform/signed-payload`): purpose `unsubscribe`, version 1, an
 * empty payload, and the normalized address as the bound context. The MAC
 * covers the address but the token does not carry it, so a token is
 * `<envelope>.<signature>` with the same envelope for every subscriber, and
 * verifying one means checking it against each stored address in turn (see
 * `findSubscriberByToken`) — that keeps the email out of the URL and out of
 * server logs.
 *
 * LEGACY FORMAT — REMOVE LATER (#237). Links sent before #233 carry a bare
 * signature: base64url(HMAC-SHA256(secret, "unsubscribe:" + normalized
 * email)), 43 characters, no dot. `findSubscriberByToken` tries the current
 * format first and falls back to `verifyLegacyToken` only for a token in that
 * shape. It stays until two newsletters have gone out after this change is
 * deployed: every mail sent from then on carries a new-format link, so the
 * first newsletter gives every subscriber one, and the second is one full
 * cycle of grace for someone unsubscribing from an older mail.
 */
import { type } from "arktype";
import { createSignedPayloadCodec } from "@spy4x/platform/signed-payload";
import type { Subscriber } from "./subscribers.ts";
import { BASE_URL, getUnsubscribeSecret } from "./config.ts";

const ENC = new TextEncoder();

/** Same normalization `lib/subscribe.ts` applies before storing an address
 * (trim, then lowercase), so a token is verifiable regardless of how the
 * caller cased or padded the email it started from. */
function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** The empty payload: every bit of meaning is in the purpose and the bound
 * address. `"+": "reject"` refuses a token whose payload grew keys. */
const EMPTY_PAYLOAD = type({ "+": "reject" });

type UnsubscribeCodec = ReturnType<
  typeof createSignedPayloadCodec<typeof EMPTY_PAYLOAD>
>;

let cached: { secret: string; codec: UnsubscribeCodec } | undefined;

/** One codec per secret, so the HMAC key is imported once, not per token or
 * per subscriber. Throws when the secret is unusable (see
 * `getUnsubscribeSecret` for the rule). */
function codecFor(secret: string): UnsubscribeCodec {
  if (cached?.secret !== secret) {
    cached = {
      secret,
      codec: createSignedPayloadCodec({
        secret,
        purpose: "unsubscribe",
        version: 1,
        schema: EMPTY_PAYLOAD,
      }),
    };
  }
  return cached.codec;
}

/** Signs `email` with `secret`, producing the token an unsubscribe link carries. */
export function createUnsubscribeToken(
  email: string,
  secret: string,
): Promise<string> {
  return codecFor(secret).sign({}, { context: normalize(email) });
}

/** A legacy token: an unpadded base64url HMAC-SHA256 signature, no dot. */
const LEGACY_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** A key for the legacy verifier, or `null` when `token` is not in the
 * legacy shape — callers treat that as "no match", never as a crash. */
async function legacyCheck(
  token: string,
  secret: string,
): Promise<{ key: CryptoKey; signature: Uint8Array<ArrayBuffer> } | null> {
  if (!LEGACY_TOKEN.test(token)) return null;
  const padded = token.replaceAll("-", "+").replaceAll("_", "/") + "=";
  const signature = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return { key, signature };
}

/** LEGACY FORMAT — see the module comment for when this goes. Constant-time
 * via `crypto.subtle.verify`, not a string comparison. */
function verifyLegacyToken(
  check: { key: CryptoKey; signature: Uint8Array<ArrayBuffer> },
  email: string,
): Promise<boolean> {
  return crypto.subtle.verify(
    "HMAC",
    check.key,
    check.signature,
    ENC.encode(`unsubscribe:${normalize(email)}`),
  );
}

/** Checks that `token` was signed for `email` under `secret`, in the current
 * format or, for a link sent before #233, the legacy one. Never throws for a
 * malformed token. */
export async function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string,
): Promise<boolean> {
  const current = await codecFor(secret).verify(token, {
    context: normalize(email),
  });
  if (current.ok) return true;
  const legacy = await legacyCheck(token, secret);
  return legacy !== null && await verifyLegacyToken(legacy, email);
}

/**
 * Finds which subscriber, if any, `token` was issued for. A token carries no
 * email, so this checks it against every stored address — the current format
 * first, then, only for a token in the legacy shape, the legacy verifier. A
 * forged token and an address that was already removed both return
 * `undefined` — the caller can't tell them apart, and neither can whoever is
 * holding the link.
 */
export async function findSubscriberByToken(
  subscribers: Subscriber[],
  token: string,
  secret: string,
): Promise<Subscriber | undefined> {
  const codec = codecFor(secret);
  for (const subscriber of subscribers) {
    const result = await codec.verify(token, {
      context: normalize(subscriber.email),
    });
    if (result.ok) return subscriber;
  }
  const legacy = await legacyCheck(token, secret);
  if (!legacy) return undefined;
  for (const subscriber of subscribers) {
    if (await verifyLegacyToken(legacy, subscriber.email)) return subscriber;
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
