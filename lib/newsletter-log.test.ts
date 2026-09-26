import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { loadNewsletterLog, sendNewsletterOnce } from "./newsletter-log.ts";
import type { NewsletterIssue } from "./newsletter.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

function issue(relay: ReturnType<typeof fakeRelay>): NewsletterIssue {
  return {
    subscribers: [
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
      { email: "two@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
    ],
    subject: "New article: A post",
    body: "<p>Hello</p>",
    baseUrl: "https://example.com",
    unsubscribeLink: (email) =>
      Promise.resolve(`https://example.com/u?${email}`),
    sender: fakeSender(relay),
    log: recordingLog(),
  };
}

const NOW = () => new Date("2026-09-26T10:00:00.000Z");

Deno.test("sendNewsletterOnce mails every subscriber and records the slug with the counts", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/data/newsletter-log.json`;
    const relay = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: issue(relay),
      now: NOW,
    });
    assertEquals(result, { status: "sent", sent: 2, failed: 0 });
    assertEquals(relay.mails.length, 2);
    assertEquals(loadNewsletterLog(logFile), [{
      slug: "a-post",
      subject: "New article: A post",
      startedAt: "2026-09-26T10:00:00.000Z",
      sent: 2,
      failed: 0,
    }]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("sendNewsletterOnce refuses a slug already in the log and sends no mail", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/newsletter-log.json`;
    const earlier = {
      slug: "a-post",
      subject: "New article: A post",
      startedAt: "2026-09-25T10:00:00.000Z",
      sent: 2,
      failed: 0,
    };
    await Deno.writeTextFile(logFile, JSON.stringify([earlier]));
    const relay = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: issue(relay),
      now: NOW,
    });
    assertEquals(result, { status: "already-sent", entry: earlier });
    assertEquals(relay.mails.length, 0);
    assertEquals(loadNewsletterLog(logFile), [earlier]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("sendNewsletterOnce refuses a slug whose earlier run crashed before recording counts", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/newsletter-log.json`;
    await Deno.writeTextFile(
      logFile,
      JSON.stringify([{ slug: "a-post", subject: "s", startedAt: "x" }]),
    );
    const relay = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: issue(relay),
    });
    assertEquals(result.status, "already-sent");
    assertEquals(relay.mails.length, 0);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("sendNewsletterOnce records the slug before the first mail goes out", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/newsletter-log.json`;
    const seenAtFirstMail: string[][] = [];
    const relay = fakeRelay(() => {
      if (seenAtFirstMail.length === 0) {
        seenAtFirstMail.push(loadNewsletterLog(logFile).map((e) => e.slug));
      }
      return "accept";
    });
    await sendNewsletterOnce({ slug: "a-post", logFile, issue: issue(relay) });
    assertEquals(seenAtFirstMail, [["a-post"]]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("sendNewsletterOnce sends another post's newsletter and keeps the earlier entry", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/newsletter-log.json`;
    const earlier = {
      slug: "old-post",
      subject: "s",
      startedAt: "x",
      sent: 1,
      failed: 0,
    };
    await Deno.writeTextFile(logFile, JSON.stringify([earlier]));
    const relay = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: issue(relay),
      now: NOW,
    });
    assertEquals(result.status, "sent");
    assertEquals(relay.mails.length, 2);
    assertEquals(loadNewsletterLog(logFile).map((e) => e.slug), [
      "old-post",
      "a-post",
    ]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a log file that is not valid JSON stops the send instead of allowing it", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const logFile = `${dir}/newsletter-log.json`;
    await Deno.writeTextFile(logFile, "{ not json");
    const relay = fakeRelay();
    await assertRejects(() =>
      sendNewsletterOnce({ slug: "a-post", logFile, issue: issue(relay) })
    );
    assertEquals(relay.mails.length, 0);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
