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
import { createSiteSender, smtpSettings } from "../../lib/mail.ts";
import { notifyOwner } from "../../lib/lead-mail.ts";

interface LeadPayload {
  name: string;
  email: string;
  techStack: string;
  _t?: number;
  _website?: string;
}

// ── In-memory rate limiter (per IP, 3 submissions per hour) ──────────
const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS = 3;
const WINDOW_MS = 3600_000; // 1 hour

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

// ── Validation ───────────────────────────────────────────────────────
function validate(payload: unknown): {
  ok: false;
  error: string;
} | { ok: true; data: LeadPayload } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const body = payload as Record<string, unknown>;

  // Honeypot: _website must be empty (bots fill it)
  if (
    body._website && typeof body._website === "string" &&
    body._website.trim() !== ""
  ) {
    return { ok: false, error: "Invalid request" };
  }

  // Time gate: if _t is present and valid, reject <3s (bots submit instantly)
  // Missing/invalid _t is tolerated — some Preact hydration paths lose it.
  if (typeof body._t === "number" && body._t > 1e12) {
    const elapsed = Date.now() - body._t;
    if (elapsed < 3000) {
      return { ok: false, error: "Please wait a moment before submitting" };
    }
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return { ok: false, error: "Name is required" };
  }
  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    return { ok: false, error: "Valid email is required" };
  }
  if (typeof body.techStack !== "string" || !body.techStack.trim()) {
    return { ok: false, error: "Tech stack description is required" };
  }
  return {
    ok: true,
    data: {
      name: body.name.trim(),
      email: body.email.trim(),
      techStack: body.techStack.trim(),
    },
  };
}

// ── Mail ─────────────────────────────────────────────────────────────
const SMTP = smtpSettings({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USERNAME,
  pass: SMTP_PASSWORD,
  from: SMTP_FROM,
  ehloName: new URL(BASE_URL).hostname,
});
const SENDER = SMTP ? createSiteSender(SMTP) : null;

// ── Handler ──────────────────────────────────────────────────────────
export const handler = define.handlers({
  async POST(ctx) {
    // Rate limit by IP
    const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ctx.req.headers.get("x-real-ip") || "unknown";
    const rateError = checkRateLimit(ip);
    if (rateError) {
      return Response.json({ error: rateError }, { status: 429 });
    }

    let payload: unknown;
    try {
      payload = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = validate(payload);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    notifyOwner(result.data, {
      sender: SENDER,
      contactEmail: CONTACT_EMAIL,
      relay: SMTP_HOST + ":" + SMTP_PORT,
    }).catch((err) => {
      console.error("[LEAD] failed:", err);
    });

    return Response.json({ ok: true });
  },
});
