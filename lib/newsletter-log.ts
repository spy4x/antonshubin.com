/**
 * The per-post newsletter sent log (#260): one entry per blog post that was
 * announced by email, so a repeated `publish:blog <slug> --send-newsletter`
 * cannot mail every subscriber twice.
 *
 * On the server the file lives next to `subscribers.json` in the bind-mounted
 * `data/` directory, so it survives deploys and is backed up with the list
 * (docs/deploy.md "Subscriber data").
 */
import { type NewsletterIssue, sendNewsletter } from "./newsletter.ts";

/** One announced post. */
export interface NewsletterLogEntry {
  slug: string;
  subject: string;
  /** When the send was claimed, before the first mail went out. */
  startedAt: string;
  /** Filled in once the run finishes; missing if it crashed partway. */
  sent?: number;
  failed?: number;
}

/** The log's default path inside the container's working directory. */
export const NEWSLETTER_LOG_FILE = "data/newsletter-log.json";

/**
 * Reads the log. A missing file is an empty log. A file that exists but does
 * not parse throws: a corrupt log must stop a send, not allow a second one.
 */
export function loadNewsletterLog(file: string): NewsletterLogEntry[] {
  let raw: string;
  try {
    raw = Deno.readTextFileSync(file);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      `${file} is not a JSON array; fix it by hand before sending`,
    );
  }
  return parsed as NewsletterLogEntry[];
}

function saveNewsletterLog(file: string, entries: NewsletterLogEntry[]): void {
  const slash = file.lastIndexOf("/");
  if (slash !== -1) Deno.mkdirSync(file.slice(0, slash), { recursive: true });
  Deno.writeTextFileSync(file, `${JSON.stringify(entries, null, 2)}\n`);
}

/** What {@linkcode sendNewsletterOnce} did. */
export type SendOnceResult =
  | { status: "already-sent"; entry: NewsletterLogEntry }
  | { status: "sent"; sent: number; failed: number };

/**
 * Sends `issue` for the post `slug` unless the log already names that slug.
 *
 * The slug is written to the log before the first mail goes out, not after
 * the last: a run that crashes partway then refuses to start again, which
 * costs some subscribers the mail, instead of mailing the ones already
 * reached a second time. To resend on purpose, remove the entry by hand.
 */
export async function sendNewsletterOnce(
  { slug, logFile, issue, now = () => new Date() }: {
    slug: string;
    logFile: string;
    issue: NewsletterIssue;
    now?: () => Date;
  },
): Promise<SendOnceResult> {
  const entries = loadNewsletterLog(logFile);
  const previous = entries.find((e) => e.slug === slug);
  if (previous) return { status: "already-sent", entry: previous };

  const entry: NewsletterLogEntry = {
    slug,
    subject: issue.subject,
    startedAt: now().toISOString(),
  };
  saveNewsletterLog(logFile, [...entries, entry]);

  const { sent, failed } = await sendNewsletter(issue);
  saveNewsletterLog(logFile, [...entries, { ...entry, sent, failed }]);
  return { status: "sent", sent, failed };
}
