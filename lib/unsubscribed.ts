/**
 * The record that stops a confirmation link from re-subscribing someone who
 * has unsubscribed since (#327). A confirmation token works for three days
 * and can be used again and again, so without a record the sequence confirm,
 * unsubscribe, confirm again would put the address back and mail it.
 *
 * Each unsubscribe adds `{ mark, at }` to `<subscribers file>.unsubscribed`
 * (`lib/subscribers.ts` keeps it under the list's lock). `mark` is an
 * HMAC-SHA256 of the address under `UNSUBSCRIBE_SECRET`, so the file holds no
 * address and cannot be checked against a guessed one without the secret. A
 * mark older than {@link CONFIRM_TTL_MS} is dropped the next time the record
 * is written: every token issued before it has expired by then, so it can no
 * longer be replayed and the record stays a few lines long. A token issued
 * after the unsubscribe (the person asked to subscribe again) is not refused.
 */
import type { UnsubscribeMark } from "./subscribers.ts";
import { CONFIRM_TTL_MS } from "./subscribe-token.ts";

const encoder = new TextEncoder();

/** The keyed hash of an address, in hex; the address is trimmed and lowercased
 * first, like everywhere else. */
export async function unsubscribeMark(
  email: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`unsubscribed:${email.trim().toLowerCase()}`),
  );
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** `marks` plus `email` unsubscribing at `now`, without the marks that no
 * token can match any more. An earlier mark for the same address is replaced. */
export async function recordUnsubscribe(
  marks: UnsubscribeMark[],
  email: string,
  secret: string,
  now: Date = new Date(),
): Promise<UnsubscribeMark[]> {
  const mark = await unsubscribeMark(email, secret);
  const oldest = now.getTime() - CONFIRM_TTL_MS;
  return [
    ...marks.filter((m) => m.mark !== mark && Date.parse(m.at) > oldest),
    { mark, at: now.toISOString() },
  ];
}

/** Whether `email` unsubscribed at or after `issuedAt` (Unix milliseconds),
 * that is, whether a token issued then is a replay. */
export async function unsubscribedSince(
  marks: UnsubscribeMark[],
  email: string,
  secret: string,
  issuedAt: number,
): Promise<boolean> {
  const mark = await unsubscribeMark(email, secret);
  return marks.some((m) => m.mark === mark && Date.parse(m.at) >= issuedAt);
}
