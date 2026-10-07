import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import type { SubscriberMail } from "@spy4x/server/subscribers";
import { subscriberMailer } from "./subscribe-mail.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const BASE = "https://example.com";
const WELCOME: SubscriberMail = {
  kind: "welcome",
  email: "reader@example.com",
  total: 7,
  unsubscribeLink: "https://example.com/unsubscribe?token=abc",
};
const CONFIRM: SubscriberMail = {
  kind: "confirm",
  email: "reader@example.com",
  confirmLink: `${BASE}/subscribe/confirm?token=abc`,
};
const UNSUBSCRIBE = "https://example.com/unsubscribe?token=abc";

function mailer(relay = fakeRelay(), log = recordingLog()) {
  return subscriberMailer({
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
}

Deno.test("welcomes the subscriber in the letter layout and notifies the owner in plain text, both with the unsubscribe link", async () => {
  const relay = fakeRelay();
  const outcome = await mailer(relay)(WELCOME);
  assertEquals(outcome, { ok: true });
  assertEquals(relay.mails.map((m) => m.to), [["reader@example.com"], [
    "owner@example.com",
  ]]);
  const [welcome, notice] = relay.mails;
  assertEquals(welcome.subject, "Welcome to Anton Shubin's newsletter");
  assertStringIncludes(String(welcome.text), `${BASE}/saas-architecture-guide`);
  assertStringIncludes(String(welcome.text), `Unsubscribe: ${UNSUBSCRIBE}`);
  assertStringIncludes(String(welcome.html), `href="${UNSUBSCRIBE}"`);
  assertEquals(
    notice.subject,
    "[Newsletter] New subscriber: reader@example.com",
  );
  assertEquals(
    notice.text,
    `reader@example.com subscribed.\nTotal subscribers: 7\n\nUnsubscribe: ${UNSUBSCRIBE}`,
  );
});

Deno.test("the owner notice says the list size is unknown when it could not be counted", async () => {
  const relay = fakeRelay();
  await mailer(relay)({ ...WELCOME, total: undefined });
  assertStringIncludes(
    String(relay.mails[1].text),
    "Total subscribers: unknown",
  );
});

Deno.test("sends nothing and says so in one log line per mail when SMTP is not configured", async () => {
  const log = recordingLog();
  const send = subscriberMailer({
    sender: null,
    contactEmail: "owner@example.com",
    baseUrl: BASE,
    log,
  });
  assertEquals(await send(CONFIRM), undefined);
  assertEquals(await send(WELCOME), undefined);
  assertEquals(log.lines, [
    "[SUBSCRIBE] SMTP not configured, confirmation not sent",
    "[SUBSCRIBE] SMTP not configured, welcome and notice not sent",
  ]);
});

Deno.test("reports a welcome the relay refuses as failed and still sends the owner notice", async () => {
  const relay = fakeRelay((to) =>
    to.includes("reader@example.com") ? "refuse-recipient" : "accept"
  );
  const outcome = await mailer(relay)(WELCOME);
  assertEquals(relay.mails.length, 2);
  assertEquals(outcome?.ok, false);
  assertStringIncludes(
    outcome && !outcome.ok ? outcome.error : "",
    "welcome: ",
  );
});

Deno.test("reports a notice the relay refuses as failed, naming the notice", async () => {
  const relay = fakeRelay((to) =>
    to.includes("owner@example.com") ? "refuse-recipient" : "accept"
  );
  const outcome = await mailer(relay)(WELCOME);
  assertEquals(outcome?.ok, false);
  const error = outcome && !outcome.ok ? outcome.error : "";
  assertStringIncludes(error, "notify: ");
  assertEquals(error.includes("welcome: "), false, error);
});

Deno.test("mails the confirmation link to the address that asked, in the letter layout and with no unsubscribe link", async () => {
  const relay = fakeRelay();
  const outcome = await mailer(relay)(CONFIRM);
  assertEquals(outcome?.ok, true);
  assertEquals(relay.mails.map((m) => m.to), [["reader@example.com"]]);
  const mail = relay.mails[0];
  assertEquals(
    mail.subject,
    "Confirm your subscription to Anton Shubin's newsletter",
  );
  assertStringIncludes(
    String(mail.text),
    `${BASE}/subscribe/confirm?token=abc`,
  );
  assertStringIncludes(String(mail.html), `${BASE}/img/email/anton-96.png`);
  assertStringIncludes(
    String(mail.html),
    `href="${BASE}/subscribe/confirm?token=abc"`,
  );
  assertEquals(String(mail.html).includes("Unsubscribe"), false);
  assertEquals(String(mail.html).includes("P.S."), false);
  assertEquals(mail.headers, undefined);
  assertEquals(mail.replyTo, undefined);
});

Deno.test("reports a confirmation the relay refuses as failed", async () => {
  const outcome = await mailer(fakeRelay("refuse-recipient"))(CONFIRM);
  assertEquals(outcome?.ok, false);
});

Deno.test("the welcome carries a one-click List-Unsubscribe to the subscriber's own link, and neither subscriber mail sets Reply-To", async () => {
  const relay = fakeRelay();
  await mailer(relay)(WELCOME);
  const headers = relay.mails[0].headers as Record<string, string>;
  assertEquals(headers["List-Unsubscribe"], `<${UNSUBSCRIBE}>`);
  assertEquals(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assertEquals(relay.mails[0].replyTo, undefined);
  assertEquals(relay.mails[1].replyTo, undefined);
  assertEquals(relay.mails[1].headers, undefined);
  assertEquals(relay.mails[1].html, undefined);
});

Deno.test("the confirmation's preview line says what to do, and the welcome's P.S. fits a new subscriber", async () => {
  const relay = fakeRelay();
  const send = mailer(relay);
  await send(CONFIRM);
  await send(WELCOME);
  const [confirmation, welcome] = relay.mails;
  assertStringIncludes(
    String(confirmation.html),
    "Open the link and press the button to confirm.",
  );
  assertEquals(String(confirmation.html).includes("One click"), false);
  assertStringIncludes(
    String(welcome.html),
    "P.S. If you&#39;re working on something I could help with: <a ",
  );
  assertStringIncludes(
    String(welcome.text),
    "P.S. If you're working on something I could help with: Book a free",
  );
});
