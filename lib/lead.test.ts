import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { acceptLead, type AcceptLeadDeps } from "./lead.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

function setup() {
  const relay = fakeRelay();
  const log = recordingLog();
  const deps: AcceptLeadDeps = {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    relay: "smtp.example.test:465",
    log,
    now: () => Date.parse("2026-09-26T00:00:00.000Z"),
  };
  return { relay, deps };
}

const LEAD = { name: "Jane Doe", techStack: "Deno" };

Deno.test("answers 400 to an email field with a display name, and mails nothing", async () => {
  const refused = [
    `"Your-account-is-locked,verify-at-https://evil.example/x"<victim@example.com>`,
    "a<victim@example.com>",
    `"Verify at https://evil.example"<victim@example.com>`,
    "Jane <jane@example.com>",
    ["jane@example.com"],
  ];
  for (const email of refused) {
    const { relay, deps } = setup();
    const outcome = acceptLead({ ...LEAD, email }, deps);
    await outcome.mail;
    assertEquals([outcome.status, outcome.body], [400, {
      error: "Valid email is required",
    }], JSON.stringify(email));
    assertEquals(relay.mails.length, 0, JSON.stringify(email));
  }
});

Deno.test("mails the owner a lead whose email field is a bare address", async () => {
  const { relay, deps } = setup();
  const outcome = acceptLead({ ...LEAD, email: " jane@example.com " }, deps);
  await outcome.mail;
  assertEquals([outcome.status, outcome.body], [200, { ok: true }]);
  assertEquals(relay.mails.length, 1);
  assertStringIncludes(
    String(relay.mails[0].text),
    "New audit request from Jane Doe (jane@example.com):",
  );
});
