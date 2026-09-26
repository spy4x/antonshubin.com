// What `/api/lead` does with a posted audit request: validate it, then mail it
// to the owner. Kept out of the route so a test can run it against a fake
// mail relay.
import { bareAddress } from "./email-field.ts";
import { type Lead, type LeadMailDeps, notifyOwner } from "./lead-mail.ts";

/** The HTTP answer, plus the owner's mail still in flight (the route does not
 * wait for it; a test does). */
export interface AcceptLeadOutcome {
  status: number;
  body: Record<string, unknown>;
  mail: Promise<void>;
}

/** The dependencies of {@link acceptLead}: the owner's mail, and a clock. */
export interface AcceptLeadDeps extends LeadMailDeps {
  now?: () => number;
}

/**
 * Checks a lead form's fields. The email field must hold a bare address
 * (#255): a display name, `<`, `>` or `"` is refused.
 */
export function validateLead(
  payload: unknown,
  now: number,
): { ok: false; error: string } | { ok: true; data: Lead } {
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
    const elapsed = now - body._t;
    if (elapsed < 3000) {
      return { ok: false, error: "Please wait a moment before submitting" };
    }
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return { ok: false, error: "Name is required" };
  }
  const email = bareAddress(body.email);
  if (!email) {
    return { ok: false, error: "Valid email is required" };
  }
  if (typeof body.techStack !== "string" || !body.techStack.trim()) {
    return { ok: false, error: "Tech stack description is required" };
  }
  return {
    ok: true,
    data: {
      name: body.name.trim(),
      email,
      techStack: body.techStack.trim(),
    },
  };
}

/**
 * Validates `payload` and, when it passes, mails it to the owner. A refused
 * lead answers 400 and mails nothing.
 */
export function acceptLead(
  payload: unknown,
  deps: AcceptLeadDeps,
): AcceptLeadOutcome {
  const result = validateLead(payload, deps.now?.() ?? Date.now());
  if (!result.ok) {
    return {
      status: 400,
      body: { error: result.error },
      mail: Promise.resolve(),
    };
  }
  const log = deps.log ?? console;
  const mail = notifyOwner(result.data, deps).then(() => {}, (err) => {
    log.error("[LEAD] failed:", err);
  });
  return { status: 200, body: { ok: true }, mail };
}
