# AGENTS.md

The global agent instructions own Git Flow, branch naming, commit convention,
pull-request discipline and the merge protocol. This file only adds what is
specific to this repository.

## Project structure

```
├── assets/         # Global CSS
├── components/     # Preact components (Layout, CTASection, Icons)
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
deno task test                  # deno test alone
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

A separate `weekly-numbers` step runs only on the Sunday `cron` event and only
runs `deno task weekly-numbers`, never `deno task check`; the `check` step's
`when: event: [push, pull_request]` keeps it from running on that same cron
trigger. See `docs/weekly-numbers.md` for the env vars it needs and the one-time
Woodpecker cron setup.

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
