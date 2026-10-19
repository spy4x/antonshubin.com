# AGENTS.md — antonshubin.com

Read `README.md` first. The global agent instructions own Git Flow, review and
cleanup; this file adds what is specific to this repo.

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

## Designing a page

Every new page, and every redesign of a page a visitor uses to decide (home,
work, services, booking, tools, writing, how I work), goes through the global
`design` skill before any code: the expert roles in parallel, one merged spec
with wireframes at 390px and 1440px on the issue, then one implementer and the
design gate. #246 and PR #258 are the worked example. A small fix, such as a
bug, a wording change or one element, follows the rule for small changes in the
global `AGENTS.md` section "Design".

What this site adds to that flow:

- **The page's issue.** It holds the page's job (what a visitor must believe and
  then do), the sample URLs to review, and its order against any feature issue
  that touches the same route. That feature issue keeps its content bullets; its
  layout bullets are input for the design roles, not decisions.
- **The designer's brief** frames the role as a senior product designer of
  modern developer portfolios and SaaS case-study pages.
- **Facts only Anton can supply** go into a separate content issue, and the page
  ships with today's wording meanwhile.
- **Serving the site for screenshots.** `deno task build` in a throwaway
  worktree, then a throwaway script that uses `test/harness.ts`'s `startSite()`
  and `test/browser.ts`'s `launchChromium()` to capture the pages at 390px and
  1440px, closing the browser and server in a `finally`.
- **Reuse before drawing.** `FactCard`, `PromiseTimeline`, `ClosingBand`,
  `ProjectFactCard`, `ImageGallery` (the library's strip, below),
  `ProjectReviews`, `StatusMark` and `Button` come before a second copy.
- **Tests guard the structure:** the H1, the first-screen elements, the JSON-LD,
  and axe plus no horizontal scroll at 390px and 1440px in a browser test.

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
├── docs/           # Reference docs (see below)
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
deno task test                  # build, then deno test (see docs/testing.md)
deno task test:browser          # Playwright lead-form, a11y, contrast, CSP, retired-service-worker, visual-system, notes, meet-embed, blog-overflow, safe-area and tool-frame tests; needs a built site and Chromium
deno task dev                   # dev server (Vite, HMR)
deno task build                 # production build (Vite)
deno task start                 # run the production server
deno task update                # update Fresh
deno task deploy                # production → antonshubin.com
deno task env:encrypt           # every .env* → its .env*.age (age64)
deno task env:decrypt           # every .env*.age → its plaintext (age64)
deno task env:status            # key presence + which env/age files exist
deno task publish:blog          # after deploy: live check, Dev.to draft, links; --send-newsletter only on Anton's yes
deno task launch-kit            # draft a repo launch's Reddit/HN/LinkedIn/Dev.to/YouTube posts
deno task video-kit             # transcript → titles, description, chapters, blog draft
deno task weekly-numbers        # Umami/GitHub/YouTube numbers → markdown + NTFY
deno task umami-reports         # create, update or retire the Umami goals and funnels (--dry-run to preview)
deno task optimize:screenshots  # compress portfolio screenshots
deno task og                    # regenerate the 1200x630 OG link-preview PNGs
deno task social-preview        # build, then regenerate docs/social-preview.png (1280x640, GitHub)
deno task lcp                   # home page LCP, CPU + network modes, n=15 (needs a build; --ab for A/B, --path for another page)
deno task strip-metadata        # strip EXIF/XMP/text chunks from every image under static/ and assets/
```

`deno task check` fails on a failing test, same as a lint or type error — a red
test blocks the merge exactly like a red lint.

## Environment setup for a new worktree

The age decrypt key is not part of this repo. Encryption is
`@spy4x/server/env-age64` (jsr:@spy4x/server@1.37.0/env-age64), per-value age64
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
container does not need it. The same file holds `DEVTO_API_KEY` for
`publish:blog`'s Dev.to draft, read locally the same way. See `docs/deploy.md`
"Cloudflare purge after a deploy".

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

## Reference docs

- Before changing a catalog item, a price or the role label, read
  [docs/catalog.md](docs/catalog.md).
- Before changing an Upwork figure, a promise, a testimonial or a margin note,
  read [docs/proof.md](docs/proof.md).
- Before changing `/tools` or `lib/tools.ts`, read
  [docs/tools-registry.md](docs/tools-registry.md).
- Before changing CI or adding a test, read [docs/testing.md](docs/testing.md).
- Before changing analytics events, read [docs/analytics.md](docs/analytics.md).
- Before changing the Content-Security-Policy, read [docs/csp.md](docs/csp.md).
- Before changing the mailing list, the forms that post to the site or outgoing
  mail, read [docs/newsletter.md](docs/newsletter.md).
- Before publishing a blog post, read [docs/publishing.md](docs/publishing.md).
- Before making a tagged (UTM) link, read [docs/utm.md](docs/utm.md).
- Before changing routes, content or positioning, read
  [docs/seo-ai-crawlers.md](docs/seo-ai-crawlers.md).
- Before changing cache headers, read
  [docs/cache-control.md](docs/cache-control.md).
- Before changing OG images, screenshots or any committed image, read
  [docs/images.md](docs/images.md).
- Before changing redirects or retiring a URL, read
  [docs/redirects.md](docs/redirects.md).

## Navigation

`lib/nav.ts` is the only list of navigation destinations (#185): the desktop
rail, the phone tab bar, the phone More dialog and the footer's Site group all
read it, so changing a destination is one entry there. `components/Nav.tsx`
renders `@spy4x/preact-system`'s `Rail` in its labels variant (#433), an 88px
column of 80px cells with the same current fill as the apps, on the server with
no island: More opens its `<dialog>` through the button's `command`/`commandfor`
invoker, and a backdrop tap closes it through `closedby="any"`. The column holds
the portrait with "Anton" (a `RailEntry` in the `top` slot, linking home), Book,
then `railItems`; the phone tab bar holds Work, Services, Book in the centre,
Tools and More. There is no Links control (#293): More lists pages only (Home,
About, How I work, Writing, Infrastructure), and the profiles and feeds live in
the footer. Home, About and Infrastructure are `sheetOnly` items, so More is
marked current on their pages. The icons come from `@spy4x/preact-icons`. Keep
the markup small, because under `scripts/lcp.ts`'s network profile every extra
KB on every page measurably delays the home page's LCP image. The phone header
(photo, name, and `ROLE` on the right) is plain markup in
`components/Layout.tsx`; the time zone is in the footer. Book goes to `/book` in
the same tab and carries `data-primary-book`; with `SCHEDULE_URL` unset it reads
"Write" and goes to that page's written brief (`/book#brief`). The footer's
Contact group links the same page. `test/nav.test.ts` checks both on every page.

## Site frame

The frame is what every page shares (#293). `components/Layout.tsx` renders the
nav, which owns `<main>`, and puts the phone header and the page
(`#main-content`) inside it; `components/Footer.tsx` goes in the `Rail`'s
`footer` slot, after `<main>`, so it keeps its `contentinfo` landmark. The
footer is plain server markup on Desk with five parts: identity (name, `ROLE`,
`LOCATION` and `TIMEZONE_LABEL`, the NeatSoft invoices sentence) and four
labelled lists, Site (`lib/nav.ts`'s `siteItems` plus Privacy), Contact,
Elsewhere and For machines. At 390px the tab bar is a sticky dock after the page
and the footer, so nothing needs bottom padding to clear it.

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
- `routes/privacy.tsx` says only what the code proves, plus Anton's own
  retention rule and mail server (#301), in "How long things are kept". Change a
  sentence only together with the code or the rule it describes.
- The site-wide skip link is the `Rail`'s, worded "Skip to main content". It is
  hidden by `routes/_app.tsx`'s inline critical CSS, whose unlayered `.sr-only`
  rule would beat Tailwind's layered `focus:not-sr-only`. That rule is
  `.sr-only:not(:focus)` for this reason; `test/frame.browser.test.ts` checks
  the link shows when focused.

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

`components/Button.tsx` is the one button component: a thin adapter over
`@spy4x/preact-ui/button`'s `Button` (#371), rendered with `size="none"`, so the
library adds no padding, gap or text size and every call site sizes its own
button through `class`. `variant` defaults to `secondary` (the library's `ghost`
plus a Rule strong border: the library's `outline` fills itself with Paper);
`variant="primary"` (the accent fill, Ink text) is reserved for the Book action,
and a primary button carries `data-primary-book` — the marker
`test/visual-system.browser.test.ts`'s "the accent colour is a background only
on the primary button and the nav's Book" guard looks for, instead of guessing
from text content or element shape. With `href` it renders an `<a>`, without one
a `<button type="button">`. The library appends a caller's classes after its own
instead of merging them, so `SITE_VARIANT` replaces the library's `rounded-md`
with `rounded-lg!` (important; no call site sets a radius), and the library's
`font-medium` already renders 600 here (below). Never add a second class for a
property the library sets without `!`: two Tailwind classes for the same
property in one `class` attribute resolve by their order in the compiled
stylesheet, not in the attribute. `components/BookCallLink.tsx` (every "Book a
call" link on the site) renders this `Button`, to `/book` in the same tab unless
the page passes its own `href` (#387: never the scheduler, never
`target="_blank"`), and renders nothing while `SCHEDULE_URL` is unset unless a
page passes its own `href` (`test/action-wording.test.ts` checks every
`data-primary-book` link). `buttonClass(variant, extra)` is the same class
string for an element that is not a `Button`: a few plain links. The library
composes classes with `join`, not `cn()`, so an island that renders or imports
it ships no tailwind-merge. Never call `cn()` (tailwind-merge, about 28 KB) from
code an island imports; use it only in server-rendered components.
`test/library-classes.test.tsx` fails when a site button carries the library's
default size or fill, when one of the library's `dark:` classes gets a rule
(Tailwind's `dark:` follows the system theme and the site maps no accent step
600 or 700), or when tailwind-merge reaches a client chunk.

The library's components are coloured by the `:root` block under `@theme` in
`assets/styles.css`: each library token (`--color-surface`, `--color-success`,
`--color-accent-900`, ...) points at a site token, so `@theme` stays the only
place a colour is written. The selection tokens (`--color-selected*`) are Lamp
and Parchment, never the accent, and the focus ring (`--color-ring`) is
Parchment. `vite.config.ts` splices the library's `preset.css`'s "Colour atoms"
section into the stylesheet (in reference mode); its `tokens.css` is not
imported: since 2.0.0 it sits in a layer under `@theme` and no longer overrides
the site, but the site maps every token it reads anyway, and the file added 10.6
KB to the built stylesheet. Tailwind never scans the library, so
`assets/styles.css` lists the classes of the modules the site uses in
`@source inline(...)` lines; `test/library-classes.test.tsx` fails when a class
a library component renders has no rule. `--font-weight-medium` is 600, since
Plex Sans has no 500 file.

`@spy4x/preact-ui/status-mark`'s `StatusMark` renders a shape plus a word for a
project or tool status (`in-use`, `ready`, `beta`, `wip`, `paused`, `archived`,
`outcome`, `known-issue`, `live`, `offline`) — never colour alone; the tone
colours the shape only, and the word keeps the surrounding text colour. Used on
`routes/work/index.tsx`, the tools pages, the home page and in the project
page's fact card (`components/ProjectFactCard.tsx`: live, offline or archived).
`components/CiPill.tsx` draws it inside the library badge's grey pill.

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

`routes/infrastructure.tsx` (#295, layout #344) is "How I run production" in the
project page's two columns: the claim and the three live links (dash., ci.,
meet., with one `infra-live-checked` note that carries the date they last
answered 200) on the left, the sticky "This site" card with Book and the brief
on the right. Below it come the map, "Your cloud is fine too" (SmartLite is the
Managed cloud card's example), "How risk is controlled" (four blocks) and the
closing band, which holds the two catalog cards. Book appears in the card and
the band only, and goes to `/book`. `lib/infrastructure.ts` is the only list of
the map's boxes, arrows (each with its verb), lanes (`infraLanes`, two to four
boxes each, neighbours must share an arrow), the four blocks (`infraLayers`) and
the live links; `components/InfraMap.tsx` draws the lanes as one piece of server
HTML (boxes are links with `data-infra-node`, connectors carry
`data-infra-edge`, the verb is visible text, the arrow is decorative). The page,
`llms-full.txt` and the `TechArticle` `mentions` read the lists, and
`lib/infrastructure.test.ts` fails on an arrow to a missing box or a lane
neighbour with no arrow. Add an arrow only when it is true today; never link
probe-home (503 whenever a home-lab service is down). The CI link is mig's
public pipeline list because the root of ci. asks for a GitHub sign-in. The
colophon's "this build" reads `BUILD_ID` like `routes/sw.js.ts`. Recheck the
live links and bump the `infra-live-checked` note's `checkedOn`.

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
action wordings are `BOOK_LABEL` and `BRIEF_LABEL` in `lib/nav.ts` (see "Booking
page"); the brief link is `briefPath(slug)`. A promise shown for a service is
the owner's decision (`catalogPromises()`): the strategy session and the audit
show the refund only (#301). The paid session is booked through the brief,
because mig takes no payment: its "How it starts" is brief, invoice, call,
notes. `test/services.test.ts` checks the built pages.

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
is a thin wrapper over `@spy4x/preact-ui/image-gallery`'s
`ImageGallery layout="strip"` (#396), which holds all the gallery behaviour:
slides sized by width (narrower for a portrait first image) with centre snap,
visible captions that equal the `alt` (`screenshotCaption()`), a "n / N"
counter, named Previous/Next buttons that show only while the row overflows,
`width`/`height` on every image so nothing shifts, and only the first image
eager with `fetchpriority="high"`. The wrapper exists because function props
(`label`, `counterLabel`) cannot cross an island boundary; it also maps `.png`
sources to their WebP. The strip's classes are in `assets/styles.css`'s
`@source inline` lines, and `test/library-classes.test.tsx` renders the strip
and its lightbox. A margin note inside the narrow fact card uses `WithNote`'s
`note-stack` class, which keeps the note under its claim at every width.
`test/work-page.test.ts` checks the built pages.

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
`test/booking.test.ts` checks the built page. The page was `/contact-me` until
#190; that URL answers one 301 to `/book` (see "Redirect table" in
docs/redirects.md).

**One wording per action (#190).** Every link or button that books the call says
`BOOK_LABEL` ("Book a free 30-minute call") and every one that opens the brief
says `BRIEF_LABEL` ("Send a written brief"), both in `lib/nav.ts` next to
`BOOK_HREF` and `WRITE_FALLBACK_HREF`; inside a sentence they are spliced
through `decapitalize()`. Only the nav says it shorter (`NAV_BOOK_LABEL`,
"Book"), "Write" (`NAV_WRITE_LABEL`) replaces Book when `SCHEDULE_URL` is unset,
and `NEW_TAB_LABEL` is the scheduler's own page. Headings and prose that name
the call use `INTRO_CALL`. `test/action-wording.test.ts` scans every sitemap
page, `/pay`, a not-found URL and both llms files, and fails on any other
wording; its `EXCEPTIONS` list names each deliberate one with its reason and
fails when one is no longer on its page.

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
`MAX_FAQS`, eight): the page, the `FAQPage` JSON-LD (joined to the site graph)
and `llms-full.txt`'s FAQ section read it, and answers splice promises through
`promise()`. `PromiseTimeline` gained `layout` (`stack` keeps it vertical at
every width) and `links` (a quiet link under a `full` promise); `ClosingBand`
gained `bookHref` (an on-site Book target). `test/how-i-work.test.ts` checks the
built page. The refund answer says how to ask for it, and "Does my code go to an
AI provider?" (`#faq-ai-and-your-code`, linked from the AI paragraph) says yes
without naming a provider or claiming it doesn't train on the code (Anton,
#301): add either only once Anton confirms it.

### Tool pages

Every `/tools/<slug>` page is built on the shared frame in
`components/tool-frame/` (#454). The frame renders the top line and the claim
`<h1>`, the hero clip or still, the page's middle, the "Tool facts" card with
"Use it if", "Skip it if" and the story, the "Two ways to use it" band with the
body's only Book, and three "More tools" (`MORE_TOOLS` in `ToolMore.tsx`). A
custom page is `routes/tools/<slug>.tsx`, which Fresh matches before
`[slug].tsx` (the page of every other tool); it renders `ToolFrame` with its own
middle as children. Demo clips are in `static/video/tools/<slug>/`
(docs/images.md "Videos") and are served with byte ranges by
`lib/video-files.ts`. Each page's events are listed in docs/analytics.md "Tool
pages". The shared checks are `test/tool-frame.ts`'s `assertToolFrame()` and
`toolPageProblems()`. The API is in docs/tools-registry.md "The tool frame".

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
`/assets/*` the same as every other asset (see "Cache-Control headers" in
docs/cache-control.md for why that matters) — never `static/fonts/`, which isn't
Vite-processed. `font-display: swap` plus the fallback faces below keep first
paint fast and the layout stable while the real fonts load.

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

## Shared libraries

The audit of what this repo still keeps locally is the table on issue #195 (a
comment starting `<!-- agent -->`). Already imported from `@spy4x/platform`:
`breadcrumbListJsonLd` (`components/SEOHead.tsx`, fed by `getBreadcrumb()`),
`copyToClipboard` (`islands/CopyButton.tsx`, `islands/BlogImageEnhancer.tsx`),
`sleep`, and the time constants; `lib/blog.ts` reads `@spy4x/time/locale`'s
`dayLabel` and `monthLabel`. `toJsonLd` stays because `jsonLdText` escapes only
`<`. Part 2 of #195 moves the components to `@spy4x/preact-*` (all ten packages
pinned together, exactly): `Button`, `StatusMark`, the CI pill's badge and `cn`
so far (see "Visual system"); the rest follow. Do not add a second local copy of
a component they hold.
