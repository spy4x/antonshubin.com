// The send loop behind `scripts/send-newsletter.ts`, kept out of the script so
// a test can run it against a fake sender.
import type { EmailSender, MailLog, SendResult } from "./mail.ts";
import type { Subscriber } from "./subscribers.ts";

/** One newsletter issue and where it goes. */
export interface NewsletterIssue {
  subscribers: Subscriber[];
  subject: string;
  /** HTML body; the unsubscribe footer is appended per subscriber. */
  body: string;
  baseUrl: string;
  unsubscribeLink(email: string): Promise<string>;
  sender: EmailSender;
  log?: MailLog;
}

/**
 * Sends the issue to every subscriber, one mail each, and counts the outcome.
 * A mail counts as sent only when the relay accepted it; a subscriber whose
 * link cannot be built counts as failed, and the run goes on.
 */
export async function sendNewsletter(
  issue: NewsletterIssue,
): Promise<{ sent: number; failed: number }> {
  const log = issue.log ?? console;
  let sent = 0;
  let failed = 0;

  for (const sub of issue.subscribers) {
    // One bad stored address (say, one the unsubscribe codec refuses to sign)
    // must cost that one mail, not stop the run partway through the list.
    let result: SendResult;
    try {
      const link = await issue.unsubscribeLink(sub.email);
      const html =
        `${issue.body}\n\n---\n<a href="${link}">Unsubscribe</a> | ${issue.baseUrl}`;
      result = await issue.sender.send({
        to: sub.email,
        subject: issue.subject,
        html,
      });
    } catch (err) {
      result = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        accepted: [],
        rejected: [],
        duplicates: [],
      };
    }
    if (result.ok) {
      sent++;
      log.log(`  ✓ ${sub.email}`);
    } else {
      failed++;
      log.error(`  ✗ ${sub.email}:`, result.error);
    }
  }

  return { sent, failed };
}
