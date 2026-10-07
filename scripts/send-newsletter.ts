#!/usr/bin/env -S deno run -A
/**
 * Send newsletter to all subscribers. Runs inside the production container,
 * the only place with the subscriber list and the SMTP settings.
 *
 * Usage:
 *   deno run -A scripts/send-newsletter.ts "Subject" body.txt
 *   deno run -A scripts/send-newsletter.ts "Subject" "inline body text"
 *   deno run -A scripts/send-newsletter.ts --stdin-json < issue.json
 *   deno run -A scripts/send-newsletter.ts --stdin-json --test < issue.json
 *
 * The body file/text supports HTML; it goes into the letter layout
 * (`lib/letter.ts`) with each subscriber's unsubscribe link in the footer.
 *
 * `--stdin-json` is the blog post announcement `deno task publish:blog <slug>
 * --send-newsletter` pipes in over SSH: `{ "slug", "subject", "html", "text"
 * }`, already rendered, with `UNSUBSCRIBE_PLACEHOLDER` where each link goes.
 * It sends at most once per slug, to each subscriber at most once, guarded by
 * the sent log (`@spy4x/server/subscribers`'s `sendIssue` over
 * `data/newsletter-log.json`). With `--test` it sends one copy to
 * `CONTACT_EMAIL` only, with a "[Test]" subject, and writes no log.
 *
 * Every mail carries a version 2 unsubscribe link, which names the row by its
 * `key`. A row stored before #405 has none, and its link would not work, so
 * the script refuses to send while any row lacks one: run
 * `scripts/backfill-subscriber-keys.ts` first (docs/newsletter.md).
 */

import { sendIssue, type Subscriber } from "@spy4x/server/subscribers";
import { createMemorySendLog } from "@spy4x/server/subscribers/memory";
import { BASE_URL, CONTACT_EMAIL } from "@/lib/config.ts";
import { createSiteSender, smtpSettings } from "@/lib/mail.ts";
import {
  type Letter,
  renderLetter,
  SUBSCRIBED_REASON,
  UNSUBSCRIBE_PLACEHOLDER,
} from "@/lib/letter.ts";
import {
  newsletterLog,
  newsletterLogFile,
  subscribersFile,
  subscriberStore,
  subscriptionCrypto,
  unsubscribeUrl,
} from "@/lib/mailing-list.ts";
import { assertKebab } from "./utm.ts";

/** A blog post announcement, as `publish:blog --send-newsletter` sends it. */
export interface PostAnnouncement extends Letter {
  slug: string;
  subject: string;
}

/** Parses and checks the `--stdin-json` input; throws naming what is wrong. */
export function parsePostAnnouncement(json: string): PostAnnouncement {
  const value = JSON.parse(json) as Record<string, unknown>;
  for (const field of ["slug", "subject", "html", "text"]) {
    if (typeof value?.[field] !== "string" || value[field] === "") {
      throw new Error(`--stdin-json input needs a non-empty "${field}" string`);
    }
  }
  const { slug, subject, html, text } = value as unknown as PostAnnouncement;
  assertKebab("slug", slug);
  return { slug, subject, html, text };
}

/** Turns the legacy "subject body" arguments into a letter; the text part is the body without tags. */
export function legacyLetter(body: string): Letter {
  const text = body.replace(/<[^>]*>/g, "").trim();
  return renderLetter({
    baseUrl: BASE_URL,
    campaign: "newsletter",
    blocks: [{ html: body, text }],
    reason: SUBSCRIBED_REASON,
    unsubscribeLink: UNSUBSCRIBE_PLACEHOLDER,
  });
}

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

/** How many rows carry no `key`, so their unsubscribe link would not work. */
export function rowsWithoutKey(rows: readonly Subscriber[]): number {
  return rows.filter((row) => !row.key).length;
}

/** The subject of the one copy `--test` sends to `CONTACT_EMAIL`. */
export function testSubject(subject: string): string {
  return `[Test] ${subject}`;
}

function fail(message: string): never {
  console.error(message);
  Deno.exit(1);
}

async function main() {
  let announcement: PostAnnouncement | undefined;
  let subject: string;
  let letter: Letter;
  const testOnly = Deno.args.includes("--test");
  if (Deno.args[0] === "--stdin-json") {
    try {
      announcement = parsePostAnnouncement(
        await new Response(Deno.stdin.readable).text(),
      );
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
    ({ subject } = announcement);
    letter = { html: announcement.html, text: announcement.text };
  } else {
    const [subjectArg, bodyArg] = Deno.args;
    if (!subjectArg || !bodyArg) {
      fail(
        "Usage: deno run -A scripts/send-newsletter.ts <subject> <body-file|body-text>\n" +
          "   or: deno run -A scripts/send-newsletter.ts --stdin-json < issue.json",
      );
    }
    subject = subjectArg;
    let body: string;
    try {
      body = Deno.readTextFileSync(bodyArg);
    } catch {
      body = bodyArg; // treat as inline text
    }
    letter = legacyLetter(body);
  }

  // Port 465 is this script's default, as before; the routes default to 587.
  const smtp = smtpSettings({
    host: Deno.env.get("SMTP_HOST") || "",
    port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
    user: Deno.env.get("SMTP_USERNAME") || "",
    pass: Deno.env.get("SMTP_PASSWORD") || "",
    from: Deno.env.get("SMTP_FROM") || "",
    ehloName: new URL(BASE_URL).hostname,
  });

  if (!smtp) {
    fail("SMTP not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD.");
  }

  // Fail before sending anything rather than partway through the list —
  // every unsubscribe link needs this to build.
  let crypto;
  try {
    crypto = subscriptionCrypto();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }

  const sender = createSiteSender(smtp);
  const common = {
    letter,
    crypto,
    unsubscribeLink: unsubscribeUrl,
    sender,
  };

  if (testOnly) {
    if (!CONTACT_EMAIL) {
      fail("--test needs CONTACT_EMAIL, the address it sends to.");
    }
    // One row, with its key, into a log that lives only in this process.
    const result = await sendIssue({
      ...common,
      issue: "test-copy",
      subject: testSubject(subject),
      subscribers: [{
        email: CONTACT_EMAIL,
        subscribedAt: new Date(),
        key: await crypto.subscriberKey(CONTACT_EMAIL),
      }],
    }, createMemorySendLog());
    const counts = result.status === "sent"
      ? result
      : { sent: 0, failed: 0, skipped: 0 };
    console.log(
      `\nTest copy done. Sent: ${counts.sent}, Failed: ${counts.failed}`,
    );
    Deno.exit(sendExitCode(counts));
  }

  let subs: Subscriber[];
  try {
    subs = await subscriberStore().list();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  const keyless = rowsWithoutKey(subs);
  if (keyless > 0) {
    fail(
      `Refused: ${keyless} of ${subs.length} subscribers have no key yet, so ` +
        `their unsubscribe link would not work. Nothing was sent or recorded. ` +
        `Run scripts/backfill-subscriber-keys.ts first (docs/newsletter.md).`,
    );
  }

  if (!announcement) {
    // The legacy arguments have no slug, so no sent log: one run, one issue.
    console.log(`Sending to ${subs.length} subscribers...`);
    const result = await sendIssue({
      ...common,
      issue: `manual-${Date.now()}`,
      subject,
      subscribers: subs,
    }, createMemorySendLog());
    const counts = result.status === "sent" ? result : { sent: 0, failed: 0 };
    console.log(`\nDone. Sent: ${counts.sent}, Failed: ${counts.failed}`);
    return;
  }

  const logFile = newsletterLogFile();
  const result = await sendIssue({
    ...common,
    issue: announcement.slug,
    subject,
    subscribers: subs,
  }, newsletterLog());
  if (result.status === "already-sent") {
    fail(
      `Refused: the newsletter for "${announcement.slug}" was already sent ` +
        `(started ${result.entry.startedAt.toISOString()}, ${logFile}). Nothing was sent.`,
    );
  }
  if (result.status === "in-progress") {
    fail(
      `Refused: another send is in progress (${logFile}.lock is held). ` +
        `Nothing was sent. Wait for it to finish, then run the same command again.`,
    );
  }
  if (result.status === "no-subscribers") {
    fail(
      `Refused: no subscribers loaded (is ${subscribersFile()} missing or ` +
        `unreadable?). Nothing was sent or recorded.`,
    );
  }
  console.log(
    `\nDone. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
  );
  Deno.exit(sendExitCode(result));
}

if (import.meta.main) {
  await main();
}
