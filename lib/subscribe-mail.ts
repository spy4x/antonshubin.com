// The words of a newsletter sign-up (#253, #405). `@spy4x/server/subscribers`
// decides when a mail goes out and to whom; this module says what it says: a
// confirmation link to the address that asked, then, once it is confirmed, a
// welcome to the subscriber and a notice to the owner. The first two use the
// letter layout (`lib/letter.ts`); the notice stays plain text. A reply to
// either goes to the site's sender address, which is Anton's own mailbox, so
// none sets `Reply-To`.
import type { MailOutcome, SubscriberMail } from "@spy4x/server/subscribers";
import type { EmailMessage, EmailSender, MailLog } from "./mail.ts";
import { proof } from "./proof.ts";
import {
  button,
  emailLink,
  paragraph,
  renderLetter,
  SUBSCRIBED_REASON,
} from "./letter.ts";

/** The `utm_campaign` of the links in the sign-up mails (docs/utm.md). */
export const SIGNUP_CAMPAIGN = "newsletter";

/** What the sign-up mails are sent with; `sender` is `null` when SMTP is not configured. */
export interface SubscribeMailDeps {
  sender: EmailSender | null;
  contactEmail: string;
  baseUrl: string;
  log?: MailLog;
}

/**
 * The package's `sendMail` callback for this site. Never throws. Without SMTP
 * a mail is skipped with a log line and counts as handed over (the visitor
 * then never gets the link, so the log says so). A relay failure comes back as
 * `{ ok: false }`, which the package logs with the subscriber's address
 * redacted; for the welcome, the welcome and the owner notice are sent side by
 * side and each failure is named in that one error.
 */
export function subscriberMailer(
  deps: SubscribeMailDeps,
): (mail: SubscriberMail) => Promise<MailOutcome> {
  const log = deps.log ?? console;
  return async (mail) => {
    if (!deps.sender) {
      log.log(
        mail.kind === "confirm"
          ? "[SUBSCRIBE] SMTP not configured, confirmation not sent"
          : "[SUBSCRIBE] SMTP not configured, welcome and notice not sent",
      );
      return;
    }
    const sender = deps.sender;
    if (mail.kind === "confirm") {
      return await sender.send(confirmationMessage(mail, deps.baseUrl));
    }
    const sent = await Promise.all([
      sender.send(welcomeMessage(mail, deps.baseUrl)),
      sender.send(ownerNotice(mail, deps.contactEmail)),
    ]);
    const failures = sent.flatMap((result, i) =>
      result.ok ? [] : [`${i === 0 ? "welcome" : "notify"}: ${result.error}`]
    );
    return failures.length === 0
      ? { ok: true }
      : { ok: false, error: failures.join("; ") };
  };
}

/** The double opt-in mail: one button, no unsubscribe link, no P.S. */
function confirmationMessage(
  mail: Extract<SubscriberMail, { kind: "confirm" }>,
  baseUrl: string,
): EmailMessage {
  const letter = renderLetter({
    baseUrl,
    campaign: SIGNUP_CAMPAIGN,
    preheader: "Open the link and press the button to confirm.",
    blocks: [
      paragraph(
        `Someone asked to send this address the newsletter on ${
          new URL(baseUrl).host
        }. If that was you, confirm it:`,
      ),
      button(mail.confirmLink, "Confirm my subscription"),
      paragraph(
        "The link works for three days. If it was not you, ignore this mail and nothing happens.",
      ),
    ],
    ps: false,
    reason: "You get this once, because this address was entered on the site.",
  });
  return {
    to: mail.email,
    subject: "Confirm your subscription to Anton Shubin's newsletter",
    ...letter,
  };
}

/** The welcome, with the subscriber's own one-click `List-Unsubscribe`. */
function welcomeMessage(
  mail: Extract<SubscriberMail, { kind: "welcome" }>,
  baseUrl: string,
): EmailMessage {
  const letter = renderLetter({
    baseUrl,
    campaign: SIGNUP_CAMPAIGN,
    preheader: "What you will get, and a good place to start.",
    blocks: [
      paragraph("Thanks for subscribing!"),
      paragraph(
        `You'll get notified when I publish new articles about SaaS architecture, self-hosting, AI integration, and lessons from ${
          proof("projects")
        } projects.`,
      ),
      button(
        emailLink(baseUrl, "/saas-architecture-guide", SIGNUP_CAMPAIGN),
        "Start with the SaaS architecture guide",
      ),
    ],
    psLead: "If you're working on something I could help with:",
    reason: SUBSCRIBED_REASON,
    unsubscribeLink: mail.unsubscribeLink,
  });
  return {
    to: mail.email,
    subject: "Welcome to Anton Shubin's newsletter",
    ...letter,
    listUnsubscribe: { url: mail.unsubscribeLink, oneClick: true },
  };
}

/** The owner's plain-text notice. The list size reads "unknown" when it could not be counted. */
function ownerNotice(
  mail: Extract<SubscriberMail, { kind: "welcome" }>,
  contactEmail: string,
): EmailMessage {
  return {
    to: contactEmail,
    subject: `[Newsletter] New subscriber: ${mail.email}`,
    text: `${mail.email} subscribed.\nTotal subscribers: ${
      mail.total ?? "unknown"
    }\n\nUnsubscribe: ${mail.unsubscribeLink}`,
  };
}
