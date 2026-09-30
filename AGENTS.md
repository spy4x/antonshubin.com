# AGENTS.md

The global agent instructions own Git Flow, branch naming, commit convention,
pull-request discipline and the merge protocol. This file only adds what is
specific to this repository.

## Anton's goals and this site's role

Every page and every post exists to move Anton's goals forward, so read them
before writing anything for the site. They live in `~/sync/code/ai-memory/`:
`profile.md` ("Goals", "How I sell", "Proof I can show") and `situation.md` (the
current plan, targets and dates). The numbers and the private parts stay there,
never in this public repository.

In short, as of September 2026:

- **Now: paid client work.** Buyers arrive from Upwork, referrals and LinkedIn.
  The site does not bring them; it closes them. A visitor should leave convinced
  that Anton is a senior full-stack engineer and tech lead they can trust with
  their project and budget, and know how to book a call.
- **Next: his own products and the YouTube channel.** The open-source tools on
  `/tools` get one launch at a time; stars, issues and requests decide which
  gets product hours. Videos come from the week's real work.
- **Personal brand** (Anton's request, 26 September 2026): every post should
  build the reputation he sells on, so the posts add up to one recognisable body
  of work instead of scattered pieces.

## Designing a page: four expert reviews first

Every new page, and every redesign of a page a visitor uses to decide (home,
work, services, booking, tools, writing, how I work), goes through this flow
before any code. Anton asked for it on 26 September 2026 after #246 used it to
rebuild the project page. #246 and PR #258 are the worked example: the four
reviews and the merged spec are comments on the issue. Small fixes, such as a
bug, a wording change or one element, skip it.

1. **An issue per page.** It holds the page's job (what a visitor must believe
   and then do), the sample URLs to review, and the order against any feature
   issue that touches the same route. The feature issue keeps its content
   bullets. Its layout bullets become input for the experts, not decisions.
2. **Four expert reviews, no code, in parallel.** A UI/UX designer (the `claude`
   agent, briefed as a senior product designer of modern developer portfolios
   and SaaS case-study pages), SEO and marketing (both `marketing-seo`, one with
   a search lens and one with a conversion lens) and a psychologist
   (`psychologist`: trust, cognitive load, ethical persuasion only, no invented
   urgency or scarcity). One shared brief: the issue, the constraints below, and
   how to serve the site. That means `deno task build` in a throwaway worktree,
   then a throwaway script that uses `test/harness.ts`'s `startSite()` and
   `test/browser.ts`'s `launchChromium()` to capture the sample pages at 390px
   and 1440px, closing the browser and server in a `finally`. A page that
   doesn't exist yet is reviewed as the nearest existing page plus the issue's
   plan. Each expert posts at most ten recommendations on the issue, most
   important first, each with its reason and what a visitor notices.
3. **One merged spec, by the lead.** A wireframe at 390px and 1440px, the
   component list, and a table of what each recommendation became or why it was
   dropped. Where the experts disagree, the lead decides and says why. It is
   posted on the issue before any code. A sensible default wins; the spec
   doesn't wait for Anton's approval. Facts only Anton can supply go into a
   separate content issue, and the page ships with today's wording meanwhile.
4. **One implementer, one PR.** The PR traces every adopted recommendation to
   its review (UX 3, SEO 1, …) and lists what was dropped. It reuses existing
   components (`FactCard`, `PromiseTimeline`, `ClosingBand`, `ProjectFactCard`,
   `ImageGallery`, `ProjectReviews`, `StatusMark`, `Button`) rather than making
   a second copy. Tests guard the structure: the H1, the first-screen elements,
   the JSON-LD, and axe plus no horizontal scroll at 390px and 1440px in a
   browser test.
5. **Review, merge, deploy** as usual. The reviewer also does a browser pass on
   every page the change touches, not only the samples.

Constraints every review and spec keeps:

- **Visual system** (below): the `@theme` tokens only, the accent fill only on
  Book, `Button`/`buttonClass`, and `font-semibold`.
- **Content rule** (below): no new claim, number, quote or name. Wording comes
  from the `lib/*.ts` data files or from facts Anton supplied. When a
  recommendation needs data that doesn't exist, the spec says what the page
  shows without it.
- **Speed and access:** home LCP is no worse (`deno task lcp --ab`, plus
  `--path` for the page itself), and a hero image is the only eager,
  high-priority image. There are 0 axe violations and no horizontal scroll.
- **Search:** one real `<h1>`. No `Review` or `AggregateRating` JSON-LD for
  Anton's own reviews, because Google treats that as self-serving. The crawler
  files follow any change to headings or structure.

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
deno task test:browser          # Playwright lead-form, a11y, contrast, CSP, retired-service-worker, visual-system, notes, meet-embed, blog-overflow and safe-area tests; needs a built site and Chromium
deno task dev                   # dev server (Vite, HMR)
deno task build                 # production build (Vite)
deno task start                 # run the production server
deno task update                # update Fresh
deno task deploy                # production → antonshubin.com
deno task deploy:stag           # staging   → website-stag.antonshubin.com
deno task env:encrypt           # every .env* → its .env*.age (age64)
deno task env:decrypt           # every .env*.age → its plaintext (age64)
deno task env:status            # key presence + which env/age files exist
deno task publish:blog          # after deploy: live check, Dev.to draft, links; --send-newsletter only on Anton's yes
deno task launch-kit            # draft a repo launch's Reddit/HN/LinkedIn/Dev.to/YouTube posts
deno task video-kit             # transcript → titles, description, chapters, blog draft
deno task weekly-numbers        # Umami/GitHub/YouTube numbers → markdown + NTFY
deno task umami-reports         # create or update the Umami goals and funnels (--dry-run to preview)
deno task optimize:screenshots  # compress portfolio screenshots
deno task og                    # regenerate the 1200x630 OG link-preview PNGs
deno task lcp                   # home page LCP, CPU + network modes, n=15 (needs a build; --ab for A/B, --path for another page)
deno task strip-metadata        # strip EXIF/XMP/text chunks from every image under static/ and assets/
```

`deno task check` fails on a failing test, same as a lint or type error — a red
test blocks the merge exactly like a red lint.

## Environment setup for a new worktree

The age decrypt key is not part of this repo. Encryption is
`@spy4x/server/env-age64` (jsr:@spy4x/server@1.2.0/env-age64), per-value age64
in TypeScript — no `sops` binary, no `.sops.yaml`. It reads `.age/key.txt`,
which lives only in the main checkout: Syncthing replicates it as part of
`~/sync/code`; keep an offline copy as well. A linked git worktree needs no copy
of its own: the module finds the MAIN checkout's key itself by reading the
worktree's `.git` file, so skip the global `env-key-copy.ts` step here. Run
`deno task env:decrypt` to turn `.env.prod.age` into `.env.prod` and
`.env.deploy.age` into `.env.deploy`. Agents never copy an env file (`.env`,
`.env.prod`, or the key itself) between checkouts or worktrees — decrypt it
fresh in each one.

## Deploy

Order: review the pull request, merge it, then deploy from the default branch
(`deno task deploy`) right after the merge, without asking. Never deploy
unreviewed or unmerged code.

The deploy script passes the local commit hash to the remote build as
`BUILD_ID`, which `routes/sw.js.ts` prints in the retired worker (below), where
the deploy reads it back. Nothing is written back to a tracked file, so a deploy
leaves `git status` clean — see `docs/deploy.md`.

After `docker compose up` the deploy waits for the new build and purges
Cloudflare: `/sw.js` plus every `static/` file changed since the build that was
live (#268, `scripts/cloudflare-purge.ts`). It fails open. The site has no
service worker (#285): `/sw.js` is a script that clears the old worker's caches
and unregisters itself, kept until about January 2027 for browsers that
registered the old one, and the purge reads the build id from its
`const CACHE = "antonshubin-<id>"` line. Its token, `CLOUDFLARE_API_TOKEN`,
lives in `.env.deploy` (gitignored, committed as `.env.deploy.age`, restored by
`deno task env:decrypt`), which the deploy reads locally and never uploads; the
container does not need it. See `docs/deploy.md` "Cloudflare purge after a
deploy".

The newsletter subscriber list (`data/subscribers.json`) lives on the host:
`compose.yml` bind-mounts the app directory's `data/`, and the deploy's
`rsync --delete` excludes `/data/`. Keep both, or a deploy empties the list and
the newsletter's sent log (`data/newsletter-log.json`) next to it. Backup and
restore are in `docs/deploy.md` "Subscriber data".

## Code style

Double quotes, no semicolons, 2-space indent, 100 columns — this is what
`deno fmt` enforces, so run it instead of hand-formatting. Double quotes
override the global "backticks for strings" rule; backticks only for
interpolation.

## Catalog and prices

`lib/catalog.ts` is the only place a catalog title or price is written. The home
page, `/catalog`, `/catalog/[slug]`, the sitemap, both llms files, the guide
page and the `Offer` JSON-LD read from it. `lib/catalog.test.ts` pins the four
prices and the six redirects; `test/structure.test.ts` fails when a dollar
amount that is not in the catalog shows up on a page listed in its `PRICE_PAGES`
or in an llms file — add a page to that list when it starts showing a price.
Every client project page is on that list: its fact card and closing band link
"Similar work today" to the item named by the project's `catalogSlug`
(`lib/data.ts`, checked through `catalogItem()` by `lib/data.test.ts`). Retired
slugs live in `catalogRedirects` there and answer 301 — never link to one. The
same price list is used on Upwork and neatsoft.dev, so a price change is
followed by a manual edit in both places.

The label the site leads with is `ROLE` in `lib/head.ts` ("Senior Full-Stack
Engineer & Tech Lead"). "Fractional CTO" appears only as the Ongoing catalog
item. The five promises on `/how-i-work` are the only promises on the site; the
free written audit carries no deadline.

## Proof, promises, testimonials and notes

Four more `lib/*.ts` files hold the only written copy of a category of claim
(#186), the same pattern as `lib/catalog.ts` for prices — each exports a lookup
that throws on a typo, so a bad id fails the build instead of shipping a broken
reference.

- `lib/proof.ts` is the only place an Upwork number or label (jobs, job success
  rate, amount earned, hours, Expert-Vetted, Top 1%) is written. The home page,
  `components/SEOHead.tsx`'s JSON-LD, the sitemap comment, both llms files,
  `islands/LeadForm.tsx`, `routes/saas-architecture-guide.tsx`,
  `lib/subscribe-mail.ts`'s welcome email and `lib/tools.ts`'s template entry
  all read a value through `proof(id)`. A post's front matter writes a figure as
  a `{proof:<id>}` placeholder (the template post's title uses `{proof:jobs}`),
  which `lib/blog-posts.ts`'s `fillProof()` replaces.
  `test/proof-promises-notes.test.ts`'s proof guard scans `routes/`,
  `components/`, `islands/` and `lib/` (excluding `lib/proof.ts` and every
  `*.test.ts`) for each figure's exact rendered text — including the
  quoted-literal and case-insensitive forms a hand revert of the home proof
  strip would take (with an explicit allowlist entry for
  `islands/MeetEmbed.tsx`'s unrelated CSS `width: "100%"`) — and fails on a
  hand-written copy.
- `lib/promises.ts` holds the five promises' title, description and "why this
  matters" text. `/how-i-work` is where this wording was written and reviewed,
  so its copy is canonical; `routes/how-i-work.tsx`'s FAQ answers, the home
  page's "How a project runs" timeline (`components/PromiseTimeline.tsx`, shared
  with the coming `/how-i-work` redesign: `lib/promises.ts` lists the five in
  the order a project meets them, each with a `when` label), both llms files'
  Promises sections and `lib/catalog.ts`'s bug-fix bullet all splice a promise's
  `title`/`desc` through `promise(id)` (and `decapitalize()`/`firstSentence()`
  where a sentence needs to read as part of a longer one) instead of restating
  it. The same guard test scans for each promise's exact `title` and `desc`
  text, plus a short list of promise-specific key terms ("one or two weeks of
  work", "fixed free for 30 days"), outside `lib/promises.ts`.
- `lib/testimonials.ts` holds every client review (#231): public Upwork reviews
  copied verbatim from the portfolio archive, the client's spelling included,
  each tied to a client project by `projectSlug` (`testimonialProject()` throws
  on a typo) and cited by project, period and the client's name, linked to their
  profile (the project's `madeForName`/`madeForURL`, rendered by
  `components/ReviewSource.tsx` as "<client> reviewed on Upwork"; Anton asked
  for the name on 26 Sep 2026). An `excerpt` is only exact pieces of its `quote`
  joined by " … " — cut around a misspelling, never fix it.
  `lib/testimonials.test.ts` checks the slugs, the excerpts and the pinned
  misspellings. A project page shows its first review's excerpt as a pull quote
  under the hero, then every visible review in full
  (`components/ProjectReviews.tsx`), with the attribution printed once above the
  group and no period under each review; `routes/index.tsx` shows the three
  excerpts in `homeTestimonialIds` through `components/TestimonialCard.tsx`, and
  `test/reviews.test.ts` checks both on the built pages. `visibleTestimonials()`
  still filters on `sourceHref` and `permission: true`.
- Every client project in `lib/data.ts` carries a `period` (`lib/data.test.ts`
  fails without one), rendered by `formatPeriod()` ("2021", "2018–2019",
  "2024–now") on the cards, the project page fact card and the JSON-LD
  `dateCreated` and `temporalCoverage`. `outcomeNote`/`externalURLNote` attach a
  margin note to a project's outcome or live link.
- `lib/notes.ts` holds every margin note (`{ id, text, href?, checkedOn? }`) —
  the source or checked date behind a claim wrapped in
  `components/WithNote.tsx`, which stamps the claim with `data-note-ref="<id>"`.
  `test/proof-promises-notes.test.ts`'s note guard fetches every page in
  `/sitemap.xml` and fails if a `data-note-ref` doesn't resolve to a note
  carrying `href` or `checkedOn`. The note itself sits in a `.note-wrap` CSS
  grid column from 1100px (`assets/styles.css`), reserved inside the wrapper's
  own box rather than positioned into the page's margin, so it can't cause
  horizontal scroll regardless of viewport width — `test/notes.browser.test.ts`
  asserts `document.documentElement.scrollWidth` and the note's right edge never
  exceed the viewport, at 1100/1280/1440px.

## Tools registry

`lib/tools.ts` is the only list of my own projects (#189, #273): `/tools`,
`/tools/<slug>`, the sitemap and both llms files read it, and adding a tool is
adding an entry there. Every field except the name, the job line, the summary,
the status, the group and the kind is optional, and the page shows only the
blocks an entry has data for: no registry means no install line, no `ci` means
no CI pill, no `repo` means no repository row. A project with no page yet (oko,
the Seed) is a `toolRows` entry, a hub line with links, and is not in the
sitemap or the llms files. A status is written down for every entry, never
guessed from its link: `in-use`, `ready`, `beta`, `wip`, `paused` or `archived`,
and "Live" is only ever a link to a running public instance. A tool's
`registry.published` decides whether its pinned install command is offered with
a copy button or marked "Not yet available"; flip it to `true` the day that
version is really on its registry.

Numbers that change on their own — stars, licence GitHub detected, last push,
and the latest push pipeline's status on the default branch in Woodpecker — live
in `lib/github-snapshot.json`, written by
`deno run -A scripts/github-snapshot.ts` (read through `lib/github-snapshot.ts`)
and committed: the file is what a page renders from when the hourly refresh
(below) is off, has not finished yet or fails. It sits in `lib/`, not `data/`:
the deploy's rsync excludes `/data/` and `compose.yml` bind-mounts the host's
`data/` over it, so nothing committed under `data/` reaches production. Rerun
the script and commit the JSON when a CI status matters; `test/tools.test.ts`
checks each page shows what the snapshot holds. Each tool page's 1200×630
preview comes from `deno task og`, like a post's.

**Hourly refresh (#273).** On the server, `lib/tools-live.ts` refreshes each
tool's latest version (JSR or npm, from `registry.latestFrom`), stars and CI
status at most once an hour, in memory, through the same calls the script makes
(`lib/snapshot-fetch.ts`). A failed call keeps the committed value for that item
and never throws, every call times out after 5 seconds, and a page never waits
for a refresh: a request gets the last answer (or the committed file) at once
and the refresh runs in the background. It runs only when `TOOLS_LIVE_REFRESH=1`
(set in `compose.yml`), so `deno task test` and a dev server never call out;
tests build a refresher with a stub `fetch` (`lib/tools-live.test.ts`). Pages
say when the CI status was checked and whether it is the committed file
(`checkedLabel()`; a repository counts as live only when its GitHub and
Woodpecker calls both succeeded). `/tools` and `/tools/*` are cached for an hour
so a refresh reaches visitors (`lib/cache-control.ts`). A tool's `posts` link
each post to its page (the post header shows "The tool: <name>"); its
`catalogSlug` picks the catalog item the "hire me" door names; `deployable` adds
`SoftwareApplication` JSON-LD, whose `url` is only ever its running `live`
instance. The hub carries `CollectionPage` and `ItemList` JSON-LD. A tool page's
links send `outbound` (`to` `live` or `github`, `item` the slug), `cta` and
`book` with `item`, and its copy button `tool-install-copy`; see "Analytics"
below.

## Navigation

`lib/nav.ts` is the only list of navigation destinations (#185): the desktop
rail, the phone tab bar, the phone More dialog and the footer's Site group all
read it, so changing a destination is one entry there. `components/Nav.tsx`
renders the rail and the tab bar on the server; only More
(`islands/NavMore.tsx`, its dialog's contents rendered when it opens) ships JS.
There is no Links control (#293): More lists pages only (Home, About, How I
work, Writing, Infrastructure), and the profiles and feeds live in the footer.
The nav's icons are `components/Icons.tsx`'s `NavGlyph` (one short path each,
styled by `.nav-icon`) and its states are the `.nav-*` classes in
`assets/styles.css`: keep its markup small, because under `scripts/lcp.ts`'s
network profile every extra KB on every page measurably delays the home page's
LCP image. The phone header (photo, name, and `ROLE` on the right) is plain
markup in `components/Layout.tsx`; the time zone is in the footer. Book goes to
`/book` in the same tab and carries `data-primary-book`; with `SCHEDULE_URL`
unset it reads "Write" and goes to that page's written brief (`/book#brief`).
The footer's Contact group links the same page. `test/nav.test.ts` checks both
on every page.

## Site frame

The frame is what every page shares (#293). `components/Layout.tsx` renders the
phone header, the nav, `<main>` and `components/Footer.tsx`. The footer is plain
server markup on Desk with five parts: identity (name, `ROLE`, `LOCATION` and
`TIMEZONE_LABEL`, the NeatSoft invoices sentence) and four labelled lists, Site
(`lib/nav.ts`'s `siteItems` plus Privacy), Contact, Elsewhere and For machines.
At 390px it, not `<main>`, holds the bottom padding that clears the tab bar.

- `lib/profiles.ts` is the only list of profile URLs. The footer's Elsewhere
  group (`footerProfiles`), the `/book` side panel's email, Telegram and Upwork
  links and the Person JSON-LD's `sameAs` (`sameAsUrls`) read it; `profile(id)`
  throws on a typo. A new profile is one entry there.
- `lib/pages.ts` is the only list of core pages: `CORE_PAGES`
  (`lib/cache-control.ts`) and the sitemap's static entries read it through
  `pagesFor(surface)`. An entry is in both unless its `notIn` says why not
  (`/tools` has its own one-hour cache tier, `/pay` is not for search). A new
  page is one entry there, not two edits.
- `components/Breadcrumb.tsx` renders one "‹ Section" back link on a page two
  levels deep, first in the content column, under the nav's word for the section
  (`lib/nav.ts`'s `navLabel()`); the `BreadcrumbList` JSON-LD is unchanged.
- `components/NotFound.tsx` is the one not-found page: `routes/_404.tsx` and the
  `[slug]` routes of blog, work, catalog, tools and hackathons (which answer 404
  themselves) render it. It has a title, one H1, buttons to Work, Tools and
  Writing with the requested section's button first, and an email line.
- `routes/privacy.tsx` says only what the code proves. Change a sentence only
  together with the code it describes, and add nothing about retention or the
  mail provider: the repository cannot show either.
- The site-wide skip link is hidden by `routes/_app.tsx`'s inline critical CSS,
  whose unlayered `.sr-only` rule would beat Tailwind's layered
  `focus:not-sr-only`. That rule is `.sr-only:not(:focus)` for this reason;
  `test/frame.browser.test.ts` checks the link shows when focused.

`test/frame.test.ts` and `test/frame.browser.test.ts` guard all of this.

## Visual system

`assets/styles.css`'s `@theme` block is the only place a colour is defined
(#184): Ink, Desk, Paper and Lamp are the four dark surfaces (page; rail, bar
and closing bands; cards; active nav item and sheet), Rule and Rule strong are
hairline and control borders, Parchment and Graphite are primary and secondary
text, Accent (`#f97316`, Ink text on it, hover `#fb923c`) is the one
filled-button colour, and Sage, Mist and Brick are status colours (ready/live,
beta/info, risk/error). Every class in `routes/`, `components/` and `islands/`
uses these tokens (`bg-ink`, `text-parchment`, and so on) — a raw Tailwind
palette colour (`slate-*`, `gray-*`, `orange-*`) showing up again is a
regression, not a style choice.

`components/Button.tsx` is the one button component. `variant` defaults to
`secondary` (an outline button); `variant="primary"` (`bg-accent text-ink`) is
reserved for the Book action, and a primary button carries `data-primary-book` —
the marker `test/visual-system.browser.test.ts`'s "the accent colour is a
background only on the primary button and the nav's Book" guard looks for,
instead of guessing from text content or element shape.
`buttonClass(variant, extra)` (also exported from `Button.tsx`) is the same
class string as a plain string, for the handful of call sites that can't render
`<Button>` directly: `components/BookCallLink.tsx` (every "Book a call" link on
the site goes through it; it owns the `href`/`target`/empty-`url` behaviour
`<Button
href=…>` doesn't, and stamps `data-primary-book` itself for its default
`variant="primary"`). `buttonClass`'s base class string carries no padding, gap
or text-size utility — two Tailwind classes for the same property don't reliably
resolve by their order in one element's `class="..."` attribute, only by the
order Tailwind happens to emit them in the compiled stylesheet, so every call
site supplies its own sizing via `extra` instead of fighting a default.

`components/StatusMark.tsx` renders a shape plus a word for a project or tool
status (`in-use`, `ready`, `beta`, `wip`, `paused`, `archived`, `outcome`,
`issue`, `live`, `offline`) — never colour alone; used today on
`routes/work/index.tsx` and in the project page's fact card
(`components/ProjectFactCard.tsx`: live, offline or archived).

### Work section

`/work` (#188, `routes/work/index.tsx`) lists client work only: the Highlights
and Archive sections from #232, read through `lib/work.ts`'s `clientWork()`. My
own projects have their pages at `/tools/<slug>` since #273 (`lib/tools.ts`;
their old `/work/<slug>` URLs answer 301), and `/work/<slug>` serves client
projects only (`findWorkProject()`). `lib/work.ts` is derived from `lib/data.ts`
and `lib/testimonials.ts` and writes no copy of its own. The visible breadcrumb
is one "‹ Work" back link on pages two levels deep (`components/Breadcrumb.tsx`
renders nothing for a trail of two items), so a case page has it and `/work` has
none; every page keeps its `BreadcrumbList` JSON-LD, whose last item is the page
name, not the full `<title>`.

Since #270 the index is titled "Client work". The highlights are cards, in
`highlightSlugs` order (`lib/data.ts`; the home page takes the first three),
each with the picture from the project's optional `cardImage` (a WebP about
720px wide made from its first screenshot; a phone shot is centred on a Lamp
panel, and without one the card shows the logo). Only the first card image is
eager, and none has `fetchpriority`. The archive is a dated list. Each project's
one link is its title, and the status marks come from `lib/work.ts`'s
`projectStatus()`, which the fact card uses too. The page carries a
`CollectionPage` whose `ItemList` names every client project in page order, each
pointing at its page's `#project` node, with no review markup.
`test/work-index.test.ts` checks the built page.

### Home page and shared pieces

`routes/index.tsx` (#269) uses the project page's frame: a two-line `<h1>` (name
small, `ROLE` large), the lead, Book and "Send a written brief", a fact card
with the Upwork figures beside the four prices, then Client work, Client
reviews, "How a project runs", the tools and the closing band with the brief
form. The portrait renders only from 1024px: its `<img>` holds a blank pixel
until a `min-width: 1024px` `<source>` matches, so a phone requests no portrait,
and it is the page's one eager, `fetchpriority="high"` image. Reuse these rather
than making a copy:

- `components/FactCard.tsx`: the fact card's box plus `Fact` rows, used by the
  project page's card and the home card.
- `components/PromiseTimeline.tsx`: the five promises as a timeline (`variant`
  `compact` or `full`, `headingLevel` 2 or 3), no icons, no accent.
- `components/ClosingBand.tsx`: the band that ends a page (its `children` slot
  holds the home page's brief form).

### About page

`routes/about.tsx` (#294) uses the project page's frame: the `<h1>` "About Anton
Shubin" and a lead line, then the portrait (the page's one eager,
`fetchpriority="high"` image, cropped to 4:3) and a sticky `FactCard` with Book
in the right column, first at 390px. The main column holds the career in four
dated steps, two client reviews (`gopingu-1`, `connectful-2`, quoted nowhere
else), what Anton runs himself, one paragraph about life outside work, and how
to pay; `ClosingBand` ends the page. Book appears in the card and the band only.
The story, the page name and the meta description live in `lib/about.ts`, which
`/llms-full.txt` and `deno task og` read too; the city is `lib/config.ts`'s
`LOCATION`. The story leaves out the 2022 post's income figures, the loan, the
80/20 split and the "leave freelance" goal, and `lib/about.test.ts` fails if one
comes back. `/about` carries the site's only `ProfilePage` JSON-LD
(`components/SEOHead.tsx`); `/` carries a `WebPage` about the Person instead.
`test/about.test.ts` checks the built page and that no other sitemap page has a
`ProfilePage`. It is linked from the phone More sheet, the home fact card and a
top line on the 2022 post.

### Infrastructure page

`routes/infrastructure.tsx` (#295) is "How I run production": the three live
links first (dash., ci., meet., with one `infra-live-checked` note that carries
the date they last answered 200), then a map in plain HTML, a SmartLite block,
one open section per layer (job first, tool in parentheses), a "This site"
colophon, the workload rows, two catalog cards and the closing band.
`lib/infrastructure.ts` is the only list of the map's boxes, arrows (each with
its verb) and live links; the page, `llms-full.txt` and the `TechArticle`
`mentions` read it, and `lib/infrastructure.test.ts` fails on an arrow to a
missing box. Add an arrow only when it is true today; never link probe-home (503
whenever a home-lab service is down). The CI link is mig's public pipeline list
because the root of ci. asks for a GitHub sign-in. The colophon's "this build"
reads `BUILD_ID` like `routes/sw.js.ts`. Recheck the live links and bump the
`infra-live-checked` note's `checkedOn`.

### Services pages

`/catalog` ("Services" in the rail, H1 and breadcrumb) and `/catalog/<slug>`
(#271) keep their URLs. The item page has the project page's frame: the H1 and
the item's `outcome` as the lead, `components/ServicePriceCard.tsx` (built on
`FactCard`, first at 390px, sticky from 1024px: the price rows from
`priceRows()`, time, stack, the promises from `catalogPromises()`, Book and
"Send a written brief"), then the scope (included and not included side by
side), "How it starts" (`startSteps()`: Build and Strategy only), the
`alsoCovers` kinds of work as H3s whose ids are fragment targets, who it is for,
"Projects this fits", the work sold under it (`projectsForCatalog()` in
`lib/work.ts`, at most three `MoreWorkCard`s plus one `TestimonialCard`; none
for the strategy session, whose page would imply a client bought one), one "Next
step" link (`CatalogItem.next`) and the closing band. The index is a 2×2
comparison from 1024px, one details link per card. A retired slug answers 301 to
the fragment of the section that absorbed it, so `alsoCovers` ids and the
`how-it-starts` id must not change without editing `catalogRedirects`. The two
action wordings are `BOOK_LABEL` and `BRIEF_LABEL` in `ServicePriceCard.tsx`;
the brief link is `briefPath(slug)`. A promise shown for a service is the
owner's decision (`catalogPromises()`): the strategy session and the audit show
none until Anton says which apply. `test/services.test.ts` checks the built
pages.

### Project page

`routes/work/[slug].tsx` (#246) is a two-column case study from 1024px: a real
Literata `<h1>` with a small logo mark, the lead line under it (`projectLead()`
in `lib/llms.ts`: the `outcome`, or the description's first sentence, with its
`outcomeNote`), then the fact card (`components/ProjectFactCard.tsx`, sticky in
the right column, first at 390px) beside the main column: the screenshot gallery
as the hero, the pull quote, "What I built", "Client reviews", "Video" and "More
work" (`relatedProjects()` in `lib/data.ts`: three client projects ranked by
shared tags). A closing band on Desk ends the page with two promises through
`promise()`, Book, the catalog link and How I work. The band is
`components/ClosingBand.tsx`, shared with `/work`, which passes `/catalog` as
its catalog link and adds Infrastructure. Book appears twice, once in the card
and once in the band, and nowhere else on the page. `islands/ImageGallery.tsx`
renders the strip: slides sized by width with centre snap, captions from the
file names (`screenshotCaption()`, the same text as the `alt`), a "n / N"
counter, Previous/Next buttons from 1024px, and only the first image eager with
`fetchpriority="high"`. A margin note inside the narrow fact card uses
`WithNote`'s `note-stack` class, which keeps the note under its claim at every
width. `test/work-page.test.ts` checks the built pages.

A project logo drawn for a light background (a near-black wordmark, a navy mark)
gets `logoPlate: true` in `lib/data.ts`: the /work card and the project page
then render it on a light plate (`bg-parchment rounded-lg`). Today that is Roley
and Sogroya; `test/work-index.test.ts` pins that list across client projects and
tools. No per-project inline logo styles.

### Booking page

`/book` (#272, `routes/book.tsx`) is where every Book and brief action ends. Its
`<h1>` names the call (`Book a ${INTRO_CALL}`) and the calendar follows it:
`islands/MeetEmbed.tsx` has no click-to-load button any more. The server renders
a reserved placeholder (`data-meet-embed`, `INITIAL_EMBED_HEIGHT_PX` tall,
"Loading the calendar…"); after hydration the island attaches the `mig:height`
listener and then inserts the iframe, hidden until the first valid message; with
none within `EMBED_TIMEOUT_MS` (8 s) the box says the calendar didn't load and
offers the new-tab link and `#brief`. "Open the calendar in a new tab"
(`NEW_TAB_LABEL`) is the one wording for the scheduler's own page. A `FactCard`
side panel (portrait, `ROLE`, `TIMEZONE_LABEL`, email, Telegram, Upwork, the
invoicing line) sits beside the calendar from 1024px and after it at 390px; then
"After the call" (through `promise()`), the `roley-2` quote and the brief
(`#brief`). The brief's `LeadForm` gets `calendarAbove="#book"`, so its success
panel points up instead of rendering a second calendar; on `/` the success panel
mounts its calendar only after a submit, so a home view never loads the
scheduler. With `SCHEDULE_URL` unset the page leads with the brief.
`?service=<slug>` prefills the brief with "About: <shortTitle>" and posts the
slug, checked by `lib/lead.ts`'s `leadService()`; any other value is dropped,
never echoed. The prefill alone does not count as a description, in the form or
in `/api/lead` (`lib/brief-prefill.ts`). The page alone preconnects to the
scheduler's origin and carries the `ContactPage` JSON-LD node.
`test/booking.test.ts` checks the built page.

### How I work page

`routes/how-i-work.tsx` (#275) is the project page's frame: "How I work"
(`<h1>`, `lib/how-i-work.ts`'s name, subtitle, title and description), a sticky
card beside the main column (from 1024px; first at 390px) with the pricing rule
(`PRICING_RULE`, said once on the page), the four catalog prices through
`priceLabel()`, Book and "Send a written brief", then "Who this suits"
(`GOOD_FIT`/`NOT_A_FIT`, in Anton's #249 words) with one proof line
(`repeatClientsLine()` and the Job Success figure through `proof()`, with the
`upwork-profile` note), "Five promises" (H2, promises as H3) as
`PromiseTimeline variant="full" layout="stack"`, "My AI-agent setup" (one
paragraph, links `spy4x/dotfiles`) and the questions, open, each at `#faq-<id>`.
Book goes to `/book` and the brief to `/book#brief` (#272); the page has no
calendar embed. `lib/faqs.ts` is the only copy of the questions (at most
`MAX_FAQS`, seven): the page, the `FAQPage` JSON-LD (joined to the site graph)
and `llms-full.txt`'s FAQ section read it, and answers splice promises through
`promise()`. `PromiseTimeline` gained `layout` (`stack` keeps it vertical at
every width) and `links` (a quiet link under a `full` promise); `ClosingBand`
gained `bookHref` (an on-site Book target). `test/how-i-work.test.ts` checks the
built page. Still open with Anton (#301): how a client asks for the refund, and
what happens to client code with AI providers; the page says nothing about
either.

### Type

Literata 600 for headings — `h1`-`h3`, `.h1`, `.h2` in `assets/styles.css` set
`font-family: var(--font-heading)` directly, so a heading can't accidentally
render in a Tailwind utility's font: Tailwind wraps its own utilities in
`@layer utilities`, which always loses to unlayered CSS like this rule
regardless of selector specificity. IBM Plex Sans for body text, nav and
buttons. Literata italic for margin notes and the Cyrillic tool marks (the
`.margin-note` utility, wired up by `components/Note.tsx` since #186; the
Cyrillic tool marks are still a later redesign issue). Tabular figures for
prices, via `font-variant-numeric: tabular-nums` on the `.price` utility. IBM
Plex Mono only for `code`, `pre` and `kbd`. Plex Sans ships only the 400 and 600
weights: `font-medium` (500) has no file and renders as 400, so use
`font-semibold` for anything meant to look bold.

All three are self-hosted under `assets/fonts/` (Latin and Cyrillic subsets,
from `@fontsource`'s pre-split files — their `unicode-range` values are copied
verbatim; OFL licence files sit alongside the `.woff2` files), referenced from
`assets/styles.css` with a relative `url()` so Vite content-hashes them into
`/assets/*` the same as every other asset (see "Cache-Control headers" below for
why that matters) — never `static/fonts/`, which isn't Vite-processed.
`font-display: swap` plus the fallback faces below keep first paint fast and the
layout stable while the real fonts load.

**No `<link rel="preload">` for any font.** Measured, interleaved,
fresh-browser-per-sample (`scripts/lcp.ts --ab`) comparisons against
`origin/main` proved a font preload made the home page's LCP worse, under CPU
throttling and a throttled network alike, even deprioritized with
`fetchpriority="low"` — because the home page's actual LCP element is the hero
`<img fetchpriority="high">`, not text, and any early request competes with it
for bandwidth. The hard "LCP no worse than before" rule beats issue #184's
original preload suggestion here; see the #184 PR body for the numbers.

**Fallback faces use real metrics, not guesses.** Each web font is followed
immediately by its fallback face in the font stack
(`"Literata", "Literata
Fallback", serif`; same shape for Plex Sans), and each
fallback face lists several `local()` names so it actually resolves on more than
one OS (Georgia/Times New Roman/DejaVu Serif/Liberation Serif/Noto Serif for
Literata; Arial/Helvetica/Liberation Sans/DejaVu Sans/Noto Sans for Plex Sans).
The `size-adjust`/`ascent-override`/`descent-override`/ `line-gap-override`
values are computed with the same formula Fontaine/ next/font use, from each web
font's own OS/2 and hhea metrics (read straight from the `.woff2` files with
`npm:fontkit`) against Georgia's and Arial's published metrics
(`@capsizecss/metrics` — neither ships as a file this repo can read) — not
guessed. Measured under the slow-network profile below, layout shift from the
swap is effectively zero (cumulative layout shift ≈ 0.0004 on `/` at 390px).
`lib/csp.ts`'s `font-src 'self'` already covered same-origin font files —
self-hosting needed no CSP change.

### `scripts/lcp.ts`

`deno task lcp` (not part of `deno task check` — it needs a production build and
several seconds per sample) measures the home page's Largest Contentful Paint
(or the page `--path /work/smartlite` names), mobile viewport (390×844), in two
modes: `cpu` (4x CPU throttling only) and `network` (CDP
`Network.emulateNetworkConditions`, 150ms latency, 200 KB/s down/up, service
worker blocked so every sample is a genuine first load) — both by default, since
a regression can show up in only one of them. Reports every sample plus the
median, min and max.

`--ab <dirA> <dirB>` compares two already-built site directories (each needs its
own `deno task build` first) instead of only the current worktree — alternating
samples between them with a _fresh_ Chromium instance and a fresh server process
per sample, not two long-lived servers measured back-to-back, so a slow run
doesn't make whichever build was measured second look artificially better or
worse (confirmed necessary: measuring the same commit twice in separate batches
gave different medians before this mode existed). This is the reliable way to
compare a branch against `origin/main`: clone or `git worktree add` a copy of
`main`, build it, then `deno task lcp --ab <main copy> <this worktree> --n 15`,
adding `--path <page>` for a page other than `/`.

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
  "Content-Security-Policy" below) actually holds in a real browser —
  `securitypolicyviolation` events, not just the header's text — across every
  static page and one representative page per dynamic route, the `/book` booking
  calendar's runtime `<iframe>`, and a full unsubscribe link (GET the confirm
  page, POST the form). Two negative controls prove the listener and the policy
  do something: an inline `<script>` with no `nonce` is blocked and reported,
  and an iframe to a disallowed origin is reported. Served with placeholder
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
  no CSP violation. `test/no-emoji.test.ts` (not browser-driven — a plain
  `startSite()` + `visibleText()` check, like `test/rendered.test.ts`) walks
  every page in `/sitemap.xml` plus `/pay` for `\p{Extended_Pictographic}`
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
- `test/analytics.browser.test.ts` (#318): `post-read` counts once, only when
  the end of a post has been on screen and 15 s have passed (Playwright's fake
  clock), and the not-found page counts `not-found`. It, `lead-form` (brief
  events) and `meet-embed` (calendar and booking events) replace Umami with
  `test/browser.ts`'s `recordUmami()` and read the calls with `trackedCalls()`.

## Analytics

`lib/analytics.ts` is the only list of Umami events (#318): `ANALYTICS_EVENTS`
is a closed list, and detail goes into `data-umami-event-<key>` properties
(`place`, `item`, `to`, `target`, `field`, `reason`, `service`), never into the
name, so Umami can add up every Book click across pages. A link or button
spreads `eventAttrs(name, props)`; `linkEvent(href, props)` picks `outbound`,
`brief`, `book` or `cta` from the href (the closing band and the promise
timeline use it); an island calls `track()`, which never throws. Never write a
`data-umami-event` string or call `umami.track` by hand.
`test/analytics.test.ts` fails on any event, property or `place` outside the
list on every sitemap page, `/pay` and a not-found page.

Outcomes are tracked where they happen: `islands/LeadForm.tsx` sends
`brief-sent` (with `service`) only after `/api/lead` accepted the brief and
`brief-error` (`reason` `invalid` or `server`) otherwise, the submit click is
not an event; `islands/MeetEmbed.tsx` sends `calendar-shown` on the first valid
`mig:height`, `calendar-failed` on the timeout and `call-booked` for each
`{ type: "mig:booked" }` message under the same origin and `event.source` guard
as `mig:height`; `islands/NewsletterForm.tsx` sends `newsletter-signup`;
`islands/PostRead.tsx` sends `post-read`; `components/NotFound.tsx` sends
`not-found` through `islands/TrackPageEvent.tsx`. Links to other sites inside a
post get `outbound` from `lib/markdown.ts`.

`routes/_app.tsx` loads no tracker for crawlers or on `UNTRACKED_PATHS`
(`/unsubscribe` and `/subscribe/confirm`, whose URLs carry a token, and `/pay`),
and `scripts/staging-env.ts` blanks `UMAMI_ID`, so staging reports nothing.
`routes/privacy.tsx` describes exactly this; change it together with the code.

## Content-Security-Policy

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
`test/csp.browser.test.ts` (see "Browser-driven tests" above) is the
complementary real-browser check: that the policy is actually _enforced_, not
just present and internally consistent.

## Newsletter subscribers & unsubscribe links

`lib/subscribers.ts` owns the subscriber list (`SUBSCRIBERS_FILE`, default
`data/subscribers.json`) — `routes/api/subscribe.ts`, `routes/unsubscribe.tsx`
and `scripts/send-newsletter.ts` all read and write through it, never the file
directly. Every change is `updateSubscribers(change)`: one read-change-write
under an in-process queue and the lock file `subscribers.json.lock`, written by
temp file and `rename` (#254), so a full disk or a crash never leaves a torn
list. A file that does not parse as a list is an error, never an empty list: its
text is copied to `subscribers.json.invalid`, every read and write fails with
500, and nothing overwrites it until a person repairs the file.
`lib/unsubscribe.ts` signs and verifies unsubscribe tokens with the ts-libs
signed payload codec (`jsr:@spy4x/platform/signed-payload`: purpose
`unsubscribe`, version 1, empty payload, the normalized address as bound
context, so the token holds no address); the pre-#233 bare-signature format is
no longer accepted (#237). The key is `UNSUBSCRIBE_SECRET` (`lib/config.ts`'s
`getUnsubscribeSecret()` throws if it's unset, under 32 characters or not
printable ASCII — generate one with `openssl rand -base64 48`, see
`.env.example`) and its `unsubscribeLink()` is the one helper every outgoing
email uses to build `${BASE_URL}/unsubscribe?token=...`.
`routes/api/unsubscribe.ts` only redirects old `?email=...` links (sent before
#177) to `/unsubscribe`, dropping the address; opening a link never removes
anyone — only a `POST` to `/unsubscribe` with a verified token does. See
docs/newsletter.md for the full data format and endpoint list.

The email field of `/api/subscribe` and `/api/lead` goes through
`lib/email-field.ts`'s `bareAddress()` (`@spy4x/email`'s `isAddress()`, #255):
only a bare address of at most 254 characters, with a local part of at most 64,
passes, so a display name, `<`, `>` or `"` answers 400, and only the bare
address is stored or mailed. `lib/newsletter.ts` applies the same check to every
stored row before it mails it: a row that fails (one stored before #255) is
skipped, counted as failed and logged by row number only. `/api/subscribe`
answers a known address exactly as a new one, so it cannot test who is on the
list.

Every POST route reads its body through `lib/request-body.ts` (#251), which
wraps `@spy4x/net/bounded-body` (forms: `@spy4x/server/http/bounded-body`'s
`parseBoundedFormData`): never call `req.json()` or `req.formData()` directly,
since they buffer the whole body. The caps are 4 KiB for `/api/subscribe` and
`/unsubscribe` and 64 KiB for `/api/lead`; a larger body gets 413 and a body
that stalls for 10 s gets 408. `/unsubscribe` reads no body at all when the
token is in the query, so a one-click unsubscribe (RFC 8058) works with any
body.

`/api/subscribe` and `/api/lead` allow three posts per client per hour through
`lib/rate-limit.ts` (#252), which uses `@spy4x/platform`'s `clientIp`,
`clientIpBucket` and sweeping `createMemoryRateLimiter` (#310). Production is
Cloudflare → Traefik (empty `forwardedHeaders.trustedIPs`) → app, so the client
is `X-Real-IP` (Traefik writes it), or `CF-Connecting-IP` when `X-Real-IP` is a
Cloudflare edge (`clientIp`'s `trustedProxies`, fed the module's Cloudflare
range list); `X-Forwarded-For` is never read, and a header that is not exactly
one IP address counts as absent. An IPv6 client is keyed on its /64. If
Traefik's `trustedIPs` or the Cloudflare setup changes, revisit that module. A
rendered-site test that posts to either form sends its own `X-Real-IP`, or every
test shares one bucket.

## Outgoing mail

Every mail the site sends goes through `@spy4x/email` (`jsr:@spy4x/email`,
pinned exactly in `deno.json`); nothing in the repo talks SMTP by hand.
`lib/mail.ts` maps the `SMTP_*` env values onto it: SMTP counts as configured
only when `SMTP_HOST`, `SMTP_USERNAME` and `SMTP_PASSWORD` are all set,
`SMTP_FROM` falls back to `SMTP_USERNAME`, and the connection is implicit TLS on
every port, as the old hand-written client was. EHLO announces the site's own
hostname (from `DOMAIN`). `lib/lead-mail.ts` (`/api/lead`), `lib/subscribe.ts`
with `lib/subscribe-mail.ts` (`/api/subscribe`) and `lib/newsletter.ts`
(`scripts/send-newsletter.ts`) build the messages and log a failed send instead
of throwing; a send counts as done only when the relay accepted it. Their tests
pass a fake transport from `test/fake-mail.ts`, so no test opens a connection.

Replies (#266): lead mail sets `Reply-To` to the visitor, and the confirmation
mail, the welcome mail and every newsletter set it to `CONTACT_EMAIL`, because
the mailbox they are sent from is noreply. A lead whose send failed is appended
to `data/leads-failed.jsonl` (`lib/failed-leads.ts`) and the log says only that
it was kept. The `noreply` password is shared with mig and must rotate in both
places together (`docs/deploy.md` "Shared mail password").

Sign-up is double opt-in (#253): `/api/subscribe` only mails a signed
confirmation link (`lib/subscribe-token.ts`, purpose `subscribe-confirm`, valid
three days) and stores nothing; `/subscribe/confirm` shows the address on GET
and adds it on POST (`lib/subscribe.ts`'s `confirmSubscription`), then the
welcome mail goes out. `lib/csrf.ts` answers 403 to a cross-site POST on
`/api/subscribe`, `/api/lead`, `/unsubscribe` and `/subscribe/confirm`, with the
site's own `BASE_URL` as the allowed origin. `/subscribe/confirm` is in
`UNTRACKED_PATHS` (its URL holds the address). Both it and `/unsubscribe` send
`Referrer-Policy: no-referrer`, and the confirming POST answers 303 to
`/subscribe/confirm?done=1`, so no token reaches the next page as a referrer.

## Publishing a blog post

`docs/publishing.md` is the whole flow, from "I want a blog post about X" to a
live post: a brief that judges the post as an SEO specialist, a marketer, a
psychologist and a personal-brand adviser against the goals above, a draft in
Anton's voice (`docs/voice.md`, learned from the five oldest posts), a pull
request with the post file and its front matter (no `lib/data.ts` entry: the
metadata is read from the file), review, merge, deploy, then
`deno task publish:blog <slug>`. That script writes no file: it checks the post
answers 200 live, creates the Dev.to draft and prints every channel's tagged
link and the newsletter preview. Three hard rules:

- **Agents never post to X, LinkedIn, Reddit or Hacker News.** They write one
  text per channel with its tagged link and show it in chat; Anton pastes it.
- **The newsletter is sent only after the post is live and only when Anton says
  yes in chat to that post** —
  `deno task publish:blog <slug>
  --send-newsletter`. The production container
  refuses a slug already in its sent log, `data/newsletter-log.json`.
- **Dev.to gets an unpublished draft only.** Anton publishes it himself.

## Analytics

`docs/analytics.md` holds the Umami event names and properties, the saved
reports `deno task umami-reports` keeps, and where nothing is sent.

## Tagged links

Never hand-write a tagged (UTM) URL. `deno task links <path> [--campaign …]`
(optionally `--content …`) prints a page's tagged URL for every channel, and
`launch-kit`, `video-kit` and `publish:blog`'s Dev.to draft build theirs from
the same channel table in `scripts/utm.ts`. The convention, the campaign names
and the log of campaigns already used are in `docs/utm.md`; its channel table
must match the code's (`scripts/utm.test.ts` checks it).

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

Cache policy lives in `lib/cache-control.ts`'s `cacheControlFor()`, a pure
function unit-tested in `lib/cache-control.test.ts`, applied to every response
by `main.ts`'s cache middleware. `fetch()` drops a `Host` header, so
`test/unsubscribe.test.ts` checks the staging wiring with a raw HTTP request
instead. `/sw.js` (the retired worker) sets its own header in `routes/sw.js.ts`.
When adding or changing routes, add a new core page to `lib/pages.ts` (see "Site
frame"): its `CORE_PAGES` set and the sitemap both read that one list.

Cache tiers:

| Tier              | Duration                        | Targets                              | Use case                                                      |
| ----------------- | ------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Immutable         | 1 year (`max-age=31536000`)     | `/assets/*`, `/_fresh/*`             | Content-hashed files (fingerprint = immutable)                |
| Images and static | 7 days + stale-while-revalidate | `/img/*`, favicons, `/manifest.json` | Photos, illustrations, small root files (rarely change)       |
| Core pages        | 3 days + stale-while-revalidate | `CORE_PAGES` set                     | SSR pages that update every few days                          |
| Tools pages       | 1 hour + stale-while-revalidate | `/tools`, `/tools/*`                 | Versions, stars and CI status the server refreshes hourly     |
| No cache          | `no-cache, must-revalidate`     | `/sw.js`                             | Set by `routes/sw.js.ts` (byte-for-byte PWA update detection) |

Error responses (status ≥ 400) are never cached, regardless of which tier the
path would otherwise fall into — a 404 must not survive in a browser or at the
edge once the page comes back. A route that sets `no-store` itself (for example
`routes/unsubscribe.tsx`, which shows one subscriber's address) keeps it on
staging and production alike.

**A static-file tier always wins over Fresh's own default, even when `current`
already says `no-store`** (#183 follow-up, fixed alongside #184): Fresh's
`staticFiles()` middleware stamps a plain `Cache-Control: no-store` on any
static file it doesn't itself recognise as content-hashed — which, before this
fix, silently meant `/fonts/*` (self-hosted under `assets/fonts/`, Vite
content-hashes them into `/assets/*` — see "Visual system" above), `/img/*`,
favicons and any unstamped `/_fresh/*` JS chunk never got their real tier,
because `cacheControlFor()` checked "does the response already say no-store?"
_before_ checking whether the path was a recognised asset/image/static file.
`cacheControlFor()` now checks the asset/image/static-root-file tiers first;
only a path that doesn't match any of them still respects an existing `no-store`
(which is how a route's own deliberate one, like `routes/unsubscribe.tsx`'s,
keeps winning). `lib/cache-control.test.ts` pins both directions: a hashed
font/image/favicon/JS chunk gets its tier even when `current` is already
`"no-store"`, and `/unsubscribe` keeps `no-store` regardless.

Staging answers every response with `X-Robots-Tag: noindex,
nofollow`;
production sends `noindex` for any status ≥ 400 and `noindex, nofollow` for
`/pay` and `/unsubscribe` (`routes/_middleware.ts`).

## OG link-preview images

`scripts/og-images.ts` generates the 1200×630 PNGs committed under
`static/img/og/`: one per blog post (`blog/<slug>.png`), one per project page
(`projects/<slug>.png`), one per tool page (`tools/<slug>.png`) plus the hub
(`tools.png`), one for `/about` (`about.png`), and one landscape default for the
site (`default.png`, `lib/head.ts`'s `DEFAULTS.ogImage`) — replacing the SVG
covers and the old 1200×1800 portrait photo, none of which LinkedIn, X, Facebook
or Slack render as a link preview. It renders each PNG from the post/project
title and description already in `lib/data.ts`, never from the committed cover
SVGs, through the Chromium already pinned for the browser-driven tests
(`test/browser.ts`'s `launchChromium()`) instead of adding a new image-rendering
dependency.

Regeneration is one command: `deno task og`. Run it whenever a post or project
title or description changes, then commit the changed PNGs — for example after
#201 renames the mig post from "200-line" to "lightweight". This script is
dev-machine only: the production Docker build (`denoland/deno:2.9.0`, no
Chromium) never runs it, it only serves the PNGs already committed.
`test/og-images.test.ts` guards that every post and project has its PNG at
exactly 1200×630, reading each file's PNG header directly — deterministic and
offline, no browser needed to run the check itself.

## Image metadata

Every image committed under `static/` or `assets/` ships without metadata: no
EXIF or XMP in a WebP, no text, time or EXIF chunk in a PNG, no editor stamp in
an SVG (a generator comment, `<desc>Created with …</desc>` or a `<metadata>`
block). The tools that made them left camera and software names, dates, a local
file path and app build ids, which every visitor downloaded (20 KB on the hero
photo alone). Run `deno task strip-metadata` after adding or replacing any
image, or `deno task strip-metadata <file>...` for just those files, and commit
the result. It removes whole metadata chunks only; pixel data and colour
information (ICC profiles, gamma, sRGB) are copied byte for byte, so the image
looks the same. `test/asset-metadata.test.ts` fails on any image that still
carries metadata. `deno task og` and `deno task optimize:screenshots` re-encode
from pixels and add none, so only hand-added files need the step. Fonts keep
their name table: it holds the OFL licence.

## Redirect table

`lib/redirects.ts` holds the one 301 table (#188) for URLs that no longer exist
as written: the old `/projects` section (`/projects` goes to `/work`, and each
`/projects/<slug>` goes to `/work/<slug>` for a client project), the nine own
projects that moved to `/tools` in #273 (`/work/<old>` and `/projects/<old>` go
to `/tools/<new>`, `lib/tools.ts`'s `movedSlugs`; `todoapp-caldav` became
`caldav-tasks-web`), the retired `/projects/homelab` (to `/tools/rostok`) and
blog slugs retired by a rename (today: the CalDAV post). Every old path is
listed with and without a trailing slash, so both land in one hop, and no entry
points at another redirect. A `/projects/<x>` with no new home is not in the
table and answers 404. Besides the table, a trailing slash on any
`/blog/<slug>`, `/work/<slug>` or `/tools/<slug>` URL redirects to the
slash-free form. An old `/blog?tab=<x>` link (the retired tab filter) answers
one 301 to `/blog`, keeping any other parameters: `lib/redirects.ts`'s
`blogTabRedirect()`, called from `routes/blog/index.tsx`'s handler, since it
depends on the query rather than the path. `redirectTarget()` is a pure
function, unit-tested in `lib/redirects.test.ts` without a server — the same
pattern as `lib/csp.ts` and `lib/cache-control.ts`; `test/structure.test.ts`
checks every old URL on the built site (one 301, query string kept, a 200 behind
it), and its internal-link crawl fails on any link that the table would
redirect. `main.ts` wires it as its own middleware, placed after the CSP and
cache middlewares but before `staticFiles()`/`app.fsRoutes()`: a redirect
response still needs the CSP and cache headers every other response gets, and it
gets them because those two middlewares set headers on whatever `ctx.next()`
resolves to, which is this middleware's response when it doesn't call
`ctx.next()` itself. It appends the request's query string to the target, so
launch links keep their UTM tags.

## Shared libraries

Before writing a component, helper or library here, search
[spy4x/ts-libs](https://github.com/spy4x/ts-libs) and
[spy4x/preact-components](https://github.com/spy4x/preact-components) for it.
The global rule
["Shared libs before local code"](https://github.com/spy4x/dotfiles/blob/main/ai-harnesses/AGENTS.md)
says what belongs in each library; code only this repo needs stays here.

The audit of what this repo still keeps locally is the table on issue #195 (a
comment starting `<!-- agent -->`). Already imported from `@spy4x/platform`:
`breadcrumbListJsonLd` (`components/SEOHead.tsx`, fed by `getBreadcrumb()`),
`copyToClipboard` (`islands/CopyButton.tsx`, `islands/BlogImageEnhancer.tsx`),
`sleep`, and the time constants; `lib/blog.ts` reads `@spy4x/time/locale`'s
`dayLabel` and `monthLabel`. `toJsonLd` stays because `jsonLdText` escapes only
`<`. The `@spy4x/preact-*` components are not adopted yet (part 2 of #195); do
not add a second local copy of a component they hold.
