import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { type NewSubscriber, sendSubscribeMails } from "./subscribe-mail.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const SUB: NewSubscriber = {
  email: "reader@example.com",
  total: 7,
  unsubscribeLink: "https://example.com/unsubscribe?token=abc",
};
const BASE = "https://example.com";

Deno.test("welcomes the subscriber and notifies the owner, both with the unsubscribe link", async () => {
  const relay = fakeRelay();
  const log = recordingLog();
  await sendSubscribeMails(SUB, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
  assertEquals(relay.mails.map((m) => m.to), [["reader@example.com"], [
    "owner@example.com",
  ]]);
  const [welcome, notice] = relay.mails;
  assertEquals(welcome.subject, "Welcome to Anton Shubin's newsletter");
  assertStringIncludes(String(welcome.text), `${BASE}/saas-architecture-guide`);
  assertStringIncludes(
    String(welcome.text),
    `Unsubscribe anytime:\n${SUB.unsubscribeLink}`,
  );
  assertEquals(
    notice.subject,
    "[Newsletter] New subscriber: reader@example.com",
  );
  assertEquals(
    notice.text,
    `reader@example.com subscribed.\nTotal subscribers: 7\n\nUnsubscribe: ${SUB.unsubscribeLink}`,
  );
  assertEquals(log.errors, []);
});

Deno.test("skips both mails with one log line each when SMTP is not configured", async () => {
  const log = recordingLog();
  await sendSubscribeMails(SUB, {
    sender: null,
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
  assertEquals(log.lines, [
    "[SUBSCRIBE] SMTP not configured, skipping mail",
    "[SUBSCRIBE] SMTP not configured, skipping mail",
  ]);
});

Deno.test("logs a welcome the relay refuses as failed and still sends the owner notice", async () => {
  const relay = fakeRelay((to) =>
    to.includes("reader@example.com") ? "refuse-recipient" : "accept"
  );
  const log = recordingLog();
  await sendSubscribeMails(SUB, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
  assertEquals(relay.mails.length, 2);
  assertEquals(log.errors.length, 1);
  assertStringIncludes(log.errors[0], "[SUBSCRIBE] welcome failed:");
});

Deno.test("logs a welcome to an address the mail library cannot parse as failed, without sending it", async () => {
  // Passes the route's own email regex, but is not a valid mailbox.
  const relay = fakeRelay();
  const log = recordingLog();
  await sendSubscribeMails({ ...SUB, email: "a<b@example.com" }, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
  assertEquals(relay.mails.map((m) => m.to), [["owner@example.com"]]);
  assertEquals(log.errors.length, 1);
  assertStringIncludes(log.errors[0], "[SUBSCRIBE] welcome failed:");
});
