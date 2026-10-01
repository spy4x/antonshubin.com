import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import {
  type NewSubscriber,
  sendConfirmationMail,
  sendSubscribeMails,
} from "./subscribe-mail.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const SUB: NewSubscriber = {
  email: "reader@example.com",
  total: 7,
  unsubscribeLink: "https://example.com/unsubscribe?token=abc",
};
const BASE = "https://example.com";

Deno.test("welcomes the subscriber in the letter layout and notifies the owner in plain text, both with the unsubscribe link", async () => {
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
    `Unsubscribe: ${SUB.unsubscribeLink}`,
  );
  assertStringIncludes(String(welcome.html), `href="${SUB.unsubscribeLink}"`);
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

Deno.test("mails the confirmation link to the address that asked, in the letter layout and with no unsubscribe link", async () => {
  const relay = fakeRelay();
  const log = recordingLog();
  await sendConfirmationMail(
    {
      email: "reader@example.com",
      confirmLink: `${BASE}/subscribe/confirm?token=abc`,
    },
    {
      sender: fakeSender(relay),
      contactEmail: "owner@example.com",
      baseUrl: BASE,
      log,
    },
  );
  assertEquals(relay.mails.map((m) => m.to), [["reader@example.com"]]);
  assertStringIncludes(
    String(relay.mails[0].text),
    `${BASE}/subscribe/confirm?token=abc`,
  );
  const mail = relay.mails[0];
  assertStringIncludes(String(mail.html), `${BASE}/img/email/anton-96.png`);
  assertStringIncludes(
    String(mail.html),
    `href="${BASE}/subscribe/confirm?token=abc"`,
  );
  assertEquals(String(mail.html).includes("Unsubscribe"), false);
  assertEquals(String(mail.html).includes("P.S."), false);
  assertEquals(mail.headers, undefined);
  assertEquals(mail.replyTo, undefined);
  assertEquals(log.errors, []);
});

Deno.test("logs a confirmation the relay refuses as failed, and says so when SMTP is not configured", async () => {
  const log = recordingLog();
  await sendConfirmationMail(
    { email: "reader@example.com", confirmLink: `${BASE}/x` },
    {
      sender: fakeSender(fakeRelay("refuse-recipient")),
      contactEmail: "owner@example.com",
      baseUrl: BASE,
      log,
    },
  );
  assertStringIncludes(log.errors[0], "[SUBSCRIBE] confirmation failed:");
  await sendConfirmationMail(
    { email: "reader@example.com", confirmLink: `${BASE}/x` },
    { sender: null, contactEmail: "owner@example.com", baseUrl: BASE, log },
  );
  assertEquals(log.lines, [
    "[SUBSCRIBE] SMTP not configured, confirmation not sent",
  ]);
});

Deno.test("the welcome carries a one-click List-Unsubscribe to the subscriber's own link, and neither subscriber mail sets Reply-To", async () => {
  const relay = fakeRelay();
  await sendSubscribeMails(SUB, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log: recordingLog(),
  });
  const headers = relay.mails[0].headers as Record<string, string>;
  assertEquals(headers["List-Unsubscribe"], `<${SUB.unsubscribeLink}>`);
  assertEquals(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assertEquals(relay.mails[0].replyTo, undefined);
  assertEquals(relay.mails[1].replyTo, undefined);
  assertEquals(relay.mails[1].headers, undefined);
  assertEquals(relay.mails[1].html, undefined);
});

Deno.test("never logs the subscriber's address when the relay's error names it", async () => {
  const log = recordingLog();
  const sender = {
    send: () =>
      Promise.resolve({
        ok: false as const,
        error: "550 no such user reader@example.com",
        accepted: [],
        rejected: [],
        duplicates: [],
      }),
  };
  const deps = {
    sender,
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  };
  await sendConfirmationMail(
    { email: "reader@example.com", confirmLink: `${BASE}/x` },
    deps,
  );
  await sendSubscribeMails(SUB, { ...deps, contactEmail: "" });
  const logged = log.errors.join("\n");
  assertStringIncludes(logged, "[SUBSCRIBE] confirmation failed:");
  assertStringIncludes(logged, "[SUBSCRIBE] welcome failed:");
  assertEquals(logged.includes("reader@example.com"), false, logged);
});
