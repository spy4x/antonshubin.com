/**
 * The site's wiring of the mailing list (#405). Every rule lives in
 * `@spy4x/server/subscribers`: double opt-in, signed confirm and unsubscribe
 * links, the replay rule, the file store and the send log. This module only
 * says where the files are, which secret signs the links and what the links
 * look like on this site.
 *
 * Paths are read from the environment at call time, not at import, so a test
 * can point `SUBSCRIBERS_FILE` at a temp file per run.
 */
import {
  createSubscriptionCrypto,
  type FlowDeps,
  type MailOutcome,
  type SubscriberMail,
  type SubscriptionCrypto,
} from "@spy4x/server/subscribers";
import {
  createFileSendLog,
  createFileSubscriberStore,
  type FileSubscriberStore,
} from "@spy4x/server/subscribers/file";
import type { SendLog } from "@spy4x/server/subscribers";
import { BASE_URL, getUnsubscribeSecret } from "./config.ts";

/** The subscriber list unless `SUBSCRIBERS_FILE` says otherwise. Its
 * unsubscribe record is `<file>.unsubscribed`, its lock `<file>.lock`. */
export const DEFAULT_SUBSCRIBERS_FILE = "data/subscribers.json";

/** The newsletter's sent log unless `NEWSLETTER_LOG_FILE` says otherwise. */
export const DEFAULT_NEWSLETTER_LOG_FILE = "data/newsletter-log.json";

/** The list file in use now. */
export function subscribersFile(): string {
  return Deno.env.get("SUBSCRIBERS_FILE") || DEFAULT_SUBSCRIBERS_FILE;
}

/** The sent-log file in use now. */
export function newsletterLogFile(): string {
  return Deno.env.get("NEWSLETTER_LOG_FILE") || DEFAULT_NEWSLETTER_LOG_FILE;
}

/** The subscriber list as a store. Cheap to build: every store on one path
 * shares the package's in-process queue and the lock file. */
export function subscriberStore(): FileSubscriberStore {
  return createFileSubscriberStore({ path: subscribersFile() });
}

/** The newsletter's sent log. */
export function newsletterLog(): SendLog {
  return createFileSendLog({ path: newsletterLogFile() });
}

let cached: { secret: string; crypto: SubscriptionCrypto } | undefined;

/**
 * Tokens and keyed hashes under `UNSUBSCRIBE_SECRET`. Throws when the secret
 * is missing or unusable (`getUnsubscribeSecret`). Under the same secret the
 * links and marks the site minted before #405 still verify and match.
 */
export function subscriptionCrypto(): SubscriptionCrypto {
  const secret = getUnsubscribeSecret();
  if (cached?.secret !== secret) {
    cached = { secret, crypto: createSubscriptionCrypto({ secret }) };
  }
  return cached.crypto;
}

/** `${BASE_URL}/unsubscribe?token=...`: the link every mail to a subscriber
 * carries, in its footer and its `List-Unsubscribe` header. */
export function unsubscribeUrl(token: string): string {
  return `${BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** `${BASE_URL}/subscribe/confirm?token=...`: the link the confirm mail carries. */
export function confirmUrl(token: string): string {
  return `${BASE_URL}/subscribe/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Everything the package's flows need. Throws when `UNSUBSCRIBE_SECRET` is
 * unusable; each route turns that into the answer it gave before.
 */
export function flowDeps(
  sendMail: (mail: SubscriberMail) => Promise<MailOutcome>,
): FlowDeps {
  return {
    crypto: subscriptionCrypto(),
    store: subscriberStore(),
    links: { confirm: confirmUrl, unsubscribe: unsubscribeUrl },
    sendMail,
  };
}
