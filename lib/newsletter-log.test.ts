import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "jsr:@std/assert@^1.0.0";
import {
  loadNewsletterLog,
  type NewsletterLogEntry,
  sendExitCode,
  sendNewsletterOnce,
  sentMark,
} from "./newsletter-log.ts";
import type { NewsletterIssue } from "./newsletter.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const SECRET = "s".repeat(32);
const NOW = () => new Date("2026-09-26T10:00:00.000Z");

function issue(relay: ReturnType<typeof fakeRelay>): NewsletterIssue {
  return {
    subscribers: [
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
      { email: "two@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
    ],
    subject: "A post",
    letter: { html: "<p>Hello</p>", text: "Hello" },
    unsubscribeLink: (email) =>
      Promise.resolve(`https://example.com/u?${email}`),
    sender: fakeSender(relay),
    log: recordingLog(),
  };
}

/** Runs `fn` with a log file path in a temp directory that is removed after. */
async function withLog(fn: (logFile: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(`${dir}/data/newsletter-log.json`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

const once = (
  logFile: string,
  relay: ReturnType<typeof fakeRelay>,
  slug = "a-post",
) =>
  sendNewsletterOnce({
    slug,
    logFile,
    issue: issue(relay),
    secret: SECRET,
    now: NOW,
  });

Deno.test("sendNewsletterOnce mails every subscriber and records each one by a keyed mark, never the address", async () => {
  await withLog(async (logFile) => {
    const relay = fakeRelay();
    const result = await once(logFile, relay);
    assertEquals(result, { status: "sent", sent: 2, failed: 0, skipped: 0 });
    assertEquals(relay.mails.length, 2);
    const marks = [
      await sentMark("one@example.com", "a-post", SECRET),
      await sentMark("two@example.com", "a-post", SECRET),
    ];
    assertEquals(loadNewsletterLog(logFile), [{
      slug: "a-post",
      subject: "A post",
      startedAt: "2026-09-26T10:00:00.000Z",
      audience: marks,
      recipients: marks,
      sent: 2,
      failed: 0,
      completedAt: "2026-09-26T10:00:00.000Z",
    }]);
    const raw = await Deno.readTextFile(logFile);
    assertEquals(raw.includes("example.com"), false, raw);
  });
});

Deno.test("sendNewsletterOnce refuses a post whose earlier run finished with no failure and sends no mail", async () => {
  await withLog(async (logFile) => {
    await once(logFile, fakeRelay());
    const before = await Deno.readTextFile(logFile);
    const relay = fakeRelay();
    const result = await once(logFile, relay);
    assertEquals(result.status, "already-sent");
    assertEquals(relay.mails.length, 0);
    assertEquals(await Deno.readTextFile(logFile), before);
  });
});

Deno.test("sendNewsletterOnce refuses a post that has an entry from before recipients were recorded", async () => {
  await withLog(async (logFile) => {
    const legacy = {
      slug: "a-post",
      subject: "New article: A post",
      startedAt: "2026-09-25T10:00:00.000Z",
      sent: 2,
      failed: 0,
    };
    await Deno.mkdir(logFile.replace(/\/[^/]+$/, ""), { recursive: true });
    await Deno.writeTextFile(logFile, JSON.stringify([legacy]));
    const relay = fakeRelay();
    const result = await once(logFile, relay);
    assertEquals(result, { status: "already-sent", entry: legacy });
    assertEquals(relay.mails.length, 0);
    assertEquals(loadNewsletterLog(logFile), [legacy]);
  });
});

Deno.test("a rerun after a partial failure mails only the subscribers who were missed, then closes the post", async () => {
  await withLog(async (logFile) => {
    const failing = fakeRelay((to) =>
      to.includes("two@example.com") ? "refuse-recipient" : "accept"
    );
    const first = await once(logFile, failing);
    assertEquals(first, { status: "sent", sent: 1, failed: 1, skipped: 0 });
    assertEquals(loadNewsletterLog(logFile)[0].completedAt, undefined);

    const relay = fakeRelay();
    const second = await once(logFile, relay);
    assertEquals(second, { status: "sent", sent: 1, failed: 0, skipped: 1 });
    assertEquals(relay.mails.map((m) => m.to), [["two@example.com"]]);
    const entry = loadNewsletterLog(logFile)[0];
    assertEquals(entry.recipients?.length, 2);
    assertEquals(entry.sent, 2);
    assertEquals(entry.completedAt, "2026-09-26T10:00:00.000Z");

    const third = fakeRelay();
    assertEquals((await once(logFile, third)).status, "already-sent");
    assertEquals(third.mails.length, 0);
  });
});

Deno.test("a run that crashed after the first mail resumes with the second subscriber only", async () => {
  await withLog(async (logFile) => {
    const entry: NewsletterLogEntry = {
      slug: "a-post",
      subject: "A post",
      startedAt: "2026-09-26T09:00:00.000Z",
      recipients: [await sentMark("ONE@example.com ", "a-post", SECRET)],
    };
    await Deno.mkdir(logFile.replace(/\/[^/]+$/, ""), { recursive: true });
    await Deno.writeTextFile(logFile, JSON.stringify([entry]));
    const relay = fakeRelay();
    const result = await once(logFile, relay);
    assertEquals(result.status, "sent");
    assertEquals(relay.mails.map((m) => m.to), [["two@example.com"]]);
  });
});

Deno.test("sendNewsletterOnce writes the entry before the first mail and each recipient right after its mail is accepted", async () => {
  await withLog(async (logFile) => {
    const seen: number[][] = [];
    const relay = fakeRelay(() => {
      const [entry] = loadNewsletterLog(logFile);
      seen.push([loadNewsletterLog(logFile).length, entry.recipients!.length]);
      return "accept";
    });
    await once(logFile, relay);
    // At mail 1 the entry exists with nobody; at mail 2 it lists mail 1's recipient.
    assertEquals(seen, [[1, 0], [1, 1]]);
  });
});

Deno.test("sendNewsletterOnce sends another post's newsletter and keeps the earlier entry", async () => {
  await withLog(async (logFile) => {
    const earlier = {
      slug: "old-post",
      subject: "s",
      startedAt: "x",
      recipients: [],
      sent: 1,
      failed: 0,
      completedAt: "y",
    };
    await Deno.mkdir(logFile.replace(/\/[^/]+$/, ""), { recursive: true });
    await Deno.writeTextFile(logFile, JSON.stringify([earlier]));
    const relay = fakeRelay();
    const result = await once(logFile, relay);
    assertEquals(result.status, "sent");
    assertEquals(relay.mails.length, 2);
    assertEquals(loadNewsletterLog(logFile).map((e) => e.slug), [
      "old-post",
      "a-post",
    ]);
  });
});

Deno.test("a log file that is not valid JSON stops the send instead of allowing it", async () => {
  await withLog(async (logFile) => {
    await Deno.mkdir(logFile.replace(/\/[^/]+$/, ""), { recursive: true });
    await Deno.writeTextFile(logFile, "{ not json");
    const relay = fakeRelay();
    await assertRejects(() => once(logFile, relay));
    assertEquals(relay.mails.length, 0);
  });
});

Deno.test("sendNewsletterOnce refuses an empty subscriber list before recording the slug", async () => {
  await withLog(async (logFile) => {
    const relay = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: { ...issue(relay), subscribers: [] },
      secret: SECRET,
      now: NOW,
    });
    assertEquals(result, { status: "no-subscribers" });
    assertEquals(loadNewsletterLog(logFile), []);
  });
});

Deno.test("a sent mark differs by post and by address, ignores case and spaces, and needs the secret", async () => {
  const a = await sentMark("one@example.com", "a-post", SECRET);
  assertEquals(await sentMark(" One@Example.com ", "a-post", SECRET), a);
  assertNotEquals(await sentMark("one@example.com", "b-post", SECRET), a);
  assertNotEquals(await sentMark("two@example.com", "a-post", SECRET), a);
  assertNotEquals(
    await sentMark("one@example.com", "a-post", "t".repeat(32)),
    a,
  );
});

Deno.test("sendExitCode is 0 only when a mail went out or a rerun had nobody left, and none failed", () => {
  assertEquals(sendExitCode({ sent: 2, failed: 0 }), 0);
  assertEquals(sendExitCode({ sent: 2, failed: 1 }), 1);
  assertEquals(sendExitCode({ sent: 0, failed: 2 }), 1);
  assertEquals(sendExitCode({ sent: 0, failed: 0 }), 1);
  assertEquals(sendExitCode({ sent: 0, failed: 0, skipped: 2 }), 0);
  assertEquals(sendExitCode({ sent: 0, failed: 1, skipped: 2 }), 1);
});

const SUBSCRIBERS = issue(fakeRelay()).subscribers;
const BAD_ROW = {
  email: "a<b@example.com",
  subscribedAt: "2026-01-03T00:00:00.000Z",
};
const LATE = {
  email: "late@example.com",
  subscribedAt: "2026-09-27T00:00:00.000Z",
};

Deno.test("a post that can never complete does not reach a subscriber who joined after the first run", async () => {
  await withLog(async (logFile) => {
    const first = fakeRelay();
    const result = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: { ...issue(first), subscribers: [...SUBSCRIBERS, BAD_ROW] },
      secret: SECRET,
      now: NOW,
    });
    assertEquals(result, { status: "sent", sent: 2, failed: 1, skipped: 0 });
    assertEquals(loadNewsletterLog(logFile)[0].completedAt, undefined);

    const second = fakeRelay();
    const rerun = await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: { ...issue(second), subscribers: [...SUBSCRIBERS, BAD_ROW, LATE] },
      secret: SECRET,
      now: NOW,
    });
    assertEquals(rerun, { status: "sent", sent: 0, failed: 1, skipped: 3 });
    assertEquals(second.mails.length, 0);
    const lateMark = await sentMark(LATE.email, "a-post", SECRET);
    const entry = loadNewsletterLog(logFile)[0];
    assertEquals(entry.audience?.includes(lateMark), false);
    assertEquals(entry.recipients?.includes(lateMark), false);
  });
});

Deno.test("a resumed run mails only the missing members of the recorded audience", async () => {
  await withLog(async (logFile) => {
    const refusing = fakeRelay((to) =>
      to.includes("two@example.com") ? "refuse-recipient" : "accept"
    );
    await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: issue(refusing),
      secret: SECRET,
      now: NOW,
    });
    const relay = fakeRelay();
    await sendNewsletterOnce({
      slug: "a-post",
      logFile,
      issue: { ...issue(relay), subscribers: [...SUBSCRIBERS, LATE] },
      secret: SECRET,
      now: NOW,
    });
    assertEquals(relay.mails.map((m) => m.to), [["two@example.com"]]);
  });
});

Deno.test("two overlapping calls mail each address exactly once and refuse the second as in progress", async () => {
  await withLog(async (logFile) => {
    const relay = fakeRelay();
    const call = () =>
      sendNewsletterOnce({
        slug: "a-post",
        logFile,
        issue: issue(relay),
        secret: SECRET,
        now: NOW,
      });
    const results = await Promise.all([call(), call()]);
    assertEquals(results.map((r) => r.status).sort(), ["in-progress", "sent"]);
    const to = relay.mails.map((m) => String(m.to)).sort();
    assertEquals(to, ["one@example.com", "two@example.com"]);
    // The lock is released afterwards, so the finished post is now refused as sent.
    assertEquals((await call()).status, "already-sent");
  });
});

Deno.test("the log directory holds only the log and its lock file while a mail is out and after the send", async () => {
  await withLog(async (logFile) => {
    const seen: string[][] = [];
    const dir = logFile.replace(/\/[^/]+$/, "");
    const relay = fakeRelay(() => {
      seen.push([...Deno.readDirSync(dir)].map((e) => e.name).sort());
      return "accept";
    });
    await once(logFile, relay);
    // While a mail is out, only the log and the lock file exist, and no temp file stays behind.
    const expected = ["newsletter-log.json", "newsletter-log.json.lock"];
    assertEquals(seen, [expected, expected]);
    assertEquals(
      [...Deno.readDirSync(dir)].map((e) => e.name).sort(),
      expected,
    );
  });
});
