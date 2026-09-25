// The unsubscribe-token algorithm links used before #233, for tests that prove
// those links keep working. Restated rather than imported, so the tests keep
// checking against what the old code actually did; lib/unsubscribe.test.ts
// pins its output against a token the old code produced.

/** The pre-#233 algorithm, restated here rather than imported so the test
 * keeps checking against what the old code actually did:
 * base64url(HMAC-SHA256(secret, "unsubscribe:" + normalized email)). */
export async function oldCodeToken(
  email: string,
  secret: string,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`unsubscribe:${email.trim().toLowerCase()}`),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
