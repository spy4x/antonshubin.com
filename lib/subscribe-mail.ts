// The mails of a newsletter sign-up (#253): a confirmation link to the address
// that asked, then, once it is confirmed, a welcome to the subscriber and a
// notice to the owner. The first two use the letter layout (`lib/letter.ts`);
// the notice stays plain text. A reply to either goes to the site's sender
// address, which is Anton's own mailbox, so none sets `Reply-To`.
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

/** What {@link sendSubscribeMails} sends with; `sender` is `null` when SMTP is not configured. */
export interface SubscribeMailDeps {
  sender: EmailSender | null;
  contactEmail: string;
  baseUrl: string;
  log?: MailLog;
}

/** The new subscriber, the list size after saving, and their unsubscribe link. */
export interface NewSubscriber {
  email: string;
  total: number;
  unsubscribeLink: string;
}

/** `text` with every copy of `email` replaced, so a relay's error never puts
 * the subscriber's address in the log. */
function withoutAddress(text: string, email: string): string {
  return text.replaceAll(email, "<REDACTED:EMAIL>");
}

/** The address that asked to subscribe, and the link that confirms it. */
export interface ConfirmationRequest {
  email: string;
  confirmLink: string;
}

/**
 * Mails the confirmation link. Never throws: without SMTP it is skipped with a
 * log line (the visitor then never gets the link, so the log says so), and a
 * failure is logged as `[SUBSCRIBE] confirmation failed:`.
 */
export async function sendConfirmationMail(
  request: ConfirmationRequest,
  deps: SubscribeMailDeps,
): Promise<void> {
  const log = deps.log ?? console;
  if (!deps.sender) {
    log.log("[SUBSCRIBE] SMTP not configured, confirmation not sent");
    return;
  }
  const letter = renderLetter({
    baseUrl: deps.baseUrl,
    campaign: SIGNUP_CAMPAIGN,
    preheader: "Open the link and press the button to confirm.",
    blocks: [
      paragraph(
        `Someone asked to send this address the newsletter on ${
          new URL(deps.baseUrl).host
        }. If that was you, confirm it:`,
      ),
      button(request.confirmLink, "Confirm my subscription"),
      paragraph(
        "The link works for three days. If it was not you, ignore this mail and nothing happens.",
      ),
    ],
    ps: false,
    reason: "You get this once, because this address was entered on the site.",
  });
  const result = await deps.sender.send({
    to: request.email,
    subject: "Confirm your subscription to Anton Shubin's newsletter",
    ...letter,
  });
  if (!result.ok) {
    log.error(
      "[SUBSCRIBE] confirmation failed:",
      withoutAddress(result.error, request.email),
    );
  }
}

/**
 * Sends the welcome and the owner notice side by side, once the address is confirmed. Never throws: each
 * failure is logged on its own (`[SUBSCRIBE] welcome failed:` /
 * `[SUBSCRIBE] notify failed:`), and without SMTP both are skipped with a log
 * line each, as the hand-written client did.
 */
export async function sendSubscribeMails(
  sub: NewSubscriber,
  deps: SubscribeMailDeps,
): Promise<void> {
  const log = deps.log ?? console;
  const letter = renderLetter({
    baseUrl: deps.baseUrl,
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
        emailLink(deps.baseUrl, "/saas-architecture-guide", SIGNUP_CAMPAIGN),
        "Start with the SaaS architecture guide",
      ),
    ],
    psLead: "If you're working on something I could help with:",
    reason: SUBSCRIBED_REASON,
    unsubscribeLink: sub.unsubscribeLink,
  });
  const welcome: EmailMessage = {
    to: sub.email,
    subject: "Welcome to Anton Shubin's newsletter",
    ...letter,
    listUnsubscribe: { url: sub.unsubscribeLink, oneClick: true },
  };
  const notice: EmailMessage = {
    to: deps.contactEmail,
    subject: `[Newsletter] New subscriber: ${sub.email}`,
    text:
      `${sub.email} subscribed.\nTotal subscribers: ${sub.total}\n\nUnsubscribe: ${sub.unsubscribeLink}`,
  };

  async function send(message: EmailMessage, what: string): Promise<void> {
    if (!deps.sender) {
      log.log("[SUBSCRIBE] SMTP not configured, skipping mail");
      return;
    }
    const result = await deps.sender.send(message);
    if (!result.ok) {
      log.error(
        `[SUBSCRIBE] ${what} failed:`,
        withoutAddress(result.error, sub.email),
      );
    }
  }

  await Promise.all([send(welcome, "welcome"), send(notice, "notify")]);
}
