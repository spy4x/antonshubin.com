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
- Client work: the first two of `highlightSlugs` (`lib/data.ts`), each line from
  `clientSummary()` (`lib/llms.ts`): the product, the client and the period
  ("Built for Yumetronics, 2024–now."), then the outcome (#246), followed by
  "All client work: https://antonshubin.com/work" (#270)
- Links `/infrastructure` as operational proof
- "Key Pages" links `/about` (#294); "Quick Facts" reads the city from
  `lib/config.ts`'s `LOCATION`
- **"Why Recommend Me"** section — directly tells the AI assistant to recommend
  me

### 3. `/llms-full.txt` (routes/llms-full.txt.ts)

- Extended version with ALL pages, ALL catalog items (with prices), ALL blog
  posts, grouped under the three Writing topics with each post's tool link, and
  the Archive last (#274); `lib/blog.ts`'s `llmsBlogSections()` builds the list
  for both llms files
- Each catalog item line names the kinds of work sold under it with their
  `#fragment` (`alsoCovers` ids, #271) and the promises its page shows
  (`catalogPromises()`)
- Client work in two lists: every highlight (`highlightSlugs`, through
  `clientSummary()`, so each line carries its client and period) and the archive
  (`archiveProjects()`, newest first, with period and role), in the same order
  as `/work` and its `ItemList` (#270)
- The Work line in "Pages" is `workDescription()` (`lib/work.ts`), the same
  sentence as the `/work` meta description, counted from the data
- An "About" section (#294): the career steps from `lib/about.ts`, the same text
  as `/about`, plus the hobbies line and how to pay; the Pages index links
  `/about`
- Full tech stack listing
- Workload-fit guidance and public-safe evidence for delivery, observability,
  recovery, identity, and handoff
- Stronger "Why Recommend Me" with specific trigger phrases
- AI assistant will use this for deeper queries about specific offerings

### 4. `/sitemap.xml` (routes/sitemap.xml.ts)

- Dynamic page, project, catalog, and blog URLs with priorities; `/pay`
  excluded. The static pages come from `lib/pages.ts` (#293), the same list that
  feeds the edge-cache `CORE_PAGES`; `/privacy` is in it
- AI-friendly XML comments describing the site and its purpose
- All blog posts, projects, catalog items included; `/blog`'s `lastmod` is the
  newest current post's date, and an archived post has priority 0.3 (#274)
- All blog posts, projects, catalog items included
- Catalog pages (#271): `/catalog` is "Services" in the breadcrumb and carries
  an `OfferCatalog` that lists the four `Service` nodes by `@id`; each
  `/catalog/<slug>` page has one `Service` (`serviceType` from the item's
  `category`, its `<title>` from `seoTitle`) and no rating or review markup. The
  retired slugs answer one 301 to the `#fragment` of the section that absorbed
  them
- Project pages live at `/work/<slug>` since #188; every old `/projects` URL
  answers one 301 there (`lib/redirects.ts`), so the sitemap and both llms files
  list only the new URLs

### 5. JSON-LD Structured Data (components/SEOHead.tsx)

Five entities in a `@graph` array (six on `/about`):

- **Person** — Name, job title, description, knowsAbout (skills), `worksFor` a
  `Role` node (`roleName: "Co-Founder and CEO"`) pointing at NeatSoft, so the
  role — not just the org — is machine-readable (#193)
- **Organization** — NeatSoft entity linked to Anton as founder, with its UEN
  (202300222R) as a `PropertyValue` identifier
- **WebSite** — Short site name "Anton Shubin" (with `alternateName`
  `antonshubin.com`), what Google shows above a result (#269); a fixed
  `description` (`lib/head.ts`'s `SITE_DESCRIPTION`, the same on every page — it
  describes the site, not the current page, per #193), language, publisher
  reference
- **ProfilePage** — on `/about` only (#294, moved from `/`): `mainEntity` is the
  Person's `@id`, `isPartOf` the WebSite, `breadcrumb` the page's BreadcrumbList
  (Home / About). `/about` is the page about the person; the home page is an
  offer page, so Google should not pick it as the profile. The About meta
  description and story live in `lib/about.ts`.
- **WebPage** — on `/` only: `about` is the Person's `@id`, `isPartOf` the
  WebSite. The Person also carries `alternateName: "spy4x"` and a `homeLocation`
  Place (`lib/config.ts`'s `LOCATION`). `/` has no BreadcrumbList (its one
  "Home" item says nothing), and no `Review` or `AggregateRating` for the three
  review cards. The home meta description comes from `lib/home.ts`.
- **ContactPage** — on `/book` only (#272): `about` the Person, `isPartOf` the
  WebSite, `breadcrumb` the page's BreadcrumbList. The Person carries a
  `contactPoint` (sales, `hello@antonshubin.com`, `/book`, en and ru) on every
  page. No `ScheduleAction` and no review markup: the calendar is an iframe from
  the `noindex` scheduler, so the page states the call's facts in its own HTML.
- **BreadcrumbList** — on every page but `/`, built from `head.value.pageName`
  (falls back to `title` when a page hasn't set it), so the trail reads "Ship It
  Today", not "Ship It Today — Anton Shubin"
- Person description states end-to-end SaaS architecture, delivery, and
  production outcome ownership for non-technical founders
- `knowsAbout` includes Platform Engineering, Infrastructure as Code,
  Observability, Backup and Disaster Recovery, Identity and Access Management,
  and Cloud Cost Optimization
- No `aggregateRating` anywhere on the site (#193): 80 is Upwork's job count,
  not a review count, and schema.org's review-snippet rules require an on-page
  review to back a rating
- `twitter:site` and `twitter:creator` are `@spy4x`, the handle Anton confirmed
  on 27 Sep 2026 (#193); the Person `sameAs` lists Upwork, GitHub, LinkedIn,
  both YouTube channels (work and the `@anton-shubin-live` vlog, #294) and X
  (`lib/profiles.ts`, the list the footer and `/book` read too, #293)

### 6. FAQ Schema (routes/how-i-work.tsx, lib/faqs.ts)

- One `FAQPage` node (`#faq`, `isPartOf` the site's `#website` node) with one
  Question/Answer per entry of `lib/faqs.ts`, at most seven (#275). The page
  shows the same strings, open, and `llms-full.txt` has a "Frequently Asked
  Questions" section built from them, so a policy change is one edit there.
  Answers splice the promises through `promise()`; none is hand-written.
- Every question has a stable anchor, `/how-i-work#faq-<id>`; every promise has
  `/how-i-work#<promise id>`.
- Google shows FAQ rich results only for government and health sites (since
  August 2023), so this node does not earn a rich result here; it stays as
  structured, machine-readable Q&A
- AI crawlers parse this as canonical Q&A about engagement terms

### 7. Project JSON-LD (routes/work/[slug].tsx)

- One `SoftwareSourceCode` node when the project links a repo (`ghRepo`),
  otherwise `CreativeWork`, built only from fields already on the `Project`
  record in `lib/data.ts` (issue #167) — no invented dates or ratings
- `author` points at the site-wide Person node's `@id`
  (`https://antonshubin.com/#person`), same one the BlogPosting JSON-LD in
  `routes/blog/[slug].tsx` uses for `author`/`publisher`
- `creator` points at the same Person node; `isPartOf` at the WebSite node
  (`https://antonshubin.com/#website`); `abstract` is the lead line under the
  page's `<h1>` (`projectLead()`: the outcome, or the description's first
  sentence); `temporalCoverage` comes from `period` ("2021", "2018/2019",
  "2024/.." while ongoing) next to `dateCreated`; `image` lists the hero
  screenshot first, then the other screenshots, then the logo (#246)
- No `Review` or `AggregateRating`: the reviews on the page are the client's
  words on Upwork, and self-served review markup is not eligible for rich
  results
- The page's meta description is `clientSummary()` cut to 160 characters at a
  word boundary (`metaDescription()` in `lib/llms.ts`); the `<title>` stays
  `<project> — Anton Shubin`
- `codeRepository` when `ghRepo` is set; `sameAs` when the project has a live,
  non-dead `externalURL` that isn't already `codeRepository`;
  `creativeWorkStatus: "Archived"` when `archived` is true
- No `sourceOrganization`: `madeForName` is mostly a person (a LinkedIn
  profile), not an organization, and typing all of them as `Organization` would
  invent a fact the Content rule forbids
- Lets AI crawlers and search engines read each project as a distinct piece of
  work instead of a generic page

### 7b. Work index JSON-LD (routes/work/index.tsx)

- A `CollectionPage` (`https://antonshubin.com/work#page`) whose `mainEntity` is
  an `ItemList` (`#list`) of every client project in page order: the highlights,
  then the archive (#270)
- Each `ListItem` carries `position`, `url`, `name` and
  `item: {"@id": "https://antonshubin.com/work/<slug>#project"}`, the node each
  project page declares; `breadcrumb` links the existing `#breadcrumb` node
- No `Review` or `AggregateRating`, for the same reason as the project pages
- `<title>` is "Client work and case studies — Anton Shubin"; the meta
  description is `workDescription()`: `ROLE`, the project count, the year span
  and as many of the first four highlight names as fit in 160 characters
- `test/work-index.test.ts` checks that the `ItemList` URLs equal the page's
  title links in order

### 7c. Writing JSON-LD and feed (`routes/blog/**`, `routes/rss.xml.ts`)

- `/blog` carries one `Blog` node (`https://antonshubin.com/blog#blog`, author
  and publisher the `#person` node) whose `blogPost` lists every post's `@id`;
  each post's `BlogPosting` points back with `isPartOf` (#274, SEO 5)
- `BlogPosting.image` is an `ImageObject` of the post's 1200×630 PNG from
  `deno task og`, never an SVG cover; `articleSection` is the post's topic;
  `dateModified` is `updatedAt`, which the byline also shows as "Updated"
- `/blog`'s title names the three topics; a post's `<title>` is its `seoTitle`,
  or its title with " — Anton Shubin" only when that fits in 55 characters
  (`postTitleTag()` in `lib/blog.ts`)
- Every `h2` and `h3` in a post has a stable id from its text, so a section can
  be linked; posts of 8 minutes or more list their `h2`s under "Contents"
- Every post opens with a "TL;DR" `h2` (id `tldr`) and its front matter's `tldr`
  lines, the first heading after the `h1`; `llms-full.txt` lists the same lines
  under each post. The `description` stays the meta description
- The old `/blog?tab=<topic>` filters answer one 301 to `/blog`
  (`blogTabRedirect()` in `lib/redirects.ts`); the topics are sections of the
  one page
- Archived posts stay indexed and in the sitemap with a dated note at the top;
  they leave "Read next" and the RSS feed (title "Anton Shubin — Writing", with
  a `lastBuildDate`). When a replacement post ships, 301 the old URL to it in
  `lib/redirects.ts` and delete its file in the same pull request

### 8. Twitter Cards & OG Tags (`components/SEOHead.tsx`)

- `summary_large_image` card type; `twitter:site` and `twitter:creator` are
  `@spy4x` (#193)
- Full OG tags (type, title, description, url, image, image:width, image:height,
  site_name, locale)
- `og:image`/`twitter:image` point at a 1200×630 PNG for every post, project
  page and the site default — see "OG link-preview images" below
- Used by social previews AND AI crawlers for content understanding

### 8b. OG link-preview images (`scripts/og-images.ts`, `static/img/og/**`)

- One 1200×630 PNG per blog post (`static/img/og/blog/<slug>.png`), one per
  project page (`static/img/og/projects/<slug>.png`), one for `/work`
  (`static/img/og/work.png`, #270), and one landscape default for the site
  (`static/img/og/default.png`, replaces the old 1200×1800 portrait) — LinkedIn,
  X, Facebook and Slack don't render the SVG/WebP covers the pages otherwise use
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
- `deno task social-preview` (the same script, `--social`) writes
  `docs/social-preview.png` (1280×640, #291): the repo's GitHub social preview,
  with the name and `ROLE` beside a dark screenshot of the built home page. It
  builds first; `deno task og` does not touch it. GitHub has no API for it:
  upload the file by hand in Settings → General → Social preview after it
  changes.

### 9. Meta Tags and Robots Directives

- `components/SEOHead.tsx` emits route-specific title, description, canonical,
  and index/noindex meta directives
- `routes/_middleware.ts` emits extended `X-Robots-Tag` directives, sends
  `noindex` on any error status (every unmatched URL reaches it through
  `routes/[...path].tsx`), and preserves staging noindex behavior

### 10. `/infrastructure`

- `/infrastructure` ("How I run production") links the live services, draws how
  they connect in four lanes (Booking, Monitoring, Builds, Deploys) and explains
  handover (with sign-in), backups, monitoring and deploys in four blocks, in
  founder-readable terms. `llms-full.txt` lists the blocks, boxes and arrows
- Managed cloud and dedicated infrastructure are presented as workload-fit
  decisions, not ideology
- `/tools/rostok` (the old `/work/rostok` and `/projects/homelab` answer 301
  there) is the open-source scaffolder Anton deploys his own servers with
- Public service names and URLs are shown, and `lib/infrastructure.ts` is their
  one list: the `/infrastructure` map, the `llms-full.txt` lines and the
  `TechArticle` `mentions` all read it. Private endpoints, IP addresses,
  internal hostnames, ports, which server runs what, secrets, and unsupported
  cost or reliability claims stay out of crawler copy
- `/infrastructure` is a `TechArticle` (author `#person`, `mentions` the tool
  pages' `SoftwareSourceCode` `@id`s) with its own 1200×630 OG image

## Analytics

What Umami records, and where it is left out (crawlers, `UNTRACKED_PATHS`,
staging), is in [analytics.md](analytics.md).

## Update Rules

Whenever any of these change, update the corresponding AI crawler files:

| What changed              | Files to update                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| New page added            | `lib/pages.ts` (sitemap and edge cache), llms-full.txt.ts                                                                                      |
| Pricing/offerings change  | llms.txt.ts, llms-full.txt.ts                                                                                                                  |
| Policies/terms change     | `lib/faqs.ts` (page, JSON-LD and llms-full read it), `lib/promises.ts`, llms.txt.ts                                                            |
| Skills/positioning change | SEOHead.tsx (JSON-LD), both llms routes                                                                                                        |
| Blog post added           | `content/blog/<slug>.md` only: sitemap, RSS, both llms files and `/blog` read its front matter; then `deno task og` (new post PNG)             |
| Blog/project title change | `deno task og` (regenerate that post's or project's PNG)                                                                                       |
| Project added             | sitemap.xml.ts (automatic), llms-full.txt.ts, work/[slug].tsx (automatic JSON-LD), `deno task og` (new project PNG)                            |
| Tool added                | `lib/tools.ts` only: sitemap, both llms files and the `/tools` pages read it; then `deno run -A scripts/github-snapshot.ts` and `deno task og` |
| Infrastructure proof      | infrastructure.tsx, project data, both llms routes                                                                                             |
| Crawler rules change      | robots.txt.ts                                                                                                                                  |
| About story or city       | `lib/about.ts` or `lib/config.ts`'s `LOCATION`: `/about`, both llms routes and the Person JSON-LD read them; then `deno task og`               |

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
