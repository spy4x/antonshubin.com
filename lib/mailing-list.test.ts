// The files production holds today must load unchanged after #405. The
// fixtures in test/fixtures/mailing-list were written by the site's own code
// before the switch (lib/subscribers.ts, lib/unsubscribed.ts and
// lib/newsletter-log.ts, under the throwaway secret below), so these tests
// prove the package reads exactly what that code wrote.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { copy } from "jsr:@std/fs@^1.0.0/copy";
import { createSubscriptionCrypto, sendIssue } from "@spy4x/server/subscribers";
import {
  createFileSendLog,
  createFileSubscriberStore,
} from "@spy4x/server/subscribers/file";
import { fakeRelay, fakeSender } from "../test/fake-mail.ts";

const SECRET = "f".repeat(32);
const CRYPTO = createSubscriptionCrypto({ secret: SECRET });
const FIXTURES = new URL("../test/fixtures/mailing-list/", import.meta.url);

/** Copies the fixtures to a temp dir, runs `fn` on the copies, removes them. */
async function withFixtures(
  fn: (paths: { list: string; log: string }) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await copy(FIXTURES, `${dir}/data`);
    await fn({
      list: `${dir}/data/subscribers.json`,
      log: `${dir}/data/newsletter-log.json`,
    });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("reads the subscriber list written before #405, rows without a key included", async () => {
  await withFixtures(async ({ list }) => {
    const store = createFileSubscriberStore({ path: list });
    const rows = await store.list();
    assertEquals(rows.map((row) => row.email), [
      "one@example.com",
      "two@example.com",
      "three@example.com",
    ]);
    assertEquals(
      rows[0].subscribedAt.toISOString(),
      "2026-09-01T10:00:00.000Z",
    );
    assertEquals(rows.map((row) => row.key), [undefined, undefined, undefined]);
    assertEquals(await store.count(), 3);
  });
});

Deno.test("an unsubscribe recorded before #405 still refuses a confirm link issued before it, and accepts a later one", async () => {
  await withFixtures(async ({ list }) => {
    const store = createFileSubscriberStore({ path: list });
    const email = "gone@example.com";
    const input = {
      email,
      key: await CRYPTO.subscriberKey(email),
      mark: await CRYPTO.unsubscribeMark(email),
      at: new Date("2026-10-02T00:00:00.000Z"),
    };
    assertEquals(
      await store.add({
        ...input,
        issuedAt: Date.parse("2026-10-01T11:00:00.000Z"),
      }),
      "replay",
    );
    assertEquals(
      await store.add({
        ...input,
        issuedAt: Date.parse("2026-10-01T13:00:00.000Z"),
      }),
      "added",
    );
  });
});

Deno.test("reads the sent log written before #405: a legacy entry, a partial run and a finished one", async () => {
  await withFixtures(async ({ log }) => {
    const sendLog = createFileSendLog({ path: log });
    const legacy = await sendLog.find("old-post");
    assertEquals(legacy?.recipients, undefined);
    const partial = await sendLog.find("a-post");
    assertEquals(
      [partial?.audience?.length, partial?.recipients?.length],
      [2, 1],
    );
    assertEquals(partial?.completedAt, undefined);
    const done = await sendLog.find("done-post");
    assertEquals(
      done?.completedAt?.toISOString(),
      "2026-09-05T10:01:00.000Z",
    );
  });
});

Deno.test("a rerun on a log written before #405 mails only the audience member it missed, and closed issues send nothing", async () => {
  await withFixtures(async ({ list, log }) => {
    const store = createFileSubscriberStore({ path: list });
    await store.backfillKeys(CRYPTO);
    const sendLog = createFileSendLog({ path: log });
    const relay = fakeRelay();
    const input = {
      subject: "New article: A post",
      letter: { html: "<p>Hi</p>", text: "Hi" },
      subscribers: await store.list(),
      crypto: CRYPTO,
      unsubscribeLink: (token: string) => `https://example.com/u?t=${token}`,
      sender: fakeSender(relay),
      log: { info() {}, error() {} },
    };
    assertEquals(await sendIssue({ ...input, issue: "a-post" }, sendLog), {
      status: "sent",
      sent: 1,
      failed: 0,
      skipped: 2,
    });
    assertEquals(relay.mails.map((m) => m.to), [["two@example.com"]]);
    for (const issue of ["old-post", "done-post"]) {
      const result = await sendIssue({ ...input, issue }, sendLog);
      assertEquals(result.status, "already-sent", issue);
    }
    assertEquals(relay.mails.length, 1);
  });
});
