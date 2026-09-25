import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import { smtpSettings, subjectSafe } from "./mail.ts";
import { fakeRelay, fakeSender, TEST_SMTP } from "../test/fake-mail.ts";

const ENV = {
  host: "smtp.example.test",
  port: 465,
  user: "site@example.com",
  pass: "not-a-real-password",
  from: "",
};

Deno.test("treats SMTP as not configured when the host, username or password is missing", () => {
  assertEquals(smtpSettings({ ...ENV, host: "" }), null);
  assertEquals(smtpSettings({ ...ENV, user: "" }), null);
  assertEquals(smtpSettings({ ...ENV, pass: "" }), null);
});

Deno.test("sends from SMTP_USERNAME when SMTP_FROM is empty, and from SMTP_FROM when set", () => {
  assertEquals(smtpSettings(ENV)?.from, "site@example.com");
  assertEquals(
    smtpSettings({ ...ENV, from: "Anton <a@example.com>" })?.from,
    "Anton <a@example.com>",
  );
});

Deno.test("opens implicit TLS on port 587, as the hand-written client did", async () => {
  const relay = fakeRelay();
  const result = await fakeSender(relay, { ...TEST_SMTP, port: 587 }).send({
    to: "owner@example.com",
    subject: "Hello",
    text: "Body",
  });
  assert(result.ok);
  assertEquals(relay.configs.length, 1);
  assertEquals(relay.configs[0].port, 587);
  assertEquals(relay.configs[0].secure, true);
});

Deno.test("reports an unusable SMTP_FROM as a failed send instead of throwing", async () => {
  const relay = fakeRelay();
  const result = await fakeSender(relay, {
    ...TEST_SMTP,
    from: "not an address",
  }).send({
    to: "owner@example.com",
    subject: "Hello",
    text: "Body",
  });
  assert(!result.ok);
  assertStringIncludes(result.error, "SMTP settings rejected");
  assertEquals(relay.mails.length, 0);
});

Deno.test("folds each run of line breaks and control characters in subject text to one space", () => {
  assertEquals(
    subjectSafe("Jane\r\nBcc: victim@example.com"),
    "Jane Bcc: victim@example.com",
  );
  assertEquals(subjectSafe("a\tb\u0000c"), "a b c");
  assertEquals(subjectSafe("Zoë"), "Zoë");
});

Deno.test("announces the site's hostname in EHLO, not the container's", async () => {
  const settings = smtpSettings({ ...ENV, ehloName: "antonshubin.com" });
  assert(settings);
  const relay = fakeRelay();
  const result = await fakeSender(relay, settings).send({
    to: "owner@example.com",
    subject: "Hello",
    text: "Body",
  });
  assert(result.ok);
  assertEquals(relay.configs[0].name, "antonshubin.com");
});
