// The two mails `/api/subscribe` sends after saving a subscriber: a welcome to
// the subscriber and a notice to the owner.
import type { EmailMessage, EmailSender, MailLog } from "./mail.ts";
import { proof } from "./proof.ts";

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

/**
 * Sends the welcome and the owner notice side by side. Never throws: each
 * failure is logged on its own (`[SUBSCRIBE] welcome failed:` /
 * `[SUBSCRIBE] notify failed:`), and without SMTP both are skipped with a log
 * line each, as the hand-written client did.
 */
export async function sendSubscribeMails(
  sub: NewSubscriber,
  deps: SubscribeMailDeps,
): Promise<void> {
  const log = deps.log ?? console;
  const welcome: EmailMessage = {
    to: sub.email,
    subject: "Welcome to Anton Shubin's newsletter",
    text:
      `Thanks for subscribing!\n\nYou'll get notified when I publish new articles about SaaS architecture, self-hosting, AI integration, and lessons from ${
        proof("jobs")
      }+ projects.\n\nHere's a good place to start:\n${deps.baseUrl}/saas-architecture-guide\n\nUnsubscribe anytime:\n${sub.unsubscribeLink}\n\n— Anton`,
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
    if (!result.ok) log.error(`[SUBSCRIBE] ${what} failed:`, result.error);
  }

  await Promise.all([send(welcome, "welcome"), send(notice, "notify")]);
}
