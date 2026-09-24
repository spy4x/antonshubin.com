# AGENTS.md

The global agent instructions own Git Flow, branch naming, commit convention,
pull-request discipline and the merge protocol. This file only adds what is
specific to this repository.

## Project structure

```
├── assets/         # Global CSS
├── components/     # Preact components (Layout, SEOHead, Icons)
├── content/        # Blog posts (Markdown)
├── docs/           # Dev, deploy, infra docs
├── islands/        # Interactive client components
├── lib/            # Utils, config, data
├── routes/         # File-based page routes
├── static/         # Images, favicons
├── deno.json       # Config + tasks
├── Dockerfile      # Prod container
└── compose.yml     # Docker Compose + Traefik labels
```

## Tasks (from `deno.json`)

```bash
deno task check                 # fmt --check + lint + type check + test + test:browser
deno task test                  # build, then deno test (see Rendered-page tests below)
deno task test:browser          # Playwright lead-form + a11y + contrast tests; needs a built site and Chromium
deno task dev                   # dev server (Vite, HMR)
deno task build                 # production build (Vite)
deno task start                 # run the production server
deno task update                # update Fresh
deno task deploy                # production → antonshubin.com
deno task deploy:stag           # staging   → website-stag.antonshubin.com
deno task env:encrypt           # .env.prod → .env.prod.age
deno task env:decrypt           # .env.prod.age → .env.prod
deno task publish:blog          # publish a blog post + a Dev.to draft
deno task launch-kit            # draft a repo launch's Reddit/HN/LinkedIn/Dev.to/YouTube posts
deno task video-kit             # transcript → titles, description, chapters, blog draft
deno task weekly-numbers        # Umami/GitHub/YouTube numbers → markdown + NTFY
deno task optimize:screenshots  # compress portfolio screenshots
```

`deno task check` fails on a failing test, same as a lint or type error — a red
test blocks the merge exactly like a red lint.

## Environment setup for a new worktree

The age decrypt key is not part of this repo; `scripts/decrypt.ts` reads it from
`.age/key.txt` and expects it copied in from `~/sync/code/homelab/.age/` if
missing. Run `deno task env:decrypt` after placing the key to turn
`.env.prod.age` into `.env.prod`. Agents never copy an env file (`.env`,
`.env.prod`, or the key itself) between checkouts or worktrees — decrypt it
fresh in each one.

## Deploy

Order: review the pull request, merge it, then deploy from the default branch
(`deno task deploy`). Never deploy unreviewed or unmerged code.

The deploy script passes the local commit hash to the remote build as
`BUILD_ID`, which becomes the service worker's cache name (`routes/sw.js.ts`).
Nothing is written back to a tracked file, so a deploy leaves `git status` clean
— see `docs/deploy.md`.

The newsletter subscriber list (`data/subscribers.json`) lives on the host:
`compose.yml` bind-mounts the app directory's `data/`, and the deploy's
`rsync --delete` excludes `/data/`. Keep both, or a deploy empties the list.
Backup and restore are in `docs/deploy.md` "Subscriber data".

## Code style

Double quotes, no semicolons, 2-space indent, 100 columns — this is what
`deno fmt` enforces, so run it instead of hand-formatting.

## Catalog and prices

`lib/catalog.ts` is the only place a catalog title or price is written. The home
page, `/catalog`, `/catalog/[slug]`, the sitemap, both llms files, the guide
page and the `Offer` JSON-LD read from it. `lib/catalog.test.ts` pins the four
prices and the six redirects; `test/structure.test.ts` fails when a dollar
amount that is not in the catalog shows up on a page listed in its `PRICE_PAGES`
or in an llms file — add a page to that list when it starts showing a price.
Retired slugs live in `catalogRedirects` there and answer 301 — never link to
one. The same price list is used on Upwork and neatsoft.dev, so a price change
is followed by a manual edit in both places.

The label the site leads with is `ROLE` in `lib/head.ts` ("Senior Full-Stack
Engineer & Tech Lead"). "Fractional CTO" appears only as the Ongoing catalog
item. The five promises on `/how-i-work` are the only promises on the site; the
free written audit carries no deadline.

## Content rule

No client name, number, prize, testimonial or guarantee goes on the site unless
the owner supplied it as fact in that session. If a claim needs a source you
don't have, leave the existing wording alone and ask him for the real facts
instead of inventing or estimating one.

## Continuous integration

`.woodpecker.yml` runs on every `push` and `pull_request`: it starts a
`denoland/deno:2.9.0` container, runs `deno install`, then `deno task check`
(fmt, lint, type check and `deno test` — a failing test fails the build). There
is no deploy step in CI — deploying stays a manual, post-merge action (see
Deploy above).

The `check` step also installs Chromium before `deno task check` runs:
`deno run -A npm:playwright@1.63.0 install --with-deps chromium` — the base
image has none of the OS libraries a headless Chromium needs. That's for the
three browser-driven tests under "Browser-driven tests" below. The version must
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
redirects, prices, labels). `test/a11y.test.ts` (#160) guards nav `aria-current`
and icon-only accessible names, from server-rendered HTML only — it doesn't
cover the two lightboxes' buttons, which only exist after client JS opens them
(see "Browser-driven tests"). `islands/Menu.tsx` sets no `aria-current` itself;
Fresh's renderer adds it, and `test/a11y.test.ts` pins that — don't add it by
hand. `lib/markdown.test.ts` (#160) tests `lib/markdown.ts` directly, no server
needed. `test/bot-filter.test.ts` (#179) boots the site with placeholder
`UMAMI_URL`/`UMAMI_ID` and checks that known crawlers get no Umami script or
preconnect links while browsers do. `routes/_app.tsx` makes that decision at
render time with `lib/bots.ts`'s `isBot()`; nothing rewrites HTML after it is
rendered.

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
`<dialog>`. `test/browser.ts`'s `launchChromium()` launches Chromium for all
three files below and fails loudly, naming the install command, if none is
found. Playwright's version must match exactly across `deno.json`'s import map,
`.woodpecker.yml`'s install command and `test/browser.ts`'s `PLAYWRIGHT_VERSION`
— a mismatch downloads a different Chromium build than the one launched. All
three call `startSite()` and run under `deno task test:browser` with `-A`, not
the narrow `deno task test`.

- `test/lead-form.browser.test.ts` (#157): submits the lead form (stubbing
  `/api/lead`), asserts focus lands on the success heading without scrolling the
  page, and that the form/success panels swap `inert`. The success heading needs
  `focus({ preventScroll: true })`; the test only reproduces the scroll jump
  with the submit button pinned to the bottom of the viewport.
- `test/a11y.browser.test.ts` (#165): the project and blog lightboxes' dialog
  naming, button names and focus-return to the trigger, and the mobile menu's
  Escape handling (closes it, returns focus, and does nothing when already
  closed). The explicit `triggerRef.current?.focus()` calls in both lightboxes
  are kept on purpose, even though native `<dialog>` already restores focus.
- `test/contrast.browser.test.ts` (#160): axe-core's `color-contrast` rule
  (version pinned exactly in `deno.json`, like `playwright`) against six
  representative pages, served with a placeholder `SCHEDULE_URL` because the
  booking buttons only render when it is set (#175), plus synthetic probes for
  pairings axe can't reach on its own — an `aria-hidden` separator, a lone
  symbol character, a gradient background. Colour tokens live in
  `assets/styles.css`'s `@theme` block. See the test file's own header for which
  of the fix's colour changes each page or probe covers, and the two it doesn't.

## AI crawler optimization (SEO)

This site uses an aggressive AI crawler strategy. When adding features or
content, update the corresponding files:

| Asset           | File                                 | Update when                                     |
| --------------- | ------------------------------------ | ----------------------------------------------- |
| AI summary      | `routes/llms.txt.ts`                 | Site positioning, offerings, or policies change |
| AI full index   | `routes/llms-full.txt.ts`            | New pages, catalog items, or blog posts added   |
| Site structure  | `routes/sitemap.xml.ts`              | New routes or pages added                       |
| Crawler rules   | `routes/robots.txt.ts`               | Adding/removing crawler permissions             |
| Structured data | `routes/_app.tsx` (JSON-LD)          | Identity, skills, or company info changes       |
| FAQ data        | `routes/how-i-work.tsx` (FAQ schema) | Policies or terms change                        |
| Docs reference  | `docs/seo-ai-crawlers.md`            | Any of the above changes                        |

Every PR that adds or modifies routes, content, or positioning must also update
the matching crawler file(s). The `llms*.txt` files are parsed by GPTBot,
Claude, Perplexity, and other AI crawlers — a primary traffic source.

## Cache-Control headers

Cache policy lives in `main.ts` as middleware, except `/sw.js`, which sets its
own header in `routes/sw.js.ts`. When adding or changing routes, update the
`CORE_PAGES` set if the new page should be cached at the edge:

```ts
const CORE_PAGES = new Set([
  "/",
  "/how-i-work",
  "/infrastructure",
  "/contact-me",
  "/blog",
  "/projects",
  "/catalog",
  "/pay",
  "/saas-architecture-guide",
  "/hackathons",
]);
```

Cache tiers:

| Tier       | Duration                        | Targets                  | Use case                                                      |
| ---------- | ------------------------------- | ------------------------ | ------------------------------------------------------------- |
| Immutable  | 1 year (`max-age=31536000`)     | `/assets/*`, `/_fresh/*` | Content-hashed files (fingerprint = immutable)                |
| Images     | 7 days + stale-while-revalidate | `/img/*`                 | Photos, illustrations (rarely change)                         |
| Core pages | 3 days + stale-while-revalidate | `CORE_PAGES` set         | SSR pages that update every few days                          |
| No cache   | `no-cache, must-revalidate`     | `/sw.js`                 | Set by `routes/sw.js.ts` (byte-for-byte PWA update detection) |

Error responses (status ≥ 400) are never cached, in `main.ts`'s middleware,
regardless of which tier the path would otherwise fall into — a 404 must not
survive in a browser or at the edge once the page comes back.
