import { page } from "fresh";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { loadSubscribers, updateSubscribers } from "../lib/subscribers.ts";
import { findSubscriberByToken } from "../lib/unsubscribe.ts";
import { getUnsubscribeSecret } from "../lib/config.ts";
import { readFormBody, SMALL_FORM_MAX_BYTES } from "../lib/request-body.ts";

// Never cached: the confirm state renders one visitor's address, and a
// stale POST response must never be replayed from a cache.
const NO_STORE = { "Cache-Control": "no-store" };

type PageData =
  | { state: "confirm"; email: string; token: string }
  | { state: "done" }
  | { state: "not-recognised" }
  | { state: "outdated" }
  | { state: "error" };

/** `UNSUBSCRIBE_SECRET`, or `undefined` when it is missing or unusable: that
 * answers "not recognised" the same as a bad token, so a misconfiguration
 * does not leak as a different response (see lib/unsubscribe.ts's
 * `findSubscriberByToken`). */
function unsubscribeSecret(): string | undefined {
  try {
    return getUnsubscribeSecret();
  } catch (err) {
    console.error("[UNSUBSCRIBE]", err);
    return undefined;
  }
}

// GET shows the confirm/not-recognised/outdated states; POST is the only
// thing that ever removes an address (see #177). A link with no `token` at
// all gets its own "outdated" wording — see routes/api/unsubscribe.ts, the
// redirect target it still hits.
export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    if (token === null) {
      return page<PageData>({ state: "outdated" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    const secret = unsubscribeSecret();
    let match;
    try {
      match = secret &&
        await findSubscriberByToken(await loadSubscribers(), token, secret);
    } catch (err) {
      console.error("[UNSUBSCRIBE] cannot read the list:", err);
      return page<PageData>({ state: "error" }, {
        status: 500,
        headers: NO_STORE,
      });
    }
    if (!match) {
      return page<PageData>({ state: "not-recognised" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    return page<PageData>({ state: "confirm", email: match.email, token }, {
      headers: NO_STORE,
    });
  },

  // RFC 8058-compatible: a mail client's one-click List-Unsubscribe-Post can
  // POST with the token still on the query string and an empty or
  // unrelated body, same as the on-page form (a hidden `token` field).
  async POST(ctx) {
    let token = ctx.url.searchParams.get("token");
    if (!token) {
      // Read under a byte cap (#251); a body that does not parse as a form
      // simply carries no token.
      const read = await readFormBody(ctx.req, SMALL_FORM_MAX_BYTES);
      if (!read.ok && read.status !== 400) {
        return page<PageData>({ state: "not-recognised" }, {
          status: read.status,
          headers: NO_STORE,
        });
      }
      token = (read.ok && read.value.get("token")?.toString()) || null;
    }
    if (!token) {
      return page<PageData>({ state: "not-recognised" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    const secret = unsubscribeSecret();
    let match;
    try {
      // The token is checked against a plain read, outside the lock, so a
      // flood of bad tokens never holds the lock (#254). Only the removal of
      // the matched address runs under it, as one change, so a subscribe
      // landing in between cannot write the address back.
      match = secret &&
        await findSubscriberByToken(await loadSubscribers(), token, secret);
      if (match) {
        const email = match.email;
        await updateSubscribers((list) => ({
          list: list.filter((s) => s.email !== email),
          result: null,
        }));
      }
    } catch (err) {
      console.error("[UNSUBSCRIBE] failed to save:", err);
      return page<PageData>({ state: "error" }, {
        status: 500,
        headers: NO_STORE,
      });
    }
    if (!match) {
      return page<PageData>({ state: "not-recognised" }, {
        status: 400,
        headers: NO_STORE,
      });
    }
    return page<PageData>({ state: "done" }, { headers: NO_STORE });
  },
});

function Body(data: PageData) {
  switch (data.state) {
    case "confirm":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-6">
            Unsubscribe {data.email} from the newsletter?
          </h1>
          <form method="post">
            <input type="hidden" name="token" value={data.token} />
            <button
              type="submit"
              class="bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors px-6 py-3"
            >
              Unsubscribe
            </button>
          </form>
        </>
      );
    case "done":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-6">
            You're unsubscribed
          </h1>
          <a
            href="/"
            class="text-accent hover:text-accent hover:underline font-medium"
          >
            ← Back to home
          </a>
        </>
      );
    case "not-recognised":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            Link not recognised
          </h1>
          <p class="text-graphite">
            This link is not valid, or it was already used. If you already
            unsubscribed, there's nothing more to do.
          </p>
        </>
      );
    case "outdated":
      return (
        <>
          <h1 class="text-2xl font-bold text-parchment mb-4">
            Link out of date
          </h1>
          <p class="text-graphite">
            This link is from an older email and no longer works. Use the link
            in a newer email, or reply to the email and ask.
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

export default define.page(function Unsubscribe(ctx) {
  const data = ctx.data as PageData;

  head.value = {
    ...head.value,
    title: "Unsubscribe — Anton Shubin",
    description: "Unsubscribe from the newsletter.",
    canonical: "https://antonshubin.com/unsubscribe",
    ogType: "website",
    noindex: true,
  };

  return (
    <Layout currentPath="/unsubscribe">
      <SEOHead />
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        {Body(data)}
      </div>
    </Layout>
  );
});
