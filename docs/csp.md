# Content-Security-Policy

`lib/csp.ts`'s `buildCsp()` builds the `Content-Security-Policy` header value;
`main.ts` wires it into its own middleware (not Fresh's `csp()` — see the file's
header for why: Fresh's nonce mode falls back to `'unsafe-inline'` when a
response carries no render nonce, which is exactly the hand-built-HTML case this
policy exists to close). No nonce means no inline script runs, full stop.

Fresh writes each render's nonce onto the `Response` at
`Symbol.for("__freshNonce")` and stamps the same value onto every JSX
`<script>`/`<style>` vnode it renders — `main.ts`'s middleware reads it back
after `ctx.next()` and hands it to `buildCsp()`. A middleware that rebuilds a
response with `new Response(...)` drops the symbol, and that page then runs no
inline script at all (Fresh's boot script included), so change headers on the
response `ctx.next()` returned instead of rebuilding it.

**To allow a new origin** (a new analytics host, a new embed), edit
`lib/csp.ts`'s `buildCsp()` directly — it's a pure function (no `Deno.env`
reads), unit-tested in `lib/csp.test.ts`. `main.ts` only computes the origins
`UMAMI_PRECONNECT_ORIGIN` (`lib/config.ts` — empty unless Umami is genuinely
cross-origin) and `SCHEDULE_URL`'s origin, and passes them in.

**The nonce pin**: `test/unsubscribe.test.ts` fetches `/`, reads the
`'nonce-...'` token off the `Content-Security-Policy` header, and asserts it
equals every rendered `<script nonce="...">`'s value — a plain HTML check, no
browser needed, since Fresh already stamped both from the same render.
`test/csp.browser.test.ts` (see "Browser-driven tests" in
[testing.md](testing.md)) is the complementary real-browser check: that the
policy is actually _enforced_, not just present and internally consistent.
