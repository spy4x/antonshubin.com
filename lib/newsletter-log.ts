/**
 * The per-post newsletter sent log (#260, #364): one entry per blog post that
 * was announced by email, and under it who already got the mail, so a repeated
 * `publish:blog <slug> --send-newsletter` cannot mail anyone twice and a rerun
 * after a partial failure mails only the ones who were missed.
 *
 * Recipients are kept as keyed hashes, never addresses (see
 * {@linkcode sentMark}), like `lib/unsubscribed.ts` does.
 *
 * On the server the file lives next to `subscribers.json` in the bind-mounted
 * `data/` directory, so it survives deploys and is backed up with the list
 * (docs/deploy.md "Subscriber data").
 */
import { atomicWriteJson } from "@spy4x/platform/server/atomic-json";
import { denoFileSystem } from "@spy4x/platform/server/deno-fs";
import { FileLock } from "@spy4x/platform/server/file-lock";
import { type NewsletterIssue, sendNewsletter } from "./newsletter.ts";

const encoder = new TextEncoder();

/**
 * The keyed hash that stands for "this address got this post": HMAC-SHA256
 * under `UNSUBSCRIBE_SECRET` of the post's slug and the trimmed, lowercased
 * address, in hex. The slug is part of the message, so one person's marks for
 * two posts cannot be matched to each other, and nobody without the secret can
 * check a guessed address against the file.
 */
export async function sentMark(
  email: string,
  slug: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`newsletter-sent:${slug}:${email.trim().toLowerCase()}`),
  );
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** One announced post. */
export interface NewsletterLogEntry {
  slug: string;
  subject: string;
  /** When the send was claimed, before the first mail went out. */
  startedAt: string;
  /**
   * Sent marks of everyone who was on the list when the first run started:
   * the people this post is meant for. A later run mails only their missing
   * members, so a subscriber who joined afterwards never gets an old post.
   */
  audience?: string[];
  /** Sent marks of everyone the mail server accepted. Missing in an entry written before #364. */
  recipients?: string[];
  /** How many mails the relay accepted in total. */
  sent?: number;
  /** How many failed in the latest run. */
  failed?: number;
  /** Set by a run that finished with no failure; the post is then closed. */
  completedAt?: string;
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

let writeSequence = 0;

/** Writes through a temp file and a rename, like `subscribers.json`, so a crash or full disk never leaves a torn log. */
async function saveNewsletterLog(
  file: string,
  entries: NewsletterLogEntry[],
): Promise<void> {
  const slash = file.lastIndexOf("/");
  if (slash !== -1) Deno.mkdirSync(file.slice(0, slash), { recursive: true });
  await atomicWriteJson(denoFileSystem, file, entries, {
    pid: Deno.pid,
    sequence: ++writeSequence,
  });
}

/** What {@linkcode sendNewsletterOnce} did. */
export type SendOnceResult =
  | { status: "already-sent"; entry: NewsletterLogEntry }
  | { status: "no-subscribers" }
  | { status: "in-progress" }
  | { status: "sent"; sent: number; failed: number; skipped: number };

/**
 * The exit code for a finished send: 0 only when none failed and the run
 * either sent a mail or had nobody left to send to (a rerun that only
 * completes the log), so a run that reached nobody or missed someone is not
 * reported as a success.
 */
export function sendExitCode(
  { sent, failed, skipped = 0 }: {
    sent: number;
    failed: number;
    skipped?: number;
  },
): number {
  return failed > 0 || (sent === 0 && skipped === 0) ? 1 : 0;
}

/**
 * Sends `issue` for the post `slug` to the people the log says it is for and
 * has not yet reached. A post whose earlier run finished with no failure
 * (`completedAt`), and an entry written before #364 (no recipient list), is
 * refused: nobody gets an old post twice. A post whose run crashed or had a
 * failure is resumed, and mails only the missing members of the audience the
 * first run recorded (everyone on the list then), never a later subscriber,
 * so one row that can never be mailed does not open the post to newcomers.
 *
 * The whole send holds the lock file `<logFile>.lock`, and a second call that
 * finds it held is refused as `in-progress` instead of waiting, so two
 * overlapping runs cannot mail the same people twice.
 *
 * An empty subscriber list is refused before anything is recorded: on the
 * server it means `subscribers.json` is missing or unreadable, and recording
 * the slug would block the real send later.
 *
 * The entry is written before the first mail, and each recipient's mark right
 * after the mail server accepts that mail, so a crash costs at most the one
 * mail in flight a second time. The lock is held by the OS on the open
 * file, so a crashed process frees it. To resend to everyone on purpose,
 * remove the entry by hand.
 */
export async function sendNewsletterOnce(
  { slug, logFile, issue, secret, now = () => new Date(), onStart }: {
    slug: string;
    logFile: string;
    issue: NewsletterIssue;
    /** `UNSUBSCRIBE_SECRET`, the key of every {@linkcode sentMark}. */
    secret: string;
    now?: () => Date;
    /** Called once the entry is recorded, right before the first mail. */
    onStart?: (counts: { total: number; pending: number }) => void;
  },
): Promise<SendOnceResult> {
  const slash = logFile.lastIndexOf("/");
  if (slash !== -1) {
    Deno.mkdirSync(logFile.slice(0, slash), { recursive: true });
  }
  const lock = new FileLock({ fs: denoFileSystem, path: `${logFile}.lock` });
  if (!(await lock.tryAcquire())) return { status: "in-progress" };
  try {
    return await sendLocked();
  } finally {
    await lock.release();
  }

  async function sendLocked(): Promise<SendOnceResult> {
    const entries = loadNewsletterLog(logFile);
    const previous = entries.find((e) => e.slug === slug);
    if (
      previous && (previous.recipients === undefined || previous.completedAt)
    ) {
      return { status: "already-sent", entry: previous };
    }
    if (issue.subscribers.length === 0) return { status: "no-subscribers" };

    const entry: NewsletterLogEntry = previous ?? {
      slug,
      subject: issue.subject,
      startedAt: now().toISOString(),
      recipients: [],
    };
    if (entry.audience === undefined) {
      entry.audience = await Promise.all(
        issue.subscribers.map((s) => sentMark(s.email, slug, secret)),
      );
    }
    const audience = new Set(entry.audience);
    const recipients = new Set(entry.recipients);
    const save = () =>
      saveNewsletterLog(logFile, previous ? entries : [...entries, entry]);
    await save();

    let pending = 0;
    for (const sub of issue.subscribers) {
      const mark = await sentMark(sub.email, slug, secret);
      if (audience.has(mark) && !recipients.has(mark)) pending++;
    }
    onStart?.({ total: issue.subscribers.length, pending });

    const counts = await sendNewsletter({
      ...issue,
      alreadySent: async (email) => {
        const mark = await sentMark(email, slug, secret);
        return recipients.has(mark) || !audience.has(mark);
      },
      onSent: async (email) => {
        recipients.add(await sentMark(email, slug, secret));
        entry.recipients = [...recipients];
        await save();
      },
    });
    entry.sent = recipients.size;
    entry.failed = counts.failed;
    if (counts.failed === 0) entry.completedAt = now().toISOString();
    await save();
    return { status: "sent", ...counts };
  }
}
