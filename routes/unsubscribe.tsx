import { page } from "fresh";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import {
  type FlowDeps,
  previewUnsubscribe,
  unsubscribe,
} from "@spy4x/server/subscribers";
import { flowDeps } from "../lib/mailing-list.ts";
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

/** The package's flow dependencies, or `undefined` when `UNSUBSCRIBE_SECRET`
 * is missing or unusable: that answers "not recognised" the same as a bad
 * token, so a misconfiguration does not leak as a different response. No mail
 * goes out from this page. */
function deps(): FlowDeps | undefined {
  try {
    return flowDeps(() => Promise.resolve());
  } catch (err) {
    console.error(
      "[UNSUBSCRIBE]",
      err instanceof Error ? err.message : String(err),
    );
    return undefined;
  }
}

/** The page for a state, with its status and no caching. */
function answer(data: PageData) {
  const status = data.state === "error"
    ? 500
    : data.state === "confirm" || data.state === "done"
    ? 200
    : 400;
  return page<PageData>(data, { status, headers: NO_STORE });
}

// GET shows the confirm/not-recognised/outdated states; POST is the only
// thing that ever removes an address (see #177). A link with no `token` at
// all gets its own "outdated" wording — see routes/api/unsubscribe.ts, the
// redirect target it still hits. Both read and change the list through
// `@spy4x/server/subscribers` (#405): a version 1 link (the only kind mailed
// before #405) is matched by scanning the list, a version 2 link by its key.
// No package rate limit is passed: a mail provider's one-click POSTs share a
// few IP addresses, and a limit there would refuse real unsubscribes.
export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    if (token === null) return answer({ state: "outdated" });
    const flow = deps();
    if (!flow) return answer({ state: "not-recognised" });
    const found = await previewUnsubscribe(token, flow);
    if (found.state === "confirm") {
      return answer({ state: "confirm", email: found.email, token });
    }
    return answer({
      state: found.state === "not-recognised" ? "not-recognised" : "error",
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
    if (!token) return answer({ state: "not-recognised" });
    const flow = deps();
    if (!flow) return answer({ state: "not-recognised" });
    // The package checks the token against a plain read and removes the
    // address and records the unsubscribe in one locked change, so a
    // confirmation link issued earlier cannot bring the address back.
    const outcome = await unsubscribe(token, flow);
    return answer({
      state: outcome.state === "done" || outcome.state === "not-recognised"
        ? outcome.state
        : "error",
    });
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
