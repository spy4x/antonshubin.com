// Test doubles for lib/mail.ts: a fake SMTP transport for `@spy4x/email`'s
// transport factory, so no test opens a connection, and a log that records
// lines instead of printing them.
import type { SmtpTransportFactory } from "@spy4x/email/smtp";
import {
  createSiteSender,
  type MailLog,
  type SmtpSettings,
} from "../lib/mail.ts";

/** How the fake relay answers every send. */
export type RelayBehaviour = "accept" | "refuse-recipient" | "drop-connection";

/** One message as the fake relay received it (nodemailer's mail options). */
export interface CapturedMail {
  from?: unknown;
  to?: unknown;
  subject?: string;
  text?: unknown;
  html?: unknown;
}

/** A fake relay: the factory to hand the sender, and what it saw. */
export interface FakeRelay {
  factory: SmtpTransportFactory;
  /** Transport configs the factory was called with. */
  configs: Record<string, unknown>[];
  mails: CapturedMail[];
}

/**
 * A fake relay that answers every send with `behaviour`, or with what
 * `behaviour(recipients)` returns for that send.
 */
export function fakeRelay(
  behaviour: RelayBehaviour | ((to: string[]) => RelayBehaviour) = "accept",
): FakeRelay {
  const configs: Record<string, unknown>[] = [];
  const mails: CapturedMail[] = [];

  function sendMail(message: CapturedMail) {
    mails.push(message);
    const to = (Array.isArray(message.to) ? message.to : [message.to]).map((
      mailbox,
    ) =>
      typeof mailbox === "object" && mailbox !== null && "address" in mailbox
        ? String(mailbox.address)
        : String(mailbox)
    );
    const answer = typeof behaviour === "function" ? behaviour(to) : behaviour;
    if (answer === "drop-connection") {
      return Promise.reject(new Error("Connection closed unexpectedly"));
    }
    if (answer === "refuse-recipient") {
      return Promise.resolve({ accepted: [], rejected: to });
    }
    return Promise.resolve({
      accepted: to,
      rejected: [],
      messageId: "<fake@test>",
    });
  }

  return {
    factory: (config) => {
      configs.push(config as Record<string, unknown>);
      return { sendMail };
    },
    configs,
    mails,
  };
}

/** Settings for a relay that does not exist; only the fake transport sees them. */
export const TEST_SMTP: SmtpSettings = {
  host: "smtp.example.test",
  port: 587,
  user: "site@example.com",
  pass: "not-a-real-password",
  from: "Site <site@example.com>",
};

/** A site sender wired to `relay` instead of nodemailer. */
export function fakeSender(
  relay: FakeRelay,
  settings: SmtpSettings = TEST_SMTP,
) {
  return createSiteSender(settings, relay.factory);
}

/** A {@link MailLog} that records each line as its arguments joined by spaces. */
export function recordingLog(): MailLog & {
  lines: string[];
  errors: string[];
} {
  const lines: string[] = [];
  const errors: string[] = [];
  const join = (args: unknown[]) => args.map(String).join(" ");
  return {
    lines,
    errors,
    log: (...args: unknown[]) => lines.push(join(args)),
    error: (...args: unknown[]) => errors.push(join(args)),
  };
}
