#!/usr/bin/env -S deno run -A
/**
 * Send newsletter to all subscribers. Runs inside the production container,
 * the only place with the subscriber list and the SMTP settings.
 *
 * Usage:
 *   deno run -A scripts/send-newsletter.ts "Subject" body.txt
 *   deno run -A scripts/send-newsletter.ts "Subject" "inline body text"
 *   deno run -A scripts/send-newsletter.ts --stdin-json < issue.json
 *
 * The body file/text supports HTML. Unsubscribe link is auto-appended.
 *
 * `--stdin-json` is the blog post announcement `deno task publish:blog <slug>
 * --send-newsletter` pipes in over SSH: `{ "slug", "subject", "body" }`. It
 * sends at most once per slug, guarded by the sent log in
 * `lib/newsletter-log.ts`.
 */

import { loadSubscribers } from "@/lib/subscribers.ts";
import { BASE_URL, getUnsubscribeSecret } from "@/lib/config.ts";
import { unsubscribeLink } from "@/lib/unsubscribe.ts";
import { createSiteSender, smtpSettings } from "@/lib/mail.ts";
import { type NewsletterIssue, sendNewsletter } from "@/lib/newsletter.ts";
import {
  NEWSLETTER_LOG_FILE,
  sendNewsletterOnce,
} from "@/lib/newsletter-log.ts";
import { assertKebab } from "./utm.ts";

/** A blog post announcement, as `publish:blog --send-newsletter` sends it. */
export interface PostAnnouncement {
  slug: string;
  subject: string;
  body: string;
}

/** Parses and checks the `--stdin-json` input; throws naming what is wrong. */
export function parsePostAnnouncement(json: string): PostAnnouncement {
  const value = JSON.parse(json) as Record<string, unknown>;
  for (const field of ["slug", "subject", "body"]) {
    if (typeof value?.[field] !== "string" || value[field] === "") {
      throw new Error(`--stdin-json input needs a non-empty "${field}" string`);
    }
  }
  const { slug, subject, body } = value as unknown as PostAnnouncement;
  assertKebab("slug", slug);
  return { slug, subject, body };
}

function fail(message: string): never {
  console.error(message);
  Deno.exit(1);
}

async function main() {
  let announcement: PostAnnouncement | undefined;
  let subject: string;
  let body: string;
  if (Deno.args[0] === "--stdin-json") {
    try {
      announcement = parsePostAnnouncement(
        await new Response(Deno.stdin.readable).text(),
      );
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
    ({ subject, body } = announcement);
  } else {
    const [subjectArg, bodyArg] = Deno.args;
    if (!subjectArg || !bodyArg) {
      fail(
        "Usage: deno run -A scripts/send-newsletter.ts <subject> <body-file|body-text>\n" +
          "   or: deno run -A scripts/send-newsletter.ts --stdin-json < issue.json",
      );
    }
    subject = subjectArg;
    try {
      body = Deno.readTextFileSync(bodyArg);
    } catch {
      body = bodyArg; // treat as inline text
    }
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
  try {
    getUnsubscribeSecret();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }

  const subs = loadSubscribers();
  const issue: NewsletterIssue = {
    subscribers: subs,
    subject,
    body,
    baseUrl: BASE_URL,
    unsubscribeLink,
    sender: createSiteSender(smtp),
  };

  if (!announcement) {
    console.log(`Sending to ${subs.length} subscribers...`);
    const { sent, failed } = await sendNewsletter(issue);
    console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
    return;
  }

  const logFile = Deno.env.get("NEWSLETTER_LOG_FILE") || NEWSLETTER_LOG_FILE;
  console.log(
    `Sending "${announcement.slug}" to ${subs.length} subscribers...`,
  );
  const result = await sendNewsletterOnce({
    slug: announcement.slug,
    logFile,
    issue,
  });
  if (result.status === "already-sent") {
    fail(
      `Refused: the newsletter for "${announcement.slug}" was already sent ` +
        `(started ${result.entry.startedAt}, ${logFile}). Nothing was sent.`,
    );
  }
  console.log(`\nDone. Sent: ${result.sent}, Failed: ${result.failed}`);
}

if (import.meta.main) {
  await main();
}
