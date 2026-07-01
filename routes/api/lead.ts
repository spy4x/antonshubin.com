import { define } from "../../lib/utils.ts";
import {
  CONTACT_EMAIL,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "../../lib/config.ts";
import nodemailer from "nodemailer";

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

function buildEmailHtml(lead: LeadPayload): string {
  return `
<h2>New Architecture Audit Request</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px">
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Name</td><td style="padding:8px">${lead.name}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px">${lead.email}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Tech Stack / Idea</td><td style="padding:8px">${
    lead.techStack.replace(/\n/g, "<br>")
  }</td></tr>
</table>
<hr>
<p style="color:#666;font-size:12px">Sent via antonshubin.com lead form</p>`;
}

// Notify the site owner about a new lead via SMTP.
// Falls back to stdout log if SMTP not configured.
// Fail-open: never reject the response on notification failure.
async function notifyOwner(lead: LeadPayload): Promise<void> {
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD || !CONTACT_EMAIL) {
    console.log("[LEAD]", JSON.stringify(lead));
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USERNAME,
    to: CONTACT_EMAIL,
    replyTo: lead.email,
    subject: `[Lead] Architecture audit request from ${lead.name}`,
    text:
      `New audit request from ${lead.name} (${lead.email}):\n\n${lead.techStack}`,
    html: buildEmailHtml(lead),
  });
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
      console.error("[LEAD] notification failed:", err);
    });

    return Response.json({ ok: true });
  },
});
