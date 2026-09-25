import { define } from "../../lib/utils.ts";
import {
  BASE_URL,
  CONTACT_EMAIL,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "../../lib/config.ts";
import { loadSubscribers, saveSubscribers } from "../../lib/subscribers.ts";
import { unsubscribeLink } from "../../lib/unsubscribe.ts";
import { createSiteSender, smtpSettings } from "../../lib/mail.ts";
import { sendSubscribeMails } from "../../lib/subscribe-mail.ts";

const SMTP = smtpSettings({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USERNAME,
  pass: SMTP_PASSWORD,
  from: SMTP_FROM,
});
const SENDER = SMTP ? createSiteSender(SMTP) : null;

// ── In-memory rate limiter ──────────────────────────────────────────────
const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS = 3;
const WINDOW_MS = 3600_000;

function checkRateLimit(ip: string): string | null {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  if (entry.count >= MAX_SUBMISSIONS) {
    return "Too many requests. Try again later.";
  }
  entry.count++;
  return null;
}

export const handler = define.handlers({
  async POST(ctx) {
    const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ctx.req.headers.get("x-real-ip") || "unknown";
    const rateError = checkRateLimit(ip);
    if (rateError) {
      return Response.json({ error: rateError }, { status: 429 });
    }

    let body: { email?: string };
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
      !body.email || typeof body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    ) {
      return Response.json({ error: "Valid email is required" }, {
        status: 400,
      });
    }

    const email = body.email.trim().toLowerCase();
    const subs = loadSubscribers();

    if (subs.some((s) => s.email === email)) {
      return Response.json({ ok: true, message: "Already subscribed" });
    }

    // Build the unsubscribe link before saving anything: a missing or too
    // short UNSUBSCRIBE_SECRET fails the whole request instead of saving an
    // address whose unsubscribe link would never work.
    let link: string;
    try {
      link = await unsubscribeLink(email);
    } catch (err) {
      console.error("[SUBSCRIBE] cannot build unsubscribe link:", err);
      return Response.json({ error: "Server misconfigured" }, {
        status: 500,
      });
    }

    subs.push({ email, subscribedAt: new Date().toISOString() });
    try {
      saveSubscribers(subs);
    } catch (err) {
      console.error("[SUBSCRIBE] failed to save:", err);
      return Response.json({ error: "Could not save subscription" }, {
        status: 500,
      });
    }

    // Welcome the subscriber and notify the owner, without waiting for either.
    sendSubscribeMails(
      { email, total: subs.length, unsubscribeLink: link },
      { sender: SENDER, contactEmail: CONTACT_EMAIL, baseUrl: BASE_URL },
    ).catch((err) => console.error("[SUBSCRIBE] mail failed:", err));

    return Response.json({ ok: true });
  },
});
