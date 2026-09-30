// The two halves of a newsletter sign-up (#253). `/api/subscribe` only mails a
// confirmation link to the address it was given: `requestSubscription`. The
// address joins the list when its owner confirms on `/subscribe/confirm`:
// `confirmSubscription`. Kept out of the routes so a test can run both against
// fake storage and a fake mail relay.
import type { SubscriberStore } from "./subscribers.ts";
import { bareAddress } from "./email-field.ts";
import {
  sendConfirmationMail,
  sendSubscribeMails,
  type SubscribeMailDeps,
} from "./subscribe-mail.ts";
import type { ConfirmTokenResult } from "./subscribe-token.ts";

/** Link building and mail for {@link requestSubscription}. */
export interface RequestSubscriptionDeps {
  /** The confirmation link for a normalized address. Throws when it cannot be
   * signed, e.g. without UNSUBSCRIBE_SECRET. */
  confirmLink(email: string): Promise<string>;
  mail: SubscribeMailDeps;
  log?: { error(...args: unknown[]): void };
}

/** The HTTP answer, plus the mail still in flight (the route does not wait
 * for it; a test does). */
export interface RequestSubscriptionOutcome {
  status: number;
  body: Record<string, unknown>;
  mails: Promise<void>;
}

/**
 * Mails a confirmation link to the address in `field` (the request's raw
 * email field). Nothing is stored: the list is neither read nor written, so a
 * known address and a new one get the same answer, the same mail and the same
 * work, and the route cannot be used to test who is on the list.
 *
 * Only a bare address is accepted (#255): anything else answers 400 before a
 * link is built. The address is lowercased.
 *
 * A missing or unusable UNSUBSCRIBE_SECRET answers 500 to every request, so a
 * misconfigured site never says "check your inbox" for a mail it cannot send.
 */
export async function requestSubscription(
  field: unknown,
  deps: RequestSubscriptionDeps,
): Promise<RequestSubscriptionOutcome> {
  const log = deps.log ?? console;
  const none = Promise.resolve();

  const email = bareAddress(field)?.toLowerCase();
  if (!email) {
    return {
      status: 400,
      body: { error: "Valid email is required" },
      mails: none,
    };
  }

  let link: string;
  try {
    link = await deps.confirmLink(email);
  } catch (err) {
    log.error("[SUBSCRIBE] cannot build confirmation link:", err);
    return {
      status: 500,
      body: { error: "Server misconfigured" },
      mails: none,
    };
  }

  const mails = sendConfirmationMail({ email, confirmLink: link }, deps.mail)
    .catch((err) => log.error("[SUBSCRIBE] mail failed:", err));
  return { status: 200, body: { ok: true }, mails };
}

/** Storage, token checking, link signing and mail for {@link confirmSubscription}. */
export interface ConfirmSubscriptionDeps {
  /** The subscriber list's read-change-write; throws when the file cannot
   * be parsed or written. */
  update: SubscriberStore["update"];
  /** Reads the address out of a confirmation token, or says why it is refused. */
  verify(token: string): Promise<ConfirmTokenResult>;
  /** Throws when the link cannot be signed, e.g. without UNSUBSCRIBE_SECRET. */
  unsubscribeLink(email: string): Promise<string>;
  mail: SubscribeMailDeps;
  now?: () => Date;
  log?: { error(...args: unknown[]): void };
}

/** What confirming a link led to. `mails` is in flight; a test waits for it. */
export type ConfirmSubscriptionOutcome =
  | { state: "confirmed"; email: string; mails: Promise<void> }
  | { state: "expired" | "invalid" | "error" };

/**
 * Adds the address `token` confirms to the list, unless it is already there,
 * then welcomes the subscriber and notifies the owner. Confirming a second
 * time (a reload, a double click) changes nothing and sends nothing.
 *
 * The unsubscribe link is built before anything is saved, so an address is
 * never stored with an unsubscribe link that cannot work.
 */
export async function confirmSubscription(
  token: string,
  deps: ConfirmSubscriptionDeps,
): Promise<ConfirmSubscriptionOutcome> {
  const log = deps.log ?? console;
  const checked = await deps.verify(token);
  if (!checked.ok) return { state: checked.reason };
  const email = checked.email;

  let link: string;
  try {
    link = await deps.unsubscribeLink(email);
  } catch (err) {
    log.error("[SUBSCRIBE] cannot build unsubscribe link:", err);
    return { state: "error" };
  }

  let added: boolean;
  let total: number;
  try {
    ({ added, total } = await deps.update<{ added: boolean; total: number }>(
      (subs) => {
        const known = subs.some((s) => s.email === email);
        if (known) {
          return { result: { added: false, total: subs.length } };
        }
        const list = [...subs, {
          email,
          subscribedAt: (deps.now?.() ?? new Date()).toISOString(),
        }];
        return { list, result: { added: true, total: list.length } };
      },
    ));
  } catch (err) {
    log.error("[SUBSCRIBE] failed to save:", err);
    return { state: "error" };
  }
  if (!added) return { state: "confirmed", email, mails: Promise.resolve() };

  const mails = sendSubscribeMails(
    { email, total, unsubscribeLink: link },
    deps.mail,
  ).catch((err) => log.error("[SUBSCRIBE] mail failed:", err));
  return { state: "confirmed", email, mails };
}
