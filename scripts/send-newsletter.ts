#!/usr/bin/env -S deno run -A
/**
 * Send newsletter to all subscribers.
 *
 * Usage:
 *   deno run -A scripts/send-newsletter.ts "Subject" body.txt
 *   deno run -A scripts/send-newsletter.ts "Subject" "inline body text"
 *
 * The body file/text supports HTML. Unsubscribe link is auto-appended.
 */

import { loadSubscribers } from "@/lib/subscribers.ts";
import { BASE_URL, getUnsubscribeSecret } from "@/lib/config.ts";
import { unsubscribeLink } from "@/lib/unsubscribe.ts";
import { createSiteSender, smtpSettings } from "@/lib/mail.ts";
import { sendNewsletter } from "@/lib/newsletter.ts";

const [subject, bodyArg] = Deno.args;
if (!subject || !bodyArg) {
  console.error(
    "Usage: deno run -A scripts/send-newsletter.ts <subject> <body-file|body-text>",
  );
  Deno.exit(1);
}

let body: string;
try {
  body = Deno.readTextFileSync(bodyArg);
} catch {
  body = bodyArg; // treat as inline text
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
  console.error(
    "SMTP not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD.",
  );
  Deno.exit(1);
}

// Fail before sending anything rather than partway through the list —
// every unsubscribe link needs this to build.
try {
  getUnsubscribeSecret();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  Deno.exit(1);
}

const subs = loadSubscribers();
console.log(`Sending to ${subs.length} subscribers...`);

const { sent, failed } = await sendNewsletter({
  subscribers: subs,
  subject,
  body,
  baseUrl: BASE_URL,
  unsubscribeLink,
  sender: createSiteSender(smtp),
});

console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
