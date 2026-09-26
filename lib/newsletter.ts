// The send loop behind `scripts/send-newsletter.ts`, kept out of the script so
// a test can run it against a fake sender.
import type { EmailSender, MailLog, SendResult } from "./mail.ts";
import type { Subscriber } from "./subscribers.ts";
import { bareAddress } from "./email-field.ts";

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
 *
 * A row that is not a bare address, such as one stored before #255 with a
 * display name, is skipped and counted as failed: sent as it is, its display
 * name would reach the recipient's `To:` line. The log names it by row number
 * only, never by the stored value.
 */
export async function sendNewsletter(
  issue: NewsletterIssue,
): Promise<{ sent: number; failed: number }> {
  const log = issue.log ?? console;
  let sent = 0;
  let failed = 0;

  for (const [index, sub] of issue.subscribers.entries()) {
    const to = bareAddress(sub.email);
    if (to === null) {
      failed++;
      log.error(`  ✗ row ${index + 1}: not a bare address, skipped`);
      continue;
    }
    // A link that cannot be built or a send that throws must cost that one
    // mail, not stop the run partway through the list.
    let result: SendResult;
    try {
      const link = await issue.unsubscribeLink(to);
      const html =
        `${issue.body}\n\n---\n<a href="${link}">Unsubscribe</a> | ${issue.baseUrl}`;
      result = await issue.sender.send({
        to,
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
      log.log(`  ✓ ${to}`);
    } else {
      failed++;
      log.error(`  ✗ ${to}:`, result.error);
    }
  }

  return { sent, failed };
}
