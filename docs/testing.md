# Testing and CI

## Continuous integration

`.woodpecker.yml` runs on every `push` and `pull_request`: it starts a
`denoland/deno:2.9.0` container, runs `deno install`, then `deno task check`
(fmt, lint, type check and `deno test` — a failing test fails the build). There
is no deploy step in CI — deploying stays a manual, post-merge action (see
"Deploy" in [AGENTS.md](../AGENTS.md)).

The `check` step also installs Chromium before `deno task check` runs:
`deno run -A npm:playwright@1.63.0 install --with-deps chromium` — the base
image has none of the OS libraries a headless Chromium needs. That's for the
five browser-driven tests under "Browser-driven tests" below. The version must
match `deno.json`'s `"playwright"` pin exactly, or the install downloads a
different Chromium build than the one the tests launch.

A separate `weekly-numbers` step runs only on the Sunday `cron` event and only
runs `deno task weekly-numbers`, never `deno task check`; the `check` step's
`when: event: [push, pull_request]` keeps it from running on that same cron
trigger. See `docs/weekly-numbers.md` for the env vars it needs and the one-time
Woodpecker cron setup.

## Rendered-page tests

Some fixes only exist in rendered HTML, not source, so a test must fetch a built
page and look. `test/harness.ts` exports `startSite()`: boots the production
server on a free port and returns `{ get, html, stop }` — `get` uses
`redirect: "manual"` so a 301 is visible as one, `html` throws unless status
200, `stop` is safe to call twice. `test/html.ts` provides `visibleText()`,
`jsonLd()` and `count()` for asserting on structure and short phrases, never
prose — the copy changes often, and a test that pins a paragraph breaks for the
wrong reason. `test/structure.test.ts` guards site structure (catalog, nav,
redirects, prices, labels). `test/label-in-name.test.ts` (#236) fails when an
`aria-label`led button or link's visible text is not part of its name, on every
sitemap page plus `/pay`, and pins that each `/pay` copy button names its field.
`test/a11y.test.ts` (#160) guards nav `aria-current` and icon-only accessible
names, from server-rendered HTML only — it doesn't cover the two lightboxes'
buttons, which only exist after client JS opens them (see "Browser-driven
tests"). `components/Nav.tsx` sets no `aria-current` on a destination link:
Fresh's renderer marks it from the request URL, and `test/a11y.test.ts` pins
that. Three exceptions set it by hand. Links to `/` (the rail's portrait and the
phone header) use `lib/nav.ts`'s `navCurrent()`, because Fresh marks every link
to `/` as the current section on every page; `test/a11y.test.ts` checks them.
The links inside `islands/NavMore.tsx` use `navCurrent()` too, because hydration
strips Fresh's marker from an island (Preact drops attributes the island's own
vnode lacks). Book carries a fixed `aria-current="false"`: it is an action,
never the current page, and its "Write" fallback (`/book#brief`) would otherwise
be marked by Fresh. `lib/markdown.test.ts` (#160) tests `lib/markdown.ts`
directly, no server needed. `test/bot-filter.test.ts` (#179) boots the site with
placeholder `UMAMI_URL`/`UMAMI_ID` and checks that known crawlers get no Umami
script or preconnect links while browsers do. `routes/_app.tsx` makes that
decision at render time with `lib/bots.ts`'s `isBot()`; nothing rewrites HTML
after it is rendered.

`deno task test` is `deno task build && deno test ...` — the site builds once
per `deno task check` run, before any test starts. `startSite()` never builds
itself; it throws a clear error naming the missing file and task if
`_fresh/server.js` doesn't exist, so running `deno test` directly without a
prior build fails loudly instead of skipping silently. `deno task test`'s
permissions are narrow (`--allow-net=127.0.0.1,0.0.0.0`, `--allow-run=deno`) and
apply to every file it runs — none can make an outbound call, so a test that
looks network-shaped stubs `globalThis.fetch` itself. The browser-driven tests
below need `-A`, so they're excluded via `--ignore` and run separately, also via
`deno task test:browser`, which doesn't build either — it relies on running
after `deno task test` inside `check`, and fails loudly (not silently) on its
own before a build.

**How to add a guard.** Call `startSite()`, fetch with `site.html()`/
`site.get()`, assert with `count()`/`visibleText()`/`jsonLd()`, then
`await site.stop()` in a `finally`. Consume or cancel every response body
(`res.body?.cancel()`) so tests keep passing Deno's resource sanitizers.

## Browser-driven tests

Some behaviour only exists after client JS runs — hydration, focus, a
`<dialog>`. `test/browser.ts`'s `launchChromium()` launches Chromium for every
file below and fails loudly, naming the install command, if none is found.
Playwright's version must match exactly across `deno.json`'s import map,
`.woodpecker.yml`'s install command and `test/browser.ts`'s `PLAYWRIGHT_VERSION`
— a mismatch downloads a different Chromium build than the one launched. Every
one calls `startSite()` and run under `deno task test:browser` with `-A`, not
the narrow `deno task test`.

Two rules keep them stable on a busy machine (#219). Open a page with
`test/browser.ts`'s `newPage(browser, options)`, never `browser.newPage()`: it
blocks service workers. The site's old worker used to reload the first page,
which landed mid-test and failed the next `page.evaluate` with "Execution
context was destroyed"; the site registers none any more (#285), and blocking
keeps any future one out of tests that are not about it. Only
`test/sw-retired.browser.test.ts`, which is about the worker, opens a context
without it. And when a click or a submit navigates, wait for that navigation
itself (`Promise.all([page.waitForNavigation(), click])` or `page.waitForURL`)
instead of a bare `waitForLoadState` after it, which can resolve on the old
page. Never retry a test on this error.

- `test/lead-form.browser.test.ts` (#157): submits the lead form (stubbing
  `/api/lead`), asserts focus lands on the success heading without scrolling the
  page, and that the form/success panels swap `inert`. The success heading needs
  `focus({ preventScroll: true })`; the test only reproduces the scroll jump
  with the submit button pinned to the bottom of the viewport. Since #272 it
  also checks that a brief sent from `/book?service=<slug>` posts the slug and
  its success panel points up to `#book` instead of a second calendar, and that
  the home page mounts the calendar only after a submit.
- `test/a11y.browser.test.ts` (#165): the project and blog lightboxes' dialog
  naming, button names and focus-return to the trigger; the nav (#185): the
  phone More dialog's Escape handling (closes it, returns focus to More, and
  does nothing when already closed), the desktop rail's top-to-bottom Tab order
  with no rotated ancestor, horizontal labels and an icon on every stop, the
  absence of any Links control in the rail and the More dialog, and the 390px
  tab bar (five tabs, Book centred, the current page and section styled after
  hydration, More outlined on a page listed under it, its dialog marking that
  page, and a tap on the backdrop closing it). The explicit
  `triggerRef.current?.focus()` calls in both lightboxes are kept on purpose,
  even though native `<dialog>` already restores focus. Since #246 it also
  checks the project gallery's "n / N" counter and its named Previous/Next
  buttons, and runs every axe-core WCAG 2 A/AA rule plus a horizontal-scroll
  check on six sample project pages, and on `/tools` and every tool page, at 390
  and 1440px.
- `test/contrast.browser.test.ts` (#160): axe-core's `color-contrast` rule
  (version pinned exactly in `deno.json`, like `playwright`) against six
  representative pages, served with a placeholder `SCHEDULE_URL` because the
  booking buttons only render when it is set (#175), plus synthetic probes for
  pairings axe can't reach on its own — an `aria-hidden` separator, a lone
  symbol character, a gradient background. Colour tokens live in
  `assets/styles.css`'s `@theme` block. See the test file's own header for which
  of the fix's colour changes each page or probe covers, and the two it doesn't.
- `test/csp.browser.test.ts` (#177): the Content-Security-Policy (see
  [csp.md](csp.md)) actually holds in a real browser — `securitypolicyviolation`
  events, not just the header's text — across every static page and one
  representative page per dynamic route, the `/book` booking calendar's runtime
  `<iframe>`, and a full unsubscribe link (GET the confirm page, POST the form).
  Two negative controls prove the listener and the policy do something: an
  inline `<script>` with no `nonce` is blocked and reported, and an iframe to a
  disallowed origin is reported. Served with placeholder
  `SCHEDULE_URL`/`UMAMI_URL`/`UMAMI_ID` (RFC 2606 hosts) so the policy has to
  cover both — a request failing (no such host) is fine, a CSP violation isn't.
  See the test file's own header for why it samples pages instead of crawling
  the whole sitemap.
- `test/sw-retired.browser.test.ts` (#285, #259): with service workers allowed,
  a first visit to `/book` loads once, requests no other page, never asks for
  `/sw.js`, registers no worker and keeps a value set on `window`; and `/sw.js`
  registered by hand deletes a cache the old worker left and unregisters itself.
  `test/sw-retired.test.ts` pins the script's text and that no server-rendered
  page mentions `serviceWorker`.
- `test/visual-system.browser.test.ts` (#184): no heading, nav item or button
  renders in a monospace font; the accent colour is painted as a background only
  by the primary button and the Book action (scans computed `background-color`
  on representative pages against a live-resolved `bg-accent` probe, so a token
  edit can't desync the check from `assets/styles.css`); Literata and IBM Plex
  Sans show up in `document.fonts` and every font request is same-origin, with
  no CSP violation. Since #365 it also scans every sitemap page plus `/pay`, a
  not-found URL, `/unsubscribe` and `/subscribe/confirm` at 1440px for the
  accent (and its hover shade) as text, border, outline, underline, ring or SVG
  fill or stroke outside `[data-primary-book]`, checks sample links, form fields
  and a secondary button while hovered and focused, and fails on a source class
  in `routes/`, `components/` or `islands/` that uses an accent token for
  anything but a background. Since preact-components#571 it also checks that the
  project gallery's Previous/Next (`navigationVariant="ghost"`) are transparent
  inside a Rule strong border and fill on hover, and that their row stays 40px
  tall with and without them. `test/no-emoji.test.ts` (not browser-driven — a
  plain `startSite()` + `visibleText()` check, like `test/rendered.test.ts`)
  walks every page in `/sitemap.xml` plus `/pay` for `\p{Extended_Pictographic}`
  characters, excluding `©`/`®`/`™` and plain digits.
- `test/notes.browser.test.ts` (#186): the margin note next to a project page's
  outcome line (`/work/foodrazor`) sits beside its claim with no horizontal
  scroll at 1100, 1280 and 1440px (the page's `scrollWidth` stays within the
  viewport and the `.note-aside` element's right edge stays inside it) and below
  it at 390px; the home page's Upwork note sits stacked under its figures in the
  fact card at every width (#269) — the CSS breakpoint in `assets/styles.css`'s
  `.note-wrap`/`.note-aside` rules, not checkable from server-rendered HTML
  alone since it depends on computed layout.
- `test/meet-embed.browser.test.ts` (mig#44): `islands/MeetEmbed.tsx`'s
  `message` listener actually resizes the booking iframe to the height a
  `mig:height` message reports, and keeps applying later messages, not just the
  first one — against a tiny stub `/embed` server this test starts itself
  (`SCHEDULE_URL` pointed at it), not a real mig instance. A second case proves
  the "same origin, wrong window" guard: a same-origin sibling iframe posting a
  spoofed `mig:height` message never resizes the booking iframe, because
  `event.source` isn't that iframe's own `contentWindow`. Since #272 it also
  proves the placeholder: the frame shows on the first valid message (the
  listener exists before the island inserts the frame), a frame allowed by
  `frame-ancestors` shows despite `X-Frame-Options: DENY` (what mig's `/embed`
  sends today), a refused frame ends in the failure message after
  `EMBED_TIMEOUT_MS`, a height that arrives after that still shows the calendar,
  and without JavaScript the box shows the new-tab link.
- `test/blog-overflow.browser.test.ts` (#222, #274): at 390px, no blog post in
  the sitemap is wider than the screen, and no "Read next" row
  (`[data-read-next] li` in `routes/blog/[slug].tsx`) ends past its right edge;
  the old Previous/Next cards were clipped by an ancestor, so only each row's
  own box shows such an overflow. It also runs every axe-core WCAG 2 A/AA rule
  plus a horizontal-scroll check on `/blog` and three sample posts at 390 and
  1440px, and checks that the post image lightbox, on a phone turned sideways,
  keeps its close button clear of a 47px safe-area inset, closes on a tap beside
  the image and returns focus to the image button. It blocks service workers,
  like every test that opens pages through `newPage()`.
- `test/safe-area.browser.test.ts`: at 390px the phone tab bar clears an
  iPhone's home indicator. iOS Safari reports a zero
  `env(safe-area-inset-bottom)` unless `routes/_app.tsx`'s viewport meta tag
  carries `viewport-fit=cover`, but Chromium applies an emulated inset either
  way, so the test checks the tag's content and, separately, that the tab bar's
  padding follows a 34px inset set through CDP's
  `Emulation.setSafeAreaInsetsOverride`.
- `test/frame.browser.test.ts` (#293): the skip link is hidden until focused and
  then visible; `/`, a project page, `/privacy` and a not-found blog URL have no
  axe violations and no sideways scroll at 390 and 1440px, each with one footer;
  and at 390px the footer's last line clears the tab bar.
- `test/card-links.browser.test.ts` (#336): a click on an empty corner of a
  `/work` archive row, a `/tools` card or a `/catalog` card opens its page (the
  card's one link is stretched over it with `after:absolute after:inset-0`, as
  on the highlight cards), and a link inside a catalog card keeps its own
  target.
- `test/analytics.browser.test.ts` (#318): `post-read` counts once, only when
  the end of a post has been on screen and 15 s have passed (Playwright's fake
  clock), and the not-found page counts `not-found`. It, `lead-form` (brief
  events) and `meet-embed` (calendar and booking events) replace Umami with
  `test/browser.ts`'s `recordUmami()` and read the calls with `trackedCalls()`.
