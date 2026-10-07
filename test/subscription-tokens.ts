/**
 * Tokens for the rendered-site tests of the mailing list (#405).
 *
 * `createUnsubscribeToken` is a test-only copy of the builder the site used
 * before #405 (`lib/unsubscribe.ts`, deleted): version 1, purpose
 * `unsubscribe`, an empty payload, and the trimmed, lowercased address as the
 * bound context. Every unsubscribe link mailed before #405 has this shape, so
 * the tests that use it prove such a link still unsubscribes.
 * `LEGACY_TOKEN_FIXTURE` pins one token that the deleted code printed, so a
 * change to this copy cannot quietly follow a change in the package.
 *
 * `createConfirmToken` mints a confirm link the way the package does now.
 */
import { type } from "arktype";
import { createSignedPayloadCodec } from "@spy4x/platform/signed-payload";
import { createSubscriptionCrypto } from "@spy4x/server/subscribers";

/** A token the pre-#405 `createUnsubscribeToken` printed for `email` under `secret`. */
export const LEGACY_TOKEN_FIXTURE = {
  email: "reader@example.com",
  secret: "f".repeat(32),
  token:
    "eyJwdXJwb3NlIjoidW5zdWJzY3JpYmUiLCJ2ZXJzaW9uIjoxLCJwYXlsb2FkIjp7fX0.TGvK8UisFIejyU9etP93tPkgZSh-_MVBnDPgy5ZjVn4",
};

/** A version 1 unsubscribe token for `email`, as mailed before #405. */
export function createUnsubscribeToken(
  email: string,
  secret: string,
): Promise<string> {
  return createSignedPayloadCodec({
    secret,
    purpose: "unsubscribe",
    version: 1,
    schema: type({ "+": "reject" }),
  }).sign({}, { context: email.trim().toLowerCase() });
}

/** A confirm token for `email`, as `/api/subscribe` mails it today, issued at `now()`. */
export function createConfirmToken(
  email: string,
  secret: string,
  now?: () => number,
): Promise<string> {
  return createSubscriptionCrypto({ secret, now }).confirmToken(email);
}
