// Outgoing mail for the lead form, the newsletter sign-up and the newsletter
// script (#233). SMTP itself — TLS, AUTH, envelope, MIME, header encoding and
// dot-stuffing — is `@spy4x/email`; this file only maps the site's SMTP_* env
// values onto it and keeps the site's "log it, never throw" failure handling.
import {
  createSmtpSender,
  type EmailSender,
  type SendResult,
  type SmtpTransportFactory,
} from "@spy4x/email/smtp";
import type { EmailMessage } from "@spy4x/email/message";

export type { EmailMessage, EmailSender, SendResult };

/** The SMTP relay the site sends through. */
export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** `From` mailbox: SMTP_FROM, or SMTP_USERNAME when SMTP_FROM is empty. */
  from: string;
  /** Name announced in EHLO; the site's own hostname. Absent: nodemailer
   * uses the machine's, which inside a container is `[127.0.0.1]`. */
  ehloName?: string;
}

/** Raw SMTP_* values, as `lib/config.ts` or a script reads them. */
export interface SmtpEnvValues {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  /** The site's hostname, for EHLO (from `DOMAIN` via `BASE_URL`). */
  ehloName?: string;
}

/**
 * The relay settings, or `null` when SMTP is not configured — the same rule
 * the hand-written clients used: host, username and password must all be set.
 */
export function smtpSettings(values: SmtpEnvValues): SmtpSettings | null {
  if (!values.host || !values.user || !values.pass) return null;
  return {
    host: values.host,
    port: values.port,
    user: values.user,
    pass: values.pass,
    from: values.from || values.user,
    ...(values.ehloName ? { ehloName: values.ehloName } : {}),
  };
}

/**
 * An `@spy4x/email` SMTP sender for the site's relay.
 *
 * Implicit TLS is forced on every port, because the hand-written clients this
 * replaces always opened the connection with `Deno.connectTls`, whatever
 * SMTP_PORT said; the library's own default would switch a non-465 port to
 * STARTTLS and change what production connects with. EHLO announces
 * `ehloName` when given: the old clients sent the relay's own hostname, and
 * nodemailer's default inside a container is `[127.0.0.1]`.
 *
 * The sender is built on the first send, not here, so a bad SMTP_FROM or
 * SMTP_PORT fails that send — logged like any other failure — instead of
 * throwing while a route module loads. `factory` replaces the nodemailer
 * transport; tests pass a fake so nothing opens a connection.
 */
export function createSiteSender(
  settings: SmtpSettings,
  factory?: SmtpTransportFactory,
): EmailSender {
  let sender: EmailSender | undefined;
  return {
    send(message: EmailMessage): Promise<SendResult> {
      try {
        const { ehloName, ...smtp } = settings;
        sender ??= createSmtpSender(
          { ...smtp, secure: true, ...(ehloName ? { name: ehloName } : {}) },
          factory,
        );
      } catch (err) {
        return Promise.resolve({
          ok: false,
          error: `SMTP settings rejected: ${
            err instanceof Error ? err.message : String(err)
          }`,
          accepted: [],
          rejected: [],
          duplicates: [],
        });
      }
      return sender.send(message);
    },
  };
}

/** Where a mail helper writes its log lines; `console` outside tests. */
export interface MailLog {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/** A line break or other control character, which a mail subject may not carry. */
const CONTROL_CHARACTERS = /\p{Cc}+/gu;

/**
 * `value` with every run of control characters folded to one space, for text a
 * visitor typed that goes into a subject line. `@spy4x/email` refuses a subject
 * with a line break (it would inject a header), and dropping the whole mail
 * over it would lose the lead.
 */
export function subjectSafe(value: string): string {
  return value.replace(CONTROL_CHARACTERS, " ");
}
