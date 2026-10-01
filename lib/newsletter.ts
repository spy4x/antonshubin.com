// The send loop behind `scripts/send-newsletter.ts`, kept out of the script so
// a test can run it against a fake sender.
import type { EmailSender, MailLog, SendResult } from "./mail.ts";
import type { Subscriber } from "./subscribers.ts";
import { bareAddress } from "./email-field.ts";
import { fillUnsubscribe, type Letter } from "./letter.ts";

/** One newsletter issue and where it goes. */
export interface NewsletterIssue {
  subscribers: Subscriber[];
  subject: string;
  /**
   * The rendered letter (`lib/letter.ts`), with `UNSUBSCRIBE_PLACEHOLDER`
   * where each subscriber's own link goes.
   */
  letter: Letter;
  unsubscribeLink(email: string): Promise<string>;
  sender: EmailSender;
  log?: MailLog;
  /** True when this address already got the issue; it is then skipped. */
  alreadySent?(email: string): Promise<boolean>;
  /** Called after the relay accepted a mail, with the bare address. */
  onSent?(email: string): void | Promise<void>;
}

/** What one {@linkcode sendNewsletter} run did. */
export interface SendCounts {
  sent: number;
  failed: number;
  /** Subscribers `alreadySent` ruled out. */
  skipped: number;
}

/**
 * Sends the issue to every subscriber, one mail each, and counts the outcome.
 * A mail counts as sent only when the relay accepted it; a subscriber whose
 * link cannot be built counts as failed, and the run goes on. Every mail
 * carries the subscriber's own one-click `List-Unsubscribe` and a plain-text
 * part beside the HTML.
 *
 * A row that is not a bare address, such as one stored before #255 with a
 * display name, is skipped and counted as failed: sent as it is, its display
 * name would reach the recipient's `To:` line. The log names it by row number
 * only, never by the stored value.
 */
export async function sendNewsletter(
  issue: NewsletterIssue,
): Promise<SendCounts> {
  const log = issue.log ?? console;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

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
      if (await issue.alreadySent?.(to)) {
        skipped++;
        continue;
      }
      const link = await issue.unsubscribeLink(to);
      const { html, text } = fillUnsubscribe(issue.letter, link);
      result = await issue.sender.send({
        to,
        subject: issue.subject,
        html,
        text,
        listUnsubscribe: { url: link, oneClick: true },
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
      await issue.onSent?.(to);
    } else {
      failed++;
      log.error(`  ✗ ${to}:`, result.error);
    }
  }

  return { sent, failed, skipped };
}
