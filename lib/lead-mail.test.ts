import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import { type Lead, notifyOwner } from "./lead-mail.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const LEAD: Lead = {
  name: "Jane Doe",
  email: "jane@example.com",
  techStack: "Deno, Postgres\n.\nand a line with a single dot",
};
const RELAY = "smtp.example.test:465";

Deno.test("logs the lead instead of sending when SMTP is not configured", async () => {
  const log = recordingLog();
  const sent = await notifyOwner(LEAD, {
    sender: null,
    contactEmail: "owner@example.com",
    relay: RELAY,
    log,
  });
  assertEquals(sent, false);
  assertEquals(log.lines, [
    `[LEAD] SMTP not configured, logging lead: ${JSON.stringify(LEAD)}`,
  ]);
});

Deno.test("logs the lead instead of sending when no contact address is set", async () => {
  const relay = fakeRelay();
  const log = recordingLog();
  const sent = await notifyOwner(LEAD, {
    sender: fakeSender(relay),
    contactEmail: "",
    relay: RELAY,
    log,
  });
  assertEquals(sent, false);
  assertEquals(relay.mails.length, 0);
  assertStringIncludes(
    log.lines[0],
    "[LEAD] SMTP not configured, logging lead:",
  );
});

Deno.test("mails the lead to the contact address with the name, email and tech stack", async () => {
  const relay = fakeRelay();
  const log = recordingLog();
  const sent = await notifyOwner(LEAD, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    relay: RELAY,
    log,
  });
  assert(sent);
  assertEquals(relay.mails.length, 1);
  assertEquals(relay.mails[0].to, ["owner@example.com"]);
  assertEquals(
    relay.mails[0].subject,
    "[Lead] Architecture audit request from Jane Doe",
  );
  assertEquals(
    relay.mails[0].text,
    `New audit request from Jane Doe (jane@example.com):\n\n${LEAD.techStack}`,
  );
  assertEquals(log.lines, [`[LEAD] sending via ${RELAY}`, "[LEAD] sent OK"]);
  assertEquals(log.errors, []);
});

Deno.test("still delivers a lead whose name carries a line break, folded out of the subject", async () => {
  const relay = fakeRelay();
  const sent = await notifyOwner({
    ...LEAD,
    name: "Jane\r\nBcc: victim@example.com",
  }, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    relay: RELAY,
    log: recordingLog(),
  });
  assert(sent);
  assertEquals(
    relay.mails[0].subject,
    "[Lead] Architecture audit request from Jane Bcc: victim@example.com",
  );
});

for (const behaviour of ["refuse-recipient", "drop-connection"] as const) {
  Deno.test(`logs a send the relay answers with ${behaviour} as failed, never as sent OK`, async () => {
    const log = recordingLog();
    const sent = await notifyOwner(LEAD, {
      sender: fakeSender(fakeRelay(behaviour)),
      contactEmail: "owner@example.com",
      relay: RELAY,
      log,
    });
    assertEquals(sent, false);
    assertEquals(log.lines, [`[LEAD] sending via ${RELAY}`]);
    assertEquals(log.errors.length, 1);
    assertStringIncludes(log.errors[0], "[LEAD] failed: SMTP send failed");
  });
}
