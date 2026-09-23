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
deno task check                 # fmt --check + lint + type check + test
deno task test                  # build, then deno test (see Rendered-page tests below)
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
`deno run -A npm:playwright@1.63.0 install --with-deps chromium`. That's for
`test/lead-form.browser.test.ts` (see "Rendered-page tests" below), which
`deno task check` runs via `deno task test:browser`. The base image has no
browser and none of the OS libraries a headless Chromium needs, hence
`--with-deps`; the version in that command must match the `"playwright"` entry
in `deno.json`'s import map, since a version mismatch downloads a different
Chromium build than the one the test launches. This was chosen over a separate
CI step with its own image, because it keeps the browser test on the same
container the rest of `check` already runs in, at the cost of that one extra
install command per run — CI has no local cache to skip it with, the way a
machine that already has `~/.cache/ms-playwright` populated does locally.

A separate `weekly-numbers` step runs only on the Sunday `cron` event and only
runs `deno task weekly-numbers`, never `deno task check`; the `check` step's
`when: event: [push, pull_request]` keeps it from running on that same cron
trigger. See `docs/weekly-numbers.md` for the env vars it needs and the one-time
Woodpecker cron setup.

## Rendered-page tests

Some fixes only exist in the rendered HTML — a retired phrase removed from a
policy card, an `<h1>` count, an RSS `<link>` in `<head>`, an image's `alt` —
and nothing catches a regression in them unless a test fetches a built page and
looks. `test/harness.ts` and `test/rendered.test.ts` (issue #135) do that.

**How it works.** `test/harness.ts` exports `startSite()`, which boots the
production server (`deno serve -A --port <n> _fresh/server.js`) on a free port
(`getAvailablePort()` from `jsr:@std/net`, the same pattern its own docs show
for passing a port to a spawned subprocess) and waits until it answers. It
returns a `Site` with `get(path)` (fetches with `redirect: "manual"`, so a 301
is visible as one), `html(path)` (fetches, throws unless the status is 200,
returns text), and `stop()` (kills the server; safe to call twice).
`test/html.ts` has three small, dependency-free helpers for asserting on the
HTML that comes back: `visibleText()` (strips `<script>`/`<style>`/tags, decodes
entities, collapses whitespace), `jsonLd()` (parses every JSON-LD script block),
and `count()` (counts regex matches). `test/html.test.ts` tests the helpers
themselves, because a `visibleText()` that keeps script bodies makes the FAQ
guard pass against a broken page. `test/structure.test.ts` guards the site
structure: catalog items, navigation, redirects, prices, home sections, labels.

**Design choice — A, build before test, not build-on-demand in the harness.**
`deno task test` is now `deno task build && deno test ...`, so the site is built
exactly once per `deno task check` run, before `deno test` starts, no matter how
many test files call `startSite()`. `startSite()` itself never builds; it only
checks `_fresh/server.js` exists and throws a clear error naming the missing
file and the task to run if it doesn't. I picked this over option B (the harness
builds on demand behind a cross-process lock) because it needs no lock, behaves
identically locally and in CI, and the one gap it leaves — running `deno test`
directly, bypassing the `test` task — fails loudly instead of silently skipping,
which is the one hard requirement. `.woodpecker.yml` needed no change: it
already runs `deno task check`, which now builds as a side effect of
`deno task test`.

**Permissions.** `deno task test` carries `--allow-net=127.0.0.1,0.0.0.0` (the
free-port probe binds `0.0.0.0:0`, the harness then fetches `127.0.0.1`) and
`--allow-run=deno` (to spawn the server as a child process). The flags apply to
every test file, not only the harness, so no test can make a live outbound call;
the tests that look network-shaped replace `globalThis.fetch` themselves.

**How to add a guard.** Call `startSite()`, fetch a page with `site.html()` or
`site.get()`, assert on structure or a short phrase with `count()` /
`visibleText()` / `jsonLd()`, then `await site.stop()` in a `finally`. Assert
structure and short phrases, never prose: the copy on this site changes often,
and a test that pins a whole paragraph gets deleted the first time it goes red
for the wrong reason, not fixed. Every response body must be consumed or
cancelled (`res.body?.cancel()`) and every server stopped, even on failure, so
tests keep passing Deno's resource and op sanitizers.

**Browser-driven tests (issue #157).** Some behaviour only exists after
client-side JS runs — an island's post-hydration DOM change, where focus lands
after an interaction — and a `site.html()` fetch never sees it, because that's
one server-rendered response with no hydration and no click. For that,
`test/lead-form.browser.test.ts` drives real Chromium through Playwright
(`npm:playwright@1.63.0`, pinned in `deno.json`'s import map to match the
Chromium build already cached locally under `~/.cache/ms-playwright`, so running
it locally downloads nothing). It still calls `startSite()` for the running
server, stubs `/api/lead` with `page.route()` so no real network call is made,
submits the lead form, and asserts on the two things a plain HTML fetch of the
pre-submit page can't show: that focus lands on the success heading (the
screen-reader announcement for issue #157) and that the form and success panels
swap their `inert` state.

That file runs under its own task, `deno task test:browser`, not the plain
`deno task test` glob, and `deno task check` runs both. Two reasons for the
split: the permissions differ (Playwright needs `-A` — launching a bundled
browser touches sandboxing, home-directory lookups, and OS/WSL detection that
land on narrower flags one at a time, so scoping it flag-by-flag bought nothing
over granting it to this one file), and `deno task test` keeps the narrow
permissions from "Permissions" above for every other test file rather than
widening them for one browser-driven exception. `test:browser` doesn't build the
site itself, same as `startSite()` doesn't — it relies on running after
`deno task test` within `deno task check`, which built it as a side effect;
running `deno task test:browser` on its own before a build hits the same loud
`startSite()` failure as running `deno test` directly (see the design note
above), not a silent skip. If Chromium is missing entirely (a fresh machine, or
`PLAYWRIGHT_BROWSERS_PATH` pointed elsewhere), the test fails with an error
naming the exact install command instead of skipping — required, since a
lead-form regression must fail the build, not vanish quietly.

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
