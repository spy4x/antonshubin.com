import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { updateSubscribers } from "../../lib/subscribers.ts";
import { unsubscribeLink } from "../../lib/unsubscribe.ts";
import { verifyConfirmToken } from "../../lib/subscribe-token.ts";
import { confirmSubscription } from "../../lib/subscribe.ts";
import { SITE_SENDER } from "../../lib/site-sender.ts";
import {
  BASE_URL,
  CONTACT_EMAIL,
  getUnsubscribeSecret,
} from "../../lib/config.ts";
import { readFormBody, SMALL_FORM_MAX_BYTES } from "../../lib/request-body.ts";

// Never cached: the page shows one visitor's address, and its URL carries a
// working token.
const NO_STORE = { "Cache-Control": "no-store" };

type PageData =
  | { state: "confirm"; email: string; token: string }
  | { state: "done"; email: string }
  | { state: "expired" }
  | { state: "invalid" }
  | { state: "error" };

/** `UNSUBSCRIBE_SECRET`, or `undefined` when it is missing or unusable: that
 * answers "invalid" like a bad token, so a misconfiguration does not leak as
 * a different response (same rule as `routes/unsubscribe.tsx`). */
function secret(): string | undefined {
  try {
    return getUnsubscribeSecret();
  } catch (err) {
    console.error("[SUBSCRIBE-CONFIRM]", err);
    return undefined;
  }
}

async function check(token: string) {
  const key = secret();
  if (!key) return { ok: false, reason: "invalid" } as const;
  return await verifyConfirmToken(token, key);
}

// GET only shows the address and a button: a mail scanner or a link preview
// that opens the link subscribes nobody. POST is the only thing that adds an
// address (the same shape as /unsubscribe).
export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    if (!token) {
      return page<PageData>({ state: "invalid" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    const checked = await check(token);
    if (!checked.ok) {
      return page<PageData>({ state: checked.reason }, {
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
    const outcome = await confirmSubscription(token, {
      update: updateSubscribers,
      verify: check,
      unsubscribeLink,
      mail: {
        sender: SITE_SENDER,
        contactEmail: CONTACT_EMAIL,
        baseUrl: BASE_URL,
      },
    });
    switch (outcome.state) {
      case "confirmed":
        return page<PageData>(
          { state: "done", email: outcome.email },
          { headers: NO_STORE },
        );
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
          <form method="post">
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
            A welcome mail is on its way to {data.email}.
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
