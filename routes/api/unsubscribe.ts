import { define } from "../../lib/utils.ts";

// Legacy redirect target only (#177). Every mail sent before this fix links
// here with `?email=...`; new mail links straight to
// `/unsubscribe?token=...` (see lib/unsubscribe.ts's `unsubscribeLink`
// helper). This 301 keeps only `?token=`, so an old `?email=` link never
// carries an address into the new URL — with no token to keep, it lands on
// routes/unsubscribe.tsx's "outdated link" page instead. The old POST
// (which removed an address on a bare email match, no proof of ownership)
// is gone; POSTing a removal now only happens on routes/unsubscribe.tsx
// itself, with a verified token.
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
