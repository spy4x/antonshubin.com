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
import { addSubscriber } from "../../lib/subscribe.ts";

const SMTP = smtpSettings({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USERNAME,
  pass: SMTP_PASSWORD,
  from: SMTP_FROM,
  ehloName: new URL(BASE_URL).hostname,
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

    let body: { email?: unknown } | null;
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Mails go out after the answer; addSubscriber logs their failures.
    const outcome = await addSubscriber(body?.email, {
      load: loadSubscribers,
      save: saveSubscribers,
      unsubscribeLink,
      mail: { sender: SENDER, contactEmail: CONTACT_EMAIL, baseUrl: BASE_URL },
    });
    return Response.json(outcome.body, { status: outcome.status });
  },
});
