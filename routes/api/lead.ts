import { define } from "../../lib/utils.ts";
import {
  CONTACT_EMAIL,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "../../lib/config.ts";

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

  // Time gate: submission must be >3s after page load, and <1h
  const ts = typeof body._t === "number" ? body._t : 0;
  const elapsed = Date.now() - ts;
  if (elapsed < 3000) {
    return { ok: false, error: "Please wait a moment before submitting" };
  }
  if (elapsed > 3600_000) {
    return { ok: false, error: "Session expired. Please reload the page." };
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

// ── SMTP ─────────────────────────────────────────────────────────────
async function sendMail(
  to: string,
  from: string,
  subject: string,
  text: string,
): Promise<void> {
  const conn = await Deno.connectTls({
    hostname: SMTP_HOST,
    port: SMTP_PORT,
  });
  const buf = new Uint8Array(4096);
  const enc = new TextEncoder();

  async function read(): Promise<string> {
    const n = await conn.read(buf);
    return new TextDecoder().decode(buf.subarray(0, n ?? 0));
  }

  async function cmd(line: string): Promise<string> {
    await conn.write(enc.encode(line + "\r\n"));
    return read();
  }

  await read();
  await cmd(`EHLO ${SMTP_HOST}`);
  await cmd("AUTH LOGIN");
  await cmd(btoa(SMTP_USERNAME));
  await cmd(btoa(SMTP_PASSWORD));
  await cmd(`MAIL FROM:<${from}>`);
  await cmd(`RCPT TO:<${to}>`);
  await cmd("DATA");
  await conn.write(
    enc.encode(
      `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${text}\r\n.\r\n`,
    ),
  );
  await read();
  await cmd("QUIT");
  conn.close();
}

async function notifyOwner(lead: LeadPayload): Promise<void> {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD || !CONTACT_EMAIL) {
    console.log(
      "[LEAD] SMTP not configured, logging lead:",
      JSON.stringify(lead),
    );
    return;
  }

  console.log("[LEAD] sending via " + SMTP_HOST + ":" + SMTP_PORT);
  const subject = `[Lead] Architecture audit request from ${lead.name}`;
  const text =
    `New audit request from ${lead.name} (${lead.email}):\n\n${lead.techStack}`;
  await sendMail(CONTACT_EMAIL, SMTP_FROM || SMTP_USERNAME, subject, text);
  console.log("[LEAD] sent OK");
}

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

    notifyOwner(result.data).catch((err) => {
      console.error("[LEAD] failed:", err);
    });

    return Response.json({ ok: true });
  },
});
