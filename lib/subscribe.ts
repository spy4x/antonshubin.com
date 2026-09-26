// What `/api/subscribe` does with the posted email field: check it is a bare
// address, store it once, then welcome the subscriber and notify the owner. Kept out of the route so a test
// can run it against fake storage and a fake mail relay.
import type { Subscriber } from "./subscribers.ts";
import { bareAddress } from "./email-field.ts";
import {
  sendSubscribeMails,
  type SubscribeMailDeps,
} from "./subscribe-mail.ts";

/** Storage, link signing and mail for {@link addSubscriber}. */
export interface AddSubscriberDeps {
  load(): Subscriber[];
  /** Throws when the write fails. */
  save(list: Subscriber[]): void;
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
 * The unsubscribe link is built before anything is saved: a missing or
 * unusable UNSUBSCRIBE_SECRET fails the whole request instead of saving an
 * address whose unsubscribe link would never work.
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

  const subs = deps.load();
  if (subs.some((s) => s.email === email)) {
    return {
      status: 200,
      body: { ok: true, message: "Already subscribed" },
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

  subs.push({
    email,
    subscribedAt: (deps.now?.() ?? new Date()).toISOString(),
  });
  try {
    deps.save(subs);
  } catch (err) {
    log.error("[SUBSCRIBE] failed to save:", err);
    return {
      status: 500,
      body: { error: "Could not save subscription" },
      mails: none,
    };
  }

  // Welcome the subscriber and notify the owner.
  const mails = sendSubscribeMails(
    { email, total: subs.length, unsubscribeLink: link },
    deps.mail,
  ).catch((err) => log.error("[SUBSCRIBE] mail failed:", err));

  return { status: 200, body: { ok: true }, mails };
}
