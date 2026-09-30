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

Deno.test("sets Reply-To on the owner's mail to the visitor's address", async () => {
  const relay = fakeRelay();
  await notifyOwner(LEAD, {
    sender: fakeSender(relay),
    contactEmail: "owner@example.com",
    relay: RELAY,
    log: recordingLog(),
  });
  assertStringIncludes(
    JSON.stringify(relay.mails[0].replyTo),
    "jane@example.com",
  );
});

Deno.test("hands a lead the relay refused to keep, and logs that it was kept without its contents", async () => {
  const log = recordingLog();
  const kept: Lead[] = [];
  const sent = await notifyOwner(LEAD, {
    sender: fakeSender(fakeRelay("drop-connection")),
    contactEmail: "owner@example.com",
    relay: RELAY,
    keep: (lead) => {
      kept.push(lead);
      return Promise.resolve();
    },
    log,
  });
  assertEquals(sent, false);
  assertEquals(kept, [LEAD]);
  assertStringIncludes(
    log.errors.join("\n"),
    "[LEAD] kept the lead for a retry",
  );
  for (const line of [...log.lines, ...log.errors]) {
    assert(!line.includes("jane@example.com"), line);
    assert(!line.includes("single dot"), line);
  }
});

Deno.test("keeps nothing for a lead that was sent", async () => {
  const kept: Lead[] = [];
  await notifyOwner(LEAD, {
    sender: fakeSender(fakeRelay()),
    contactEmail: "owner@example.com",
    relay: RELAY,
    keep: (lead) => {
      kept.push(lead);
      return Promise.resolve();
    },
    log: recordingLog(),
  });
  assertEquals(kept, []);
});

Deno.test("logs why a failed lead could not be kept, without the lead", async () => {
  const log = recordingLog();
  const sent = await notifyOwner(LEAD, {
    sender: fakeSender(fakeRelay("drop-connection")),
    contactEmail: "owner@example.com",
    relay: RELAY,
    keep: () => Promise.reject(new Error("read-only file system")),
    log,
  });
  assertEquals(sent, false);
  assertStringIncludes(
    log.errors.join("\n"),
    "[LEAD] could not keep the lead: read-only file system",
  );
  assert(!log.errors.join("\n").includes("jane@example.com"));
});

Deno.test("does not claim a lead was kept when the store declined it", async () => {
  const log = recordingLog();
  await notifyOwner(LEAD, {
    sender: fakeSender(fakeRelay("drop-connection")),
    contactEmail: "owner@example.com",
    relay: RELAY,
    keep: () => Promise.resolve(false),
    log,
  });
  assert(!log.errors.join("\n").includes("kept the lead"), log.errors.join());
});
