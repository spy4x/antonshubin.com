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
 * the sent log in `lib/newsletter-log.ts`. With `--test` it sends one copy to
 * `CONTACT_EMAIL` only, with a "[Test]" subject, and writes no log.
 */

import { loadSubscribers } from "@/lib/subscribers.ts";
import { BASE_URL, CONTACT_EMAIL, getUnsubscribeSecret } from "@/lib/config.ts";
import { unsubscribeLink } from "@/lib/unsubscribe.ts";
import { createSiteSender, smtpSettings } from "@/lib/mail.ts";
import { type NewsletterIssue, sendNewsletter } from "@/lib/newsletter.ts";
import {
  type Letter,
  renderLetter,
  SUBSCRIBED_REASON,
  UNSUBSCRIBE_PLACEHOLDER,
} from "@/lib/letter.ts";
import {
  NEWSLETTER_LOG_FILE,
  sendExitCode,
  sendNewsletterOnce,
} from "@/lib/newsletter-log.ts";
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
  try {
    getUnsubscribeSecret();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }

  const sender = createSiteSender(smtp);

  if (testOnly) {
    if (!CONTACT_EMAIL) {
      fail("--test needs CONTACT_EMAIL, the address it sends to.");
    }
    const counts = await sendNewsletter({
      subscribers: [{
        email: CONTACT_EMAIL,
        subscribedAt: new Date().toISOString(),
      }],
      subject: testSubject(subject),
      letter,
      unsubscribeLink,
      sender,
    });
    console.log(
      `\nTest copy done. Sent: ${counts.sent}, Failed: ${counts.failed}`,
    );
    Deno.exit(sendExitCode(counts));
  }

  let subs;
  try {
    subs = await loadSubscribers();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  const issue: NewsletterIssue = {
    subscribers: subs,
    subject,
    letter,
    unsubscribeLink,
    sender,
  };

  if (!announcement) {
    console.log(`Sending to ${subs.length} subscribers...`);
    const { sent, failed } = await sendNewsletter(issue);
    console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
    return;
  }

  const logFile = Deno.env.get("NEWSLETTER_LOG_FILE") || NEWSLETTER_LOG_FILE;
  const result = await sendNewsletterOnce({
    slug: announcement.slug,
    logFile,
    issue,
    secret: getUnsubscribeSecret(),
    onStart: ({ total, pending }) =>
      console.log(
        `Sending "${announcement.slug}" to ${pending} of ${total} subscribers` +
          (pending < total ? ` (${total - pending} already got it)` : "") +
          `...`,
      ),
  });
  if (result.status === "already-sent") {
    fail(
      `Refused: the newsletter for "${announcement.slug}" was already sent ` +
        `(started ${result.entry.startedAt}, ${logFile}). Nothing was sent.`,
    );
  }
  if (result.status === "no-subscribers") {
    fail(
      `Refused: no subscribers loaded (is ${
        Deno.env.get("SUBSCRIBERS_FILE") || "data/subscribers.json"
      } missing or unreadable?). Nothing was sent or recorded.`,
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
