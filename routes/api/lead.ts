import { define } from "../../lib/utils.ts";

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

// Notify the site owner about a new lead.
// Uses CONTACT_EMAIL env var if configured; otherwise logs to stdout.
// Fail-open: non-critical — never reject the response on notification failure.
function notifyOwner(lead: LeadPayload): void {
  const contactEmail = Deno.env.get("CONTACT_EMAIL");
  if (!contactEmail) {
    console.log("[LEAD]", JSON.stringify(lead));
    return;
  }

  // Build a simple notification. SMTP or external API can be wired here.
  // For now, log to stdout — production monitoring picks it up.
  console.log(
    `[LEAD] New lead from ${lead.name} <${lead.email}>: ${lead.techStack}`,
  );
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
    try {
      notifyOwner(result.data);
    } catch (err) {
      console.error("[LEAD] notification failed:", err);
    }

    return Response.json({ ok: true });
  },
});
