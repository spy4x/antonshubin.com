import { parseBareAddress } from "@spy4x/email/address";
import { requestSubscription } from "@spy4x/server/subscribers";
import { define } from "../../lib/utils.ts";
import {
  createSubmissionLimiter,
  limitSubmission,
} from "../../lib/rate-limit.ts";
import { BASE_URL, CONTACT_EMAIL } from "../../lib/config.ts";
import { flowDeps } from "../../lib/mailing-list.ts";
import { SITE_SENDER } from "../../lib/site-sender.ts";
import { subscriberMailer } from "../../lib/subscribe-mail.ts";
import { readJsonBody, SMALL_FORM_MAX_BYTES } from "../../lib/request-body.ts";

// Three submissions per client per hour; see lib/rate-limit.ts for how the
// client is identified.
const LIMITER = createSubmissionLimiter();

const SEND_MAIL = subscriberMailer({
  sender: SITE_SENDER,
  contactEmail: CONTACT_EMAIL,
  baseUrl: BASE_URL,
});

/** The JSON body for each status the package's flow answers with. */
const BODIES: Record<number, Record<string, unknown>> = {
  200: { ok: true },
  400: { error: "Valid email is required" },
  500: { error: "Server misconfigured" },
};

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
    // the list on /subscribe/confirm (#253). The flow logs failures, with the
    // address redacted. A missing or unusable UNSUBSCRIBE_SECRET answers 500,
    // so a misconfigured site never says "check your inbox".
    let deps;
    try {
      deps = flowDeps(SEND_MAIL);
    } catch (error) {
      // A bad address still answers 400 first, as it did before #405.
      if (parseBareAddress(body?.email) === null) {
        return Response.json(BODIES[400], { status: 400 });
      }
      console.error(
        "[SUBSCRIBE] cannot build the confirm link:",
        error instanceof Error ? error.message : String(error),
      );
      return Response.json(BODIES[500], { status: 500 });
    }
    // The site's own limiter above counts requests; the package's is unused.
    const outcome = await requestSubscription(body?.email, deps);
    return Response.json(BODIES[outcome.status] ?? BODIES[500], {
      status: outcome.status,
    });
  },
});
