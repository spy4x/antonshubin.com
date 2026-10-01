import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { sendNewsletter } from "./newsletter.ts";
import { UNSUBSCRIBE_PLACEHOLDER } from "./letter.ts";
import { createUnsubscribeToken } from "./unsubscribe.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const SUBSCRIBERS = [
  { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  { email: "two@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
];
const LETTER = {
  html: `<p>Hello</p><a href="${UNSUBSCRIBE_PLACEHOLDER}">Unsubscribe</a>`,
  text: `Hello\nUnsubscribe: ${UNSUBSCRIBE_PLACEHOLDER}`,
};
/** A real signed token inside an https URL, as production builds the link. */
const tokenLink = async (email: string) =>
  `https://example.com/unsubscribe?token=${await createUnsubscribeToken(
    email,
    "s".repeat(32),
  )}`;
const link = (email: string) =>
  Promise.resolve(`https://example.com/unsubscribe?for=${email}`);

Deno.test("sends each subscriber the letter as html and text with their own unsubscribe link in both", async () => {
  const relay = fakeRelay();
  const result = await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log: recordingLog(),
  });
  assertEquals(result, { sent: 2, failed: 0, skipped: 0 });
  assertEquals(relay.mails.map((m) => m.to), [["one@example.com"], [
    "two@example.com",
  ]]);
  assertEquals(relay.mails[0].subject, "Issue 1");
  assertEquals(
    relay.mails[0].html,
    `<p>Hello</p><a href="https://example.com/unsubscribe?for=one@example.com">Unsubscribe</a>`,
  );
  assertEquals(
    relay.mails[0].text,
    "Hello\nUnsubscribe: https://example.com/unsubscribe?for=one@example.com",
  );
});

Deno.test("counts a send the relay refuses as failed, not sent", async () => {
  const relay = fakeRelay((to) =>
    to.includes("two@example.com") ? "refuse-recipient" : "accept"
  );
  const log = recordingLog();
  const result = await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log,
  });
  assertEquals(result, { sent: 1, failed: 1, skipped: 0 });
  assertEquals(log.lines, ["  ✓ one@example.com"]);
  assertStringIncludes(log.errors[0], "  ✗ two@example.com:");
});

Deno.test("a subscriber whose unsubscribe link cannot be built costs one mail, not the run", async () => {
  const subscribers = [
    SUBSCRIBERS[0],
    { email: "three@example.com", subscribedAt: "2026-01-03T00:00:00.000Z" },
    SUBSCRIBERS[1],
  ];
  const relay = fakeRelay();
  const log = recordingLog();
  const result = await sendNewsletter({
    subscribers,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: (email) =>
      email === "three@example.com"
        ? Promise.reject(new Error("cannot sign"))
        : tokenLink(email),
    sender: fakeSender(relay),
    log,
  });
  assertEquals(result, { sent: 2, failed: 1, skipped: 0 });
  assertEquals(relay.mails.map((m) => m.to), [["one@example.com"], [
    "two@example.com",
  ]]);
  assertEquals(log.errors.length, 1);
  assertStringIncludes(log.errors[0], "  ✗ three@example.com: cannot sign");
});

Deno.test("skips a stored row that is not a bare address, counts it as failed and never logs it", async () => {
  // Rows stored before #255: a display name the caller chose, and values the
  // unsubscribe codec or a mail header cannot carry.
  const bad = [
    `"Your-account-is-locked,verify-at-https://evil.example/x"<victim@example.com>`,
    "a<victim@example.com>",
    "\ud800x@example.com",
  ];
  const subscribers = [
    SUBSCRIBERS[0],
    ...bad.map((email) => ({
      email,
      subscribedAt: "2026-01-03T00:00:00.000Z",
    })),
    SUBSCRIBERS[1],
  ];
  const relay = fakeRelay();
  const log = recordingLog();
  const result = await sendNewsletter({
    subscribers,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: tokenLink,
    sender: fakeSender(relay),
    log,
  });
  assertEquals(result, { sent: 2, failed: 3, skipped: 0 });
  assertEquals(relay.mails.map((m) => m.to), [["one@example.com"], [
    "two@example.com",
  ]]);
  assertEquals(log.errors, [
    "  ✗ row 2: not a bare address, skipped",
    "  ✗ row 3: not a bare address, skipped",
    "  ✗ row 4: not a bare address, skipped",
  ]);
});

Deno.test("every mail carries the subscriber's own one-click List-Unsubscribe", async () => {
  const relay = fakeRelay();
  await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log: recordingLog(),
  });
  assertEquals(relay.mails.length, 2);
  for (const [i, mail] of relay.mails.entries()) {
    const own = `https://example.com/unsubscribe?for=${SUBSCRIBERS[i].email}`;
    assertEquals(
      (mail.headers as Record<string, string>)["List-Unsubscribe"],
      `<${own}>`,
    );
    assertEquals(
      (mail.headers as Record<string, string>)["List-Unsubscribe-Post"],
      "List-Unsubscribe=One-Click",
    );
  }
});

Deno.test("skips a subscriber alreadySent rules out, mails the rest and reports each to onSent", async () => {
  const relay = fakeRelay();
  const sent: string[] = [];
  const result = await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log: recordingLog(),
    alreadySent: (email) => Promise.resolve(email === "one@example.com"),
    onSent: (email) => {
      sent.push(email);
    },
  });
  assertEquals(result, { sent: 1, failed: 0, skipped: 1 });
  assertEquals(relay.mails.map((m) => m.to), [["two@example.com"]]);
  assertEquals(sent, ["two@example.com"]);
});

Deno.test("does not report a refused mail to onSent", async () => {
  const relay = fakeRelay("refuse-recipient");
  const sent: string[] = [];
  await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    letter: LETTER,
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log: recordingLog(),
    onSent: (email) => {
      sent.push(email);
    },
  });
  assertEquals(sent, []);
});
