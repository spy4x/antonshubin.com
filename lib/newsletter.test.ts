import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { sendNewsletter } from "./newsletter.ts";
import { createUnsubscribeToken } from "./unsubscribe.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const SUBSCRIBERS = [
  { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  { email: "two@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
];
const link = (email: string) =>
  Promise.resolve(`https://example.com/unsubscribe?for=${email}`);

Deno.test("sends each subscriber the body as html with their own unsubscribe link", async () => {
  const relay = fakeRelay();
  const result = await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    body: "<p>Hello</p>",
    baseUrl: "https://example.com",
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log: recordingLog(),
  });
  assertEquals(result, { sent: 2, failed: 0 });
  assertEquals(relay.mails.map((m) => m.to), [["one@example.com"], [
    "two@example.com",
  ]]);
  assertEquals(relay.mails[0].subject, "Issue 1");
  assertEquals(
    relay.mails[0].html,
    `<p>Hello</p>\n\n---\n<a href="https://example.com/unsubscribe?for=one@example.com">Unsubscribe</a> | https://example.com`,
  );
  assertEquals(relay.mails[0].text, undefined);
});

Deno.test("counts a send the relay refuses as failed, not sent", async () => {
  const relay = fakeRelay((to) =>
    to.includes("two@example.com") ? "refuse-recipient" : "accept"
  );
  const log = recordingLog();
  const result = await sendNewsletter({
    subscribers: SUBSCRIBERS,
    subject: "Issue 1",
    body: "<p>Hello</p>",
    baseUrl: "https://example.com",
    unsubscribeLink: link,
    sender: fakeSender(relay),
    log,
  });
  assertEquals(result, { sent: 1, failed: 1 });
  assertEquals(log.lines, ["  ✓ one@example.com"]);
  assertStringIncludes(log.errors[0], "  ✗ two@example.com:");
});

Deno.test("a stored address the unsubscribe codec cannot sign costs one mail, not the run", async () => {
  // A lone UTF-16 surrogate: the codec refuses to sign it, so building this
  // subscriber's link throws.
  const subscribers = [
    SUBSCRIBERS[0],
    { email: "\ud800x@example.com", subscribedAt: "2026-01-03T00:00:00.000Z" },
    SUBSCRIBERS[1],
  ];
  const relay = fakeRelay();
  const log = recordingLog();
  const result = await sendNewsletter({
    subscribers,
    subject: "Issue 1",
    body: "<p>Hello</p>",
    baseUrl: "https://example.com",
    unsubscribeLink: (email) => createUnsubscribeToken(email, "s".repeat(32)),
    sender: fakeSender(relay),
    log,
  });
  assertEquals(result, { sent: 2, failed: 1 });
  assertEquals(relay.mails.map((m) => m.to), [["one@example.com"], [
    "two@example.com",
  ]]);
  assertEquals(log.errors.length, 1);
  assertStringIncludes(log.errors[0], "  ✗ \ud800x@example.com:");
});
