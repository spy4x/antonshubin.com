/**
 * Signed subscription-confirmation tokens (#253). `/api/subscribe` mails one
 * to the address it was given, and the address joins the list only when its
 * owner confirms on `/subscribe/confirm`.
 *
 * Same ts-libs signed payload codec as `lib/unsubscribe.ts`, with its own
 * purpose (`subscribe-confirm`), so an unsubscribe token never confirms a
 * subscription and the other way round. Unlike an unsubscribe token this one
 * carries the address, because the list does not hold it yet; the address is
 * also the bound context, so the token cannot be re-pointed at another one.
 * The token expires after {@link CONFIRM_TTL_MS}.
 */
import { type } from "arktype";
import {
  createSignedPayloadCodec,
  SignedPayloadErrorCode,
} from "@spy4x/platform/signed-payload";
import { BASE_URL, getUnsubscribeSecret } from "./config.ts";

/** How long a confirmation link works: three days. `issuedAt` (see
 * {@link verifyConfirmToken}) is the expiry minus this value, so it assumes the
 * TTL a token was signed with: shortening it makes older tokens look newer than
 * they are, and a replay of one passes the unsubscribe check for one old TTL
 * after that deploy. */
export const CONFIRM_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const PAYLOAD = type({ "+": "reject", email: "string" });

type ConfirmCodec = ReturnType<typeof createSignedPayloadCodec<typeof PAYLOAD>>;

let cached:
  | { secret: string; now?: () => number; codec: ConfirmCodec }
  | undefined;

function codecFor(secret: string, now?: () => number): ConfirmCodec {
  if (cached?.secret !== secret || cached.now !== now) {
    cached = {
      secret,
      now,
      codec: createSignedPayloadCodec({
        secret,
        purpose: "subscribe-confirm",
        version: 1,
        schema: PAYLOAD,
        ...(now ? { now } : {}),
      }),
    };
  }
  return cached.codec;
}

/** Signs a confirmation token for `email` (already normalized by the caller). */
export function createConfirmToken(
  email: string,
  secret: string,
  now?: () => number,
): Promise<string> {
  return codecFor(secret, now).sign({ email }, {
    context: email,
    ttlMs: CONFIRM_TTL_MS,
  });
}

/** The reason a token was refused, when it was. */
export type ConfirmTokenResult =
  | { ok: true; email: string; issuedAt: number }
  | { ok: false; reason: "expired" | "invalid" };

/**
 * The address `token` confirms, or why it does not. The address is read from
 * the token, then the signature is checked again with that address as the
 * context, so a token whose payload was swapped for another address fails.
 * `issuedAt` (Unix milliseconds) is the expiry minus {@link CONFIRM_TTL_MS};
 * the signature covers the expiry, so it cannot be moved without the secret.
 */
export async function verifyConfirmToken(
  token: string,
  secret: string,
  now?: () => number,
): Promise<ConfirmTokenResult> {
  const codec = codecFor(secret, now);
  const inside = envelopeInside(token);
  if (inside === undefined) return { ok: false, reason: "invalid" };
  const result = await codec.verify(token, { context: inside.email });
  if (result.ok) {
    return {
      ok: true,
      email: result.value.email,
      issuedAt: inside.expiresAt - CONFIRM_TTL_MS,
    };
  }
  return {
    ok: false,
    reason: result.error === SignedPayloadErrorCode.Expired
      ? "expired"
      : "invalid",
  };
}

/** Reads the unverified address and expiry out of the envelope: the address
 * to use as the context, the expiry to date the token once it verifies. */
function envelopeInside(
  token: string,
): { email: string; expiresAt: number } | undefined {
  try {
    const encoded = token.split(".")[0] ?? "";
    const padded = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)),
    );
    const envelope = JSON.parse(json);
    const email = envelope?.payload?.email;
    const expiresAt = envelope?.expiresAt;
    return typeof email === "string" && Number.isSafeInteger(expiresAt)
      ? { email, expiresAt }
      : undefined;
  } catch {
    return undefined;
  }
}

/** `${BASE_URL}/subscribe/confirm?token=...`: the link the confirmation mail carries. */
export async function confirmLink(
  email: string,
  now?: () => number,
): Promise<string> {
  const token = await createConfirmToken(email, getUnsubscribeSecret(), now);
  return `${BASE_URL}/subscribe/confirm?token=${encodeURIComponent(token)}`;
}
