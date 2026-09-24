import { define } from "../../lib/utils.ts";

// Legacy redirect target (see #177). New mail links straight to
// `/unsubscribe?token=...` (see lib/unsubscribe.ts's `unsubscribeLink`
// helper); an older link still points here. This 301 forwards only
// `?token=`, dropping every other query param — with no token to keep, an
// older link lands on routes/unsubscribe.tsx's "outdated link" page instead.
// This route no longer handles POST; a removal now only happens on
// routes/unsubscribe.tsx itself, with a verified token.
export const handler = define.handlers({
  GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    const location = token
      ? `/unsubscribe?token=${encodeURIComponent(token)}`
      : "/unsubscribe";
    return new Response(null, {
      status: 301,
      headers: { Location: location },
    });
  },
});
