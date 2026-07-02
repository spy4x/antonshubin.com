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

const DATA_FILE = "data/subscribers.json";
const BASE_URL = "https://antonshubin.com";

interface Subscriber {
  email: string;
  subscribedAt: string;
}

function loadSubscribers(): Subscriber[] {
  try {
    return JSON.parse(Deno.readTextFileSync(DATA_FILE));
  } catch {
    console.error("No subscribers found at", DATA_FILE);
    Deno.exit(1);
  }
}

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

const from = Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USERNAME") || "";
const host = Deno.env.get("SMTP_HOST") || "";
const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
const user = Deno.env.get("SMTP_USERNAME") || "";
const pass = Deno.env.get("SMTP_PASSWORD") || "";

if (!host || !user || !pass) {
  console.error(
    "SMTP not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD.",
  );
  Deno.exit(1);
}

const subs = loadSubscribers();
console.log(`Sending to ${subs.length} subscribers...`);

let sent = 0;
let failed = 0;

for (const sub of subs) {
  const unsubscribeLink = `${BASE_URL}/api/unsubscribe?email=${
    encodeURIComponent(sub.email)
  }`;
  const fullBody =
    `${body}\n\n---\n<a href="${unsubscribeLink}">Unsubscribe</a> | ${BASE_URL}`;

  try {
    const conn = await Deno.connectTls({ hostname: host, port });
    const buf = new Uint8Array(4096);
    const enc = new TextEncoder();
    const read = async () => {
      const n = await conn.read(buf);
      return new TextDecoder().decode(buf.subarray(0, n ?? 0));
    };
    const cmd = async (line: string) => {
      await conn.write(enc.encode(line + "\r\n"));
      return read();
    };

    await read();
    await cmd(`EHLO ${host}`);
    await cmd("AUTH LOGIN");
    await cmd(btoa(user));
    await cmd(btoa(pass));
    await cmd(`MAIL FROM:<${from}>`);
    await cmd(`RCPT TO:<${sub.email}>`);
    await cmd("DATA");
    await conn.write(enc.encode(
      `From: ${from}\r\nTo: ${sub.email}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${fullBody}\r\n.\r\n`,
    ));
    await read();
    await cmd("QUIT");
    conn.close();
    sent++;
    console.log(`  ✓ ${sub.email}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${sub.email}:`, err);
  }
}

console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
