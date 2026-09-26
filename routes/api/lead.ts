import { define } from "../../lib/utils.ts";
import {
  createSubmissionLimiter,
  limitSubmission,
} from "../../lib/rate-limit.ts";
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
import { acceptLead } from "../../lib/lead.ts";
import { LEAD_MAX_BYTES, readJsonBody } from "../../lib/request-body.ts";

// Three submissions per client per hour; see lib/rate-limit.ts for how the
// client is identified.
const LIMITER = createSubmissionLimiter();

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
    const limited = limitSubmission(LIMITER, ctx.req, ctx.info);
    if (limited) return limited;

    const read = await readJsonBody(
      ctx.req,
      LEAD_MAX_BYTES,
      "Invalid JSON body",
    );
    if (!read.ok) {
      return Response.json({ error: read.error }, { status: read.status });
    }
    const payload = read.value;

    // The mail goes out after the answer; acceptLead logs its failure.
    const outcome = acceptLead(payload, {
      sender: SENDER,
      contactEmail: CONTACT_EMAIL,
      relay: SMTP_HOST + ":" + SMTP_PORT,
    });
    return Response.json(outcome.body, { status: outcome.status });
  },
});
