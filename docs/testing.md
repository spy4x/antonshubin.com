# Testing and CI

## Continuous integration

`.woodpecker/woodpecker.yml` runs on every pull request not marked `[WIP]` what
`deno task check` runs, split into steps that run side by side; a failing test
fails the build. A push to main and the nightly run use it too (below). There is
no deploy step in CI — deploying stays a manual, post-merge action (see "Deploy"
in [AGENTS.md](../AGENTS.md)).

A pull request whose title starts with `[WIP]` runs `.woodpecker/wip.yml`
instead: one step with install, fmt, lint, type check, build and the unit tests,
no browser, video-cut or Lighthouse step. It reports `ci/woodpecker/pr/wip`,
which branch protection does not require, so a `[WIP]` commit cannot merge.
Removing `[WIP]` from the title starts the full workflow without a push. The top
of each file explains the conditions; `scripts/ci-workflows.test.ts` checks
them.

- `build` (`denoland/deno:2.9.0`): `deno install --frozen` and
  `deno task build`, with `DENO_DIR` in `.ci/deno-dir`, and a copy of the deno
  binary in `.ci/bin/`. The workspace carries both, `node_modules` and `_fresh/`
  to every later step, so nothing after it installs or builds again.
- `unit` (same image): fmt, lint, type check and `deno task test:unit`, minus
  `scripts/video-cut.test.ts`.
- `browser-1` to `browser-4` (`mcr.microsoft.com/playwright:v1.63.0-noble`):
  `scripts/browser-shard.ts` splits every `test/**/*.browser.test.ts` into four
  shards of about equal CI time, by the seconds in its `SECONDS` table, and
  `scripts/browser-shard.test.ts` fails unless the shards cover every file
  exactly once. The image holds the Chromium build that Playwright version
  launches, with its libraries and fonts, so no step downloads a browser. Its
  tag must match `deno.json`'s `"playwright"` pin exactly.
- `video-cut` (`jrottenberg/ffmpeg:7.1-ubuntu2404`): the one test that needs
  ffmpeg, ffprobe, libass and a font.
- `lighthouse` (the Playwright image): the Lighthouse budget on the shared
  build, alone after the browser shards, since a busy CPU lowers the performance
  score; split into shards side by side, pages fell below 95. It installs nginx,
  the one package the pipeline installs.

When a browser test gets much slower or faster, update its line in
`scripts/browser-shard.ts`'s `SECONDS` so the shards stay even.

A push to main runs `build` and `unit` only: the merged commit's pull request
already ran the rest, and a run after the merge cannot stop it (#720). The
browser shards, `video-cut` and `lighthouse` run on pull requests and in the
nightly run instead.

The nightly run is a Woodpecker cron named `nightly` on branch `main`, schedule
`0 2 * * *` (02:00 UTC), created once in the repository's settings, **Crons**,
as in Seed. It runs every step above; when one fails, `notify-nightly` pushes
the pipeline's link to NTFY with the `ntfy_url` and `ntfy_topic` secrets, which
must be allowed on the `cron` event. A red nightly run blocks nothing.

A separate `weekly-numbers` step runs only on the Sunday `weekly-numbers` cron
and only runs `deno task weekly-numbers`; every other step names the `nightly`
cron, so none runs on that trigger. See `docs/weekly-numbers.md` for the env
vars it needs and the one-time Woodpecker cron setup.

## Rendered-page tests

Some fixes only exist in rendered HTML, not source, so a test must fetch a built
page and look. `test/harness.ts` exports `startSite()`: boots the production
server on a free port and returns `{ get, html, stop }` — `get` uses
`redirect: "manual"` so a 301 is visible as one, `html` throws unless status
200, `stop` is safe to call twice. `test/html.ts` provides `visibleText()`,
`jsonLd()` and `count()` for asserting on structure and short phrases, never
prose — the copy changes often, and a test that pins a paragraph breaks for the
wrong reason. `test/structure.test.ts` guards site structure (catalog, nav,
redirects, prices, labels). `test/head-lengths.test.ts` (#494, #669) fails when
any sitemap page's `<title>`, a blog post's too, is over 60 characters before "
— Anton Shubin" or its meta description over 155. `test/label-in-name.test.ts`
(#236) fails when an `aria-label`led button or link's visible text is not part
of its name, on every sitemap page plus `/pay`, and pins that each `/pay` copy
button names its field. `test/a11y.test.ts` (#160) guards nav `aria-current` and
icon-only accessible names, from server-rendered HTML only — it doesn't cover
the two lightboxes' buttons, which only exist after client JS opens them (see
"Browser-driven tests"). The library `Rail` sets `aria-current` on its entries
from the path `components/Nav.tsx` hands it: "page" on the page, "true" on its
section, so a nested route passes its own path. Contact is the page on `/book`
only, also when it links `/book#brief`, which is matched by its `contact` key.
An entry that is not current carries `aria-current="false"`, so Fresh's renderer
leaves the rail's links to `/` (the portrait and the More sheet's Home row)
alone; Fresh would otherwise mark every link to `/` as the current section on
every page. The phone header's two links are never current and carry a fixed
`aria-current="false"` for the same reason, as do the footer's links and the
page's links to `/` or to its own section (#692). `test/a11y.test.ts` checks all
three home links. `test/nav.test.ts` checks Contact on every page (the rail's
bottom slot, the More sheet and the phone header), one current mark per screen
size on every page, no current mark in the page or the footer, the tab bar's
order, the More sheet's links and the portrait's top slot. `test/html.ts` slices
the rail's parts (`railColumn`, `railTop`, `tabBar`, `moreSheet`) and the page
(`pageBody` stops at the footer, `mainContent` at the phone dock), because the
footer follows `<main>` in the same column and the dock follows both.
`lib/markdown.test.ts` (#160) tests `lib/markdown.ts` directly, no server
needed. `test/bot-filter.test.ts` (#179) boots the site with placeholder
`UMAMI_URL`/`UMAMI_ID` and checks that known crawlers get no Umami script or
preconnect links while browsers do. `routes/_app.tsx` makes that decision at
render time with `lib/bots.ts`'s `isBot()`; nothing rewrites HTML after it is
rendered.

`deno task test` is `deno task build && deno task test:unit` — the site builds
once per `deno task check` run, before any test starts. `startSite()` never
builds itself; it throws a clear error naming the missing file and task if
`_fresh/server.js` doesn't exist, so running `deno test` directly without a
prior build fails loudly instead of skipping silently. `deno task test`'s
permissions are narrow
(`--allow-net=127.0.0.1,0.0.0.0,raw.githubusercontent.com`, `--allow-run=deno`)
and apply to every file it runs. The one outbound host is for
`test/tools/ts-libs.test.ts`, which reads the ts-libs READMEs at a pinned tag to
prove the page still quotes them; any other test that looks network-shaped stubs
`globalThis.fetch` itself. The browser-driven tests below need `-A`, so
`test:unit` ignores every `*.browser.test.ts` and they run separately, via
`deno task test:browser` (`scripts/browser-shard.ts 1/1`: all of them in one
process), which doesn't build either — it relies on running after
`deno task test` inside `check`, and fails loudly (not silently) on its own
before a build.

**How to add a guard.** Call `startSite()`, fetch with `site.html()`/
`site.get()`, assert with `count()`/`visibleText()`/`jsonLd()`, then
`await site.stop()` in a `finally`. Consume or cancel every response body
(`res.body?.cancel()`) so tests keep passing Deno's resource sanitizers.

## Browser-driven tests

Some behaviour only exists after client JS runs — hydration, focus, a
`<dialog>`. `test/browser.ts`'s `launchChromium()` launches Chromium for every
file below and fails loudly, naming the install command, if none is found.
Playwright's version must match exactly across `deno.json`'s import map,
`.woodpecker/woodpecker.yml`'s Playwright image tag and `test/browser.ts`'s
`PLAYWRIGHT_VERSION` — on a mismatch the image holds a different Chromium build
than the one launched. Every one calls `startSite()` and run under
`deno task test:browser` with `-A`, not the narrow `deno task test`.

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
  phone More sheet's Escape handling (closes it, returns focus to More, and does
  nothing when already closed), the desktop rail's top-to-bottom Tab order with
  no rotated ancestor, horizontal labels and an icon on every stop, the absence
  of any Links control in the rail and the More sheet, More filled on Home,
  About and Infrastructure, and the 390px tab bar (Work, Services, Tools,
  Writing and More, no Book, the current page and section filled, More filled on
  a page listed under it, its sheet marking that page, and a backdrop tap
  closing the sheet and returning focus to More), and the site footer as the
  page's one `contentinfo` landmark, outside `<main>`, on /, /about and /blog.
  The explicit `triggerRef.current?.focus()` calls in both lightboxes are kept
  on purpose, even though native `<dialog>` already restores focus. Since #246
  it also checks the project gallery's "n / N" counter and its named
  Previous/Next buttons, and runs every axe-core WCAG 2 A/AA rule plus a
  horizontal-scroll check on six sample project pages, and on `/tools` and every
  tool page, at 390 and 1440px. At 390px those tool pages also get axe's
  `target-size` rule (#452), walked half a screen at a time with the sticky tab
  bar hidden, and every visible copy button must be at least 44px tall.
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
  fill or stroke outside `[data-primary-book]`, checks sample links, form
  fields, a secondary button, a rail entry, the rail's portrait and a More sheet
  row (opened directly, since More is phone-only) while hovered and focused, and
  fails on a source class in `routes/`, `components/` or `islands/` that uses an
  accent token for anything but a background. Since preact-components#571 it
  also checks that the project gallery's Previous/Next
  (`navigationVariant="ghost"`) are transparent inside a Rule strong border and
  fill on hover, and that their row stays 40px tall with and without them.
  `test/no-emoji.test.ts` (not browser-driven — a plain `startSite()` +
  `visibleText()` check, like `test/rendered.test.ts`) walks every page in
  `/sitemap.xml` plus `/pay` for `\p{Extended_Pictographic}` characters,
  excluding `©`/`®`/`™` and plain digits.
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
  1440px. At both widths, the tables of the Deno migration and Seed posts fit
  the column without sideways scroll, and no code name without a space or hyphen
  in a cell splits across lines (#609). On the Opus post, the short value "Sep
  20–21" stays on one line at both widths: `lib/markdown.ts` marks body cells of
  `SHORT_CELL` characters or fewer `nowrap`. At 390 and 1440px no post's code
  block (`.blog-content pre`) is wider than its box (#596: code wraps rather
  than scrolls), a long unbroken token written into a block at 390px breaks
  inside it, and on the Woodpecker post each wrapped code line continues 2ch
  past its own indent, never at column 0. It checks that the post image
  lightbox, on a phone turned sideways, keeps its close button clear of a 47px
  safe-area inset, closes on a tap beside the image and returns focus to the
  image button. It blocks service workers, like every test that opens pages
  through `newPage()`.
- `test/post-components.browser.test.ts` (#537): a post's interactive components
  render disabled with the post's own numbers, then hydrate and follow the
  keyboard (the runs calculator on the Trail-code post, the cached share slider
  on the Opus post, the checklist on the cost laboratory post); the first input
  sends one `post-try` with no entered value; and every component box passes
  axe-core's WCAG 2 A/AA rules (through `@axe-core/playwright`) with no
  horizontal scroll at 390 and 1440px.
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
- `test/book-contact.browser.test.ts` (#445): from 320 to 1440px, the `/book`
  contact card keeps the email address on one line inside its column, with no
  sideways scroll.
- Tool page layout (#675), measured as box edges:
  `test/tool-frame.browser.test.ts` (every tool page's top line is one line at
  1440px, 12px above the `<h1>`, clear of the hero media),
  `test/tools/zond.browser.test.ts` (at 390px no curl line breaks inside a word,
  and the diagram is the one-column version with labels at least 12px tall),
  `test/tools/caldav-tasks-web.browser.test.ts` (the task file follows the chips
  at 390px with the note after it; both "What was tested" tables put the status
  at one x), `test/tools/ts-libs.browser.test.ts` ("Run the example" wraps
  inside its box with the copied text unchanged; the package focus ring stays
  clear of the name) and `test/tools/dotfiles.browser.test.ts` (the Source
  column starts where its header does).
- `test/analytics.browser.test.ts` (#318): `post-read` counts once, only when
  the end of a post has been on screen and 15 s have passed (Playwright's fake
  clock), and the not-found page counts `not-found`. It, `lead-form` (brief
  events) and `meet-embed` (calendar and booking events) replace Umami with
  `test/browser.ts`'s `recordUmami()` and read the calls with `trackedCalls()`.
