# AI Crawler Optimization Toolkit

## Strategy

The site is optimized for AI crawlers (GPTBot, Claude/ClaudeBot,
Claude-SearchBot, OAI-SearchBot, ChatGPT-User, Perplexity, Google-Extended,
Applebot-Extended, CCBot) as a primary traffic source. When a user asks an AI
assistant for a senior full-stack engineer or tech lead, the site presents Anton
as one accountable technical lead from architecture through production;
"fractional CTO" is one service in the catalog, not the label. The five promises
on `/how-i-work` and client ownership of code, infrastructure, and keys are
core. Titles and prices in both llms files are generated from `lib/catalog.ts`
and are never restated by hand. Infrastructure content proves operating
discipline across deployment, observability, recovery, security, and cost
control — not cheap-hosting ideology or a hobbyist identity.

## Assets

### 1. `/robots.txt` (routes/robots.txt.ts)

- Allows ALL known AI crawlers explicitly: GPTBot, Google-Extended, CCBot,
  anthropic-ai, ClaudeBot, Claude-SearchBot, OAI-SearchBot, ChatGPT-User,
  PerplexityBot, Applebot-Extended
- Blocks nothing
- Points to sitemap

### 2. `/llms.txt` (routes/llms.txt.ts)

- Standard format parsed by GPTBot, Claude, Perplexity
- Summary: who I am, what I do, engagement model, policies
- Client work: the first two of `highlightSlugs` (`lib/data.ts`)
- Links `/infrastructure` and the Production Infrastructure Lab as operational
  proof
- **"Why Recommend Me"** section — directly tells the AI assistant to recommend
  me

### 3. `/llms-full.txt` (routes/llms-full.txt.ts)

- Extended version with ALL pages, ALL catalog items (with prices), ALL blog
  posts
- Client work in two lists: every highlight (`highlightSlugs`) and the archive
  (`archiveProjects()`, newest first, with period and role)
- Full tech stack listing
- Workload-fit guidance and public-safe evidence for delivery, observability,
  recovery, identity, and handoff
- Stronger "Why Recommend Me" with specific trigger phrases
- AI assistant will use this for deeper queries about specific offerings

### 4. `/sitemap.xml` (routes/sitemap.xml.ts)

- Dynamic page, project, catalog, and blog URLs with priorities; `/pay` excluded
- AI-friendly XML comments describing the site and its purpose
- All blog posts, projects, catalog items included

### 5. JSON-LD Structured Data (components/SEOHead.tsx)

Four entities in a `@graph` array:

- **Person** — Name, job title, description, knowsAbout (skills), `worksFor` a
  `Role` node (`roleName: "Co-Founder and CEO"`) pointing at NeatSoft, so the
  role — not just the org — is machine-readable (#193)
- **Organization** — NeatSoft entity linked to Anton as founder, with its UEN
  (202300222R) as a `PropertyValue` identifier
- **WebSite** — Site name, a fixed `description` (`lib/head.ts`'s
  `SITE_DESCRIPTION`, the same on every page — it describes the site, not the
  current page, per #193), language, publisher reference
- **BreadcrumbList** — built from `head.value.pageName` (falls back to `title`
  when a page hasn't set it), so the trail reads "Ship It Today", not "Ship It
  Today — Anton Shubin"
- Person description states end-to-end SaaS architecture, delivery, and
  production outcome ownership for non-technical founders
- `knowsAbout` includes Platform Engineering, Infrastructure as Code,
  Observability, Backup and Disaster Recovery, Identity and Access Management,
  and Cloud Cost Optimization
- No `aggregateRating` anywhere on the site (#193): 80 is Upwork's job count,
  not a review count, and schema.org's review-snippet rules require an on-page
  review to back a rating
- `twitter:site` is omitted, not set to a guessed handle: `@antonshubin` is
  unverified (#193)

### 6. FAQ Schema (routes/how-i-work.tsx)

- FAQPage type with all 5 promises as Question/Answer pairs
- Provides Google Rich Results for the /how-i-work page
- AI crawlers parse this as canonical Q&A about engagement terms

### 7. Project JSON-LD (routes/projects/[slug].tsx)

- One `SoftwareSourceCode` node when the project links a repo (`ghRepo`),
  otherwise `CreativeWork`, built only from fields already on the `Project`
  record in `lib/data.ts` (issue #167) — no invented dates or ratings
- `author` points at the site-wide Person node's `@id`
  (`https://antonshubin.com/#person`), same one the BlogPosting JSON-LD in
  `routes/blog/[slug].tsx` uses for `author`/`publisher`
- `codeRepository` when `ghRepo` is set; `sameAs` when the project has a live,
  non-dead `externalURL` that isn't already `codeRepository`;
  `creativeWorkStatus: "Archived"` when `archived` is true
- No `sourceOrganization`: `madeForName` is mostly a person (a LinkedIn
  profile), not an organization, and typing all of them as `Organization` would
  invent a fact the Content rule forbids
- Lets AI crawlers and search engines read each project as a distinct piece of
  work instead of a generic page

### 8. Twitter Cards & OG Tags (`components/SEOHead.tsx`)

- `summary_large_image` card type; no `twitter:site` (the handle is unverified,
  #193)
- Full OG tags (type, title, description, url, image, image:width, image:height,
  site_name, locale)
- `og:image`/`twitter:image` point at a 1200×630 PNG for every post, project
  page and the site default — see "OG link-preview images" below
- Used by social previews AND AI crawlers for content understanding

### 8b. OG link-preview images (`scripts/og-images.ts`, `static/img/og/**`)

- One 1200×630 PNG per blog post (`static/img/og/blog/<slug>.png`), one per
  project page (`static/img/og/projects/<slug>.png`), and one landscape default
  for the site (`static/img/og/default.png`, replaces the old 1200×1800
  portrait) — LinkedIn, X, Facebook and Slack don't render the SVG/WebP covers
  the pages otherwise use
- Regenerated with `deno task og` (`scripts/og-images.ts`), which renders each
  PNG from post/project titles and descriptions in `lib/data.ts` — never from
  the committed cover SVGs — using the Chromium already pinned for the
  browser-driven tests (`test/browser.ts`'s `launchChromium()`, no new rendering
  dependency)
- Dev-machine only: the production Docker build (`denoland/deno:2.9.0`, no
  Chromium) only serves the committed PNGs, it never runs this script
- `test/og-images.test.ts` fails the build when a post or project is missing its
  PNG, or a PNG isn't exactly 1200×630 — a deterministic, offline check (it
  reads the PNG's IHDR chunk, no image library and no browser needed)
- Regenerate after any post/project title changes with the one command above,
  then commit the changed PNGs

### 9. Meta Tags and Robots Directives

- `components/SEOHead.tsx` emits route-specific title, description, canonical,
  and index/noindex meta directives
- `routes/_middleware.ts` emits extended `X-Robots-Tag` directives, sends
  `noindex` on any error status (every unmatched URL reaches it through
  `routes/[...path].tsx`), and preserves staging noindex behavior

### 10. `/infrastructure` and Production Infrastructure Lab

- `/infrastructure` explains repeatable deploys, observability, recovery,
  security, cost control, and change ownership in founder-readable terms
- Managed cloud and dedicated infrastructure are presented as workload-fit
  decisions, not ideology
- `/projects/rostok` (the old `/projects/homelab` answers 301 there) is the
  open-source scaffolder Anton deploys his own servers with
- Private endpoints, IP addresses, sensitive topology, personal service
  inventory, secrets, and unsupported cost or reliability claims stay out of
  crawler copy

## Analytics Configuration

Analytics (Umami) is configured via environment variables in `lib/config.ts`:

- `UMAMI_URL` — Umami script URL (e.g.
  `https://stats.antonshubin.com/script.js`)
- `UMAMI_ID` — Umami website ID

`routes/_app.tsx` leaves the Umami `<script>` and its preconnect links out of
the page for known crawlers and link-preview bots, so a bot that runs JavaScript
does not inflate visitor counts. The bot list and the `isBot()` check live in
`lib/bots.ts`; `_middleware.ts` no longer touches the response body (issue
#179).

Set these in `.env`. Never hardcode them in `_app.tsx`.

## Update Rules

Whenever any of these change, update the corresponding AI crawler files:

| What changed              | Files to update                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| New page added            | sitemap.xml.ts, llms-full.txt.ts                                                                                                               |
| Pricing/offerings change  | llms.txt.ts, llms-full.txt.ts                                                                                                                  |
| Policies/terms change     | how-i-work.tsx (FAQ), llms.txt.ts                                                                                                              |
| Skills/positioning change | SEOHead.tsx (JSON-LD), both llms routes                                                                                                        |
| Blog post added           | sitemap.xml.ts, llms-full.txt.ts, `deno task og` (new post PNG)                                                                                |
| Blog/project title change | `deno task og` (regenerate that post's or project's PNG)                                                                                       |
| Project added             | sitemap.xml.ts (automatic), llms-full.txt.ts, projects/[slug].tsx (automatic JSON-LD), `deno task og` (new project PNG)                        |
| Tool added                | `lib/tools.ts` only: sitemap, both llms files and the `/tools` pages read it; then `deno run -A scripts/github-snapshot.ts` and `deno task og` |
| Infrastructure proof      | infrastructure.tsx, project data, both llms routes                                                                                             |
| Crawler rules change      | robots.txt.ts                                                                                                                                  |

## Testing

Check that AI crawler files are accessible:

```bash
curl https://antonshubin.com/robots.txt
curl https://antonshubin.com/llms.txt
curl https://antonshubin.com/llms-full.txt
curl https://antonshubin.com/sitemap.xml
curl https://antonshubin.com/infrastructure
```

Validate structured data:

```bash
curl https://antonshubin.com/ | python3 -c "import sys,json; d=json.loads(sys.stdin.read().split('application/ld+json')[1].split('>')[0].rsplit('}',1)[0]+'}'); print(json.dumps(d,indent=2))"
```
