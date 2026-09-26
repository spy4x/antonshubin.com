// What `/api/subscribe` does with the posted email field: check it is a bare
// address, store it once, then welcome the subscriber and notify the owner.
// Kept out of the route so a test can run it against fake storage and a fake
// mail relay.
import type { SubscriberStore } from "./subscribers.ts";
import { bareAddress } from "./email-field.ts";
import {
  sendSubscribeMails,
  type SubscribeMailDeps,
} from "./subscribe-mail.ts";

/** Storage, link signing and mail for {@link addSubscriber}. */
export interface AddSubscriberDeps {
  /** The subscriber list's read-change-write; throws when the file cannot
   * be parsed or written. */
  update: SubscriberStore["update"];
  /** Throws when the link cannot be signed, e.g. without UNSUBSCRIBE_SECRET. */
  unsubscribeLink(email: string): Promise<string>;
  mail: SubscribeMailDeps;
  now?: () => Date;
  log?: { error(...args: unknown[]): void };
}

/** The HTTP answer, plus the mails still in flight (the route does not wait
 * for them; a test does). */
export interface AddSubscriberOutcome {
  status: number;
  body: Record<string, unknown>;
  mails: Promise<void>;
}

/**
 * Stores the address in `field` (the request's raw email field) unless it is
 * already on the list.
 *
 * Only a bare address is accepted (#255): anything else answers 400 before the
 * list is read, so nothing is stored and nothing is mailed. The address is
 * stored lowercased.
 *
 * A known address gets the same answer as a new one, so the route cannot be
 * used to test whether an address is on the list. For the same reason the
 * unsubscribe link is built first, for both: a missing or unusable
 * UNSUBSCRIBE_SECRET fails every request the same way, instead of saving an
 * address whose unsubscribe link would never work. The list is saved for both
 * too, so an unwritable file answers 500 to a known address as to a new one.
 * The remaining difference is the mails a new address triggers after the
 * answer, and about 0.1 ms of time; a probe with an unknown address
 * subscribes and mails it, so it cannot go unnoticed.
 */
export async function addSubscriber(
  field: unknown,
  deps: AddSubscriberDeps,
): Promise<AddSubscriberOutcome> {
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
    link = await deps.unsubscribeLink(email);
  } catch (err) {
    log.error("[SUBSCRIBE] cannot build unsubscribe link:", err);
    return {
      status: 500,
      body: { error: "Server misconfigured" },
      mails: none,
    };
  }

  let known: boolean;
  let total: number;
  try {
    // The list is read inside the update, under the lock, after the link
    // is built: a read taken earlier would be stale by the time it is written.
    ({ known, total } = await deps.update((subs) => {
      const known = subs.some((s) => s.email === email);
      const list = known ? subs : [...subs, {
        email,
        subscribedAt: (deps.now?.() ?? new Date()).toISOString(),
      }];
      // Written for a known address too, so a failing write answers both the
      // same way (#278).
      return { list, result: { known, total: list.length } };
    }));
  } catch (err) {
    log.error("[SUBSCRIBE] failed to save:", err);
    return {
      status: 500,
      body: { error: "Could not save subscription" },
      mails: none,
    };
  }
  if (known) return { status: 200, body: { ok: true }, mails: none };

  // Welcome the subscriber and notify the owner.
  const mails = sendSubscribeMails(
    { email, total, unsubscribeLink: link },
    deps.mail,
  ).catch((err) => log.error("[SUBSCRIBE] mail failed:", err));

  return { status: 200, body: { ok: true }, mails };
}
