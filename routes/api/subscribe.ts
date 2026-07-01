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

export interface Subscriber {
  email: string;
  subscribedAt: string;
}

// JSON file-backed subscriber storage (persists in container, backup manually)
const DATA_FILE = "data/subscribers.json";

function loadSubscribers(): Subscriber[] {
  try {
    const raw = Deno.readTextFileSync(DATA_FILE);
    return JSON.parse(raw) as Subscriber[];
  } catch {
    return [];
  }
}

function saveSubscribers(list: Subscriber[]): void {
  try {
    Deno.mkdirSync("data", { recursive: true });
    Deno.writeTextFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error("[SUBSCRIBE] failed to save:", err);
  }
}

// ── Simple SMTP send (reuses lead.ts pattern) ──────────────────────────
async function sendMail(
  to: string,
  from: string,
  subject: string,
  text: string,
): Promise<void> {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    console.log("[SUBSCRIBE] SMTP not configured, skipping mail");
    return;
  }
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

    subs.push({ email, subscribedAt: new Date().toISOString() });
    saveSubscribers(subs);

    // Welcome the subscriber
    sendMail(
      email,
      SMTP_FROM || SMTP_USERNAME,
      "Welcome to Anton Shubin's newsletter",
      `Thanks for subscribing!\n\nYou'll get notified when I publish new articles about SaaS architecture, self-hosting, AI integration, and lessons from 80+ projects.\n\nHere's a good place to start:\n${BASE_URL}/saas-architecture-guide\n\nUnsubscribe anytime:\n${BASE_URL}/api/unsubscribe?email=${
        encodeURIComponent(email)
      }\n\n— Anton`,
    ).catch((err) => console.error("[SUBSCRIBE] welcome failed:", err));

    // Notify owner
    sendMail(
      CONTACT_EMAIL,
      SMTP_FROM || SMTP_USERNAME,
      `[Newsletter] New subscriber: ${email}`,
      `${email} subscribed.\nTotal subscribers: ${subs.length}\n\nUnsubscribe: ${BASE_URL}/api/unsubscribe?email=${
        encodeURIComponent(email)
      }`,
    ).catch((err) => console.error("[SUBSCRIBE] notify failed:", err));

    return Response.json({ ok: true });
  },
});
