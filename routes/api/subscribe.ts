import { define } from "../../lib/utils.ts";
import {
  createSubmissionLimiter,
  limitSubmission,
} from "../../lib/rate-limit.ts";
import { BASE_URL, CONTACT_EMAIL } from "../../lib/config.ts";
import { confirmLink } from "../../lib/subscribe-token.ts";
import { SITE_SENDER } from "../../lib/site-sender.ts";
import { requestSubscription } from "../../lib/subscribe.ts";
import { readJsonBody, SMALL_FORM_MAX_BYTES } from "../../lib/request-body.ts";

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

    // Only a confirmation link is mailed, after the answer; the address joins
    // the list on /subscribe/confirm (#253). requestSubscription logs failures.
    const outcome = await requestSubscription(body?.email, {
      confirmLink: (email) => confirmLink(email),
      mail: {
        sender: SITE_SENDER,
        contactEmail: CONTACT_EMAIL,
        baseUrl: BASE_URL,
      },
    });
    return Response.json(outcome.body, { status: outcome.status });
  },
});
