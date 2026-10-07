import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import {
  confirmSubscription,
  type FlowDeps,
  previewConfirmation,
} from "@spy4x/server/subscribers";
import { flowDeps } from "../../lib/mailing-list.ts";
import { SITE_SENDER } from "../../lib/site-sender.ts";
import { subscriberMailer } from "../../lib/subscribe-mail.ts";
import { BASE_URL, CONTACT_EMAIL } from "../../lib/config.ts";
import { readFormBody, SMALL_FORM_MAX_BYTES } from "../../lib/request-body.ts";

// Never cached: the page shows one visitor's address, and its URL carries a
// working token.
const NO_STORE = { "Cache-Control": "no-store" };

type PageData =
  | { state: "confirm"; email: string; token: string }
  | { state: "done" }
  | { state: "expired" }
  | { state: "invalid" }
  | { state: "error" };

const SEND_MAIL = subscriberMailer({
  sender: SITE_SENDER,
  contactEmail: CONTACT_EMAIL,
  baseUrl: BASE_URL,
});

/** The package's flow dependencies, or `undefined` when `UNSUBSCRIBE_SECRET`
 * is missing or unusable: that answers "invalid" like a bad token, so a
 * misconfiguration does not leak as a different response (same rule as
 * `routes/unsubscribe.tsx`). */
function deps(): FlowDeps | undefined {
  try {
    return flowDeps(SEND_MAIL);
  } catch (err) {
    console.error(
      "[SUBSCRIBE-CONFIRM]",
      err instanceof Error ? err.message : String(err),
    );
    return undefined;
  }
}

// GET only shows the address and a button: a mail scanner or a link preview
// that opens the link subscribes nobody. POST is the only thing that adds an
// address (the same shape as /unsubscribe).
export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    // Where the confirming POST lands: a URL with no token in it.
    if (!token && ctx.url.searchParams.get("done") === "1") {
      return page<PageData>({ state: "done" }, { headers: NO_STORE });
    }
    if (!token) {
      return page<PageData>({ state: "invalid" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    const flow = deps();
    const checked = flow
      ? await previewConfirmation(token, flow)
      : { state: "invalid" as const };
    if (checked.state !== "confirm") {
      return page<PageData>({ state: checked.state }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    return page<PageData>(
      { state: "confirm", email: checked.email, token },
      { headers: NO_STORE },
    );
  },

  async POST(ctx) {
    let token = ctx.url.searchParams.get("token");
    if (!token) {
      const read = await readFormBody(ctx.req, SMALL_FORM_MAX_BYTES);
      if (!read.ok && read.status !== 400) {
        return page<PageData>({ state: "invalid" }, {
          status: read.status,
          headers: NO_STORE,
        });
      }
      token = (read.ok && read.value.get("token")?.toString()) || null;
    }
    if (!token) {
      return page<PageData>({ state: "invalid" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    const flow = deps();
    // The package adds the address and its key in one locked change, refuses
    // a link issued before the address last unsubscribed (#327), and mails
    // the welcome and the owner notice only for a new address.
    const outcome = flow
      ? await confirmSubscription(token, flow)
      : { state: "invalid" as const };
    switch (outcome.state) {
      case "confirmed":
        // 303 to a URL without the token, so the done page's address bar,
        // history and referrer never hold it.
        return new Response(null, {
          status: 303,
          headers: { ...NO_STORE, Location: "/subscribe/confirm?done=1" },
        });
      case "error":
        return page<PageData>({ state: "error" }, {
          status: 500,
          headers: NO_STORE,
        });
      default:
        return page<PageData>({ state: outcome.state }, {
          status: 400,
          headers: NO_STORE,
        });
    }
  },
});

function Body(data: PageData) {
  switch (data.state) {
    case "confirm":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-6">
            Subscribe {data.email} to the newsletter?
          </h1>
          <form method="post" action="/subscribe/confirm">
            <input type="hidden" name="token" value={data.token} />
            <button
              type="submit"
              class="bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors px-6 py-3"
            >
              Subscribe
            </button>
          </form>
        </>
      );
    case "done":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            You're subscribed
          </h1>
          <p class="text-graphite mb-6">
            A welcome mail is on its way.
          </p>
          <a
            href="/"
            class="text-accent hover:text-accent hover:underline font-medium"
          >
            ← Back to home
          </a>
        </>
      );
    case "expired":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            Link expired
          </h1>
          <p class="text-graphite">
            This confirmation link is older than three days. Subscribe again
            from the site to get a new one.
          </p>
        </>
      );
    case "invalid":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            Link not recognised
          </h1>
          <p class="text-graphite">
            This link is not valid. Subscribe again from the site to get a new
            one.
          </p>
        </>
      );
    case "error":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            Something went wrong
          </h1>
          <p class="text-graphite">Try again in a moment.</p>
        </>
      );
  }
}

export default define.page(function ConfirmSubscription(ctx) {
  const data = ctx.data as PageData;

  head.value = {
    ...head.value,
    title: "Confirm subscription — Anton Shubin",
    description: "Confirm your newsletter subscription.",
    canonical: "https://antonshubin.com/subscribe/confirm",
    ogType: "website",
    noindex: true,
  };

  return (
    <Layout currentPath="/subscribe/confirm">
      <SEOHead />
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        {Body(data)}
      </div>
    </Layout>
  );
});
