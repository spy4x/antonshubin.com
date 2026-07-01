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
}

function validate(payload: unknown): {
  ok: false;
  error: string;
} | { ok: true; data: LeadPayload } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const body = payload as Record<string, unknown>;
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

// Send email via SMTP with TLS (port 465) using Deno's native TLS.
// No npm deps — avoids Vite bundling issues with event-based libraries.
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

  // Read greeting
  await read();
  // EHLO
  await cmd(`EHLO ${SMTP_HOST}`);
  // AUTH LOGIN
  await cmd("AUTH LOGIN");
  await cmd(btoa(SMTP_USERNAME));
  await cmd(btoa(SMTP_PASSWORD));
  // MAIL FROM
  await cmd(`MAIL FROM:<${from}>`);
  // RCPT TO
  await cmd(`RCPT TO:<${to}>`);
  // DATA
  await cmd("DATA");
  // Body
  await conn.write(
    enc.encode(
      `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${text}\r\n.\r\n`,
    ),
  );
  await read();
  // QUIT
  await cmd("QUIT");
  conn.close();
}

// Notify the site owner about a new lead via SMTP.
// Falls back to stdout log if SMTP not configured.
// Fail-open: never reject the response on notification failure.
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

export const handler = define.handlers({
  async POST(ctx) {
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

    // Fire notification but never block the response (fail-open).
    notifyOwner(result.data).catch((err) => {
      console.error("[LEAD] failed:", err);
    });

    return Response.json({ ok: true });
  },
});
