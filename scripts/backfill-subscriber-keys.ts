#!/usr/bin/env -S deno run -A
/**
 * Gives every row of the subscriber list its `key` (#405), once, inside the
 * production container after the deploy that moved the list onto
 * `@spy4x/server/subscribers`:
 *
 *   docker exec -i antonshubincom-web deno run -A scripts/backfill-subscriber-keys.ts
 *
 * A row stored before #405 has no key, and a newsletter cannot mail it a
 * working unsubscribe link until it has one (`scripts/send-newsletter.ts`
 * refuses until then). The store does the work under its lock, in one write,
 * and skips rows that already have a key, so a second run changes nothing.
 * It prints counts only, never an address. Back up `data/` first
 * (docs/deploy.md "Subscriber data").
 */
import type { SubscriptionCrypto } from "@spy4x/server/subscribers";
import type { FileSubscriberStore } from "@spy4x/server/subscribers/file";
import {
  subscribersFile,
  subscriberStore,
  subscriptionCrypto,
} from "@/lib/mailing-list.ts";

/** What one run did: rows given a key now, and rows on the list in all. */
export interface BackfillCounts {
  added: number;
  total: number;
}

/** Fills in every missing key; idempotent. */
export async function backfillKeys(
  store: Pick<FileSubscriberStore, "backfillKeys" | "count">,
  crypto: Pick<SubscriptionCrypto, "subscriberKey">,
): Promise<BackfillCounts> {
  const added = await store.backfillKeys(crypto);
  return { added, total: await store.count() };
}

if (import.meta.main) {
  try {
    const { added, total } = await backfillKeys(
      subscriberStore(),
      subscriptionCrypto(),
    );
    console.log(
      `${subscribersFile()}: ${added} of ${total} rows got a key; ` +
        `${total - added} already had one.`,
    );
  } catch (err) {
    // The message names a file or a setting, never a row.
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}
