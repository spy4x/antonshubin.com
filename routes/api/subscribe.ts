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
import { updateSubscribers } from "../../lib/subscribers.ts";
import { unsubscribeLink } from "../../lib/unsubscribe.ts";
import { createSiteSender, smtpSettings } from "../../lib/mail.ts";
import { addSubscriber } from "../../lib/subscribe.ts";
import { readJsonBody, SMALL_FORM_MAX_BYTES } from "../../lib/request-body.ts";

const SMTP = smtpSettings({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USERNAME,
  pass: SMTP_PASSWORD,
  from: SMTP_FROM,
  ehloName: new URL(BASE_URL).hostname,
});
const SENDER = SMTP ? createSiteSender(SMTP) : null;

// Three submissions per client per hour; see lib/rate-limit.ts for how the
// client is identified.
const LIMITER = createSubmissionLimiter();

export const handler = define.handlers({
  async POST(ctx) {
    const limited = limitSubmission(LIMITER, ctx.req, ctx.info);
    if (limited) return limited;

    const read = await readJsonBody(ctx.req, SMALL_FORM_MAX_BYTES);
    if (!read.ok) {
      return Response.json({ error: read.error }, { status: read.status });
    }
    const body = read.value as { email?: unknown } | null;

    // Mails go out after the answer; addSubscriber logs their failures.
    const outcome = await addSubscriber(body?.email, {
      update: updateSubscribers,
      unsubscribeLink,
      mail: { sender: SENDER, contactEmail: CONTACT_EMAIL, baseUrl: BASE_URL },
    });
    return Response.json(outcome.body, { status: outcome.status });
  },
});
