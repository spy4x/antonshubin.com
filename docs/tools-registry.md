# Tools registry

`lib/tools.ts` is the only list of my own projects (#189, #273): `/tools`,
`/tools/<slug>`, the sitemap and both llms files read it, and adding a tool is
adding an entry there. Every field except the name, the job line, the summary,
the status, the group and the kind is optional, and the page shows only the
blocks an entry has data for: no registry means no install line, no `ci` means
no CI pill, no `repo` means no repository row. A project with no page yet (oko)
is a `toolRows` entry, a hub line with links, and is not in the sitemap or the
llms files. A status is written down for every entry, never guessed from its
link: `in-use`, `ready`, `beta`, `wip`, `paused` or `archived`, and "Live" is
only ever a link to a running public instance. A tool's `registry.published`
decides whether its pinned install command is offered with a copy button or
marked "Not yet available"; flip it to `true` the day that version is really on
its registry.

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
tool's latest version (JSR, npm or Docker Hub, from `registry.latestFrom`),
stars and CI status at most once an hour, in memory, through the same calls the
script makes (`lib/snapshot-fetch.ts`). A failed call keeps the committed value
for that item and never throws, every call times out after 5 seconds, and a page
never waits for a refresh: a request gets the last answer (or the committed
file) at once and the refresh runs in the background. It runs only when
`TOOLS_LIVE_REFRESH=1` (set in `compose.yml`), so `deno task test` and a dev
server never call out; tests build a refresher with a stub `fetch`
(`lib/tools-live.test.ts`). Pages say when the CI status was checked and whether
it is the committed file (`checkedLabel()`; a repository counts as live only
when its GitHub and Woodpecker calls both succeeded). `/tools` and `/tools/*`
are cached for an hour so a refresh reaches visitors (`lib/cache-control.ts`). A
tool's `posts` link each post to its page (the post header shows "The tool:
<name>", then its `live` link and its repository); its `catalogSlug` picks the
catalog item the "hire me" door names; `deployable` adds `SoftwareApplication`
JSON-LD, whose `url` is only ever its running `live` instance. The hub carries
`CollectionPage` and `ItemList` JSON-LD. A tool page's links send `outbound`
(`to` `live` or `github`, `item` the slug), `cta` and `book` with `item`, and
its copy button `tool-install-copy`; see "Analytics in the code" in
[analytics.md](analytics.md).

**Showcase pages (#448).** An entry with a `headline` gets the showcase layout
from the same `routes/tools/[slug].tsx`, drawn by `components/ToolShowcase.tsx`:
the name, job and status on one line above the headline (the `<h1>`), the
`lede`, the live button with "View on GitHub" beside it, the `hero` shot in the
library's `WindowFrame` (before the quick start on a phone, so the product shows
on the first screen), and the `quickStart` command, which wraps only between
arguments, with the site's `islands/CopyButton.tsx`. "What you get" is one
library `FeatureCard` per `features` entry in a six-column grid: `size` makes a
card a third (default), a half or two thirds wide, so pair cards to fill each
row; cards in a row stretch to one height with the `shot` at the bottom, and
`phoneShot` replaces it under 640px where the full crop would be too small to
read. Crop shots to render near their natural size. "Where it stands" is one
card (`works`, then `notYet`, then a line to the repository's open issues)
beside the fact card, then "Use it if", "Skip it if" and "The story behind it"
(the `posts`, with `storyLine`); on a phone the fact card comes last. The
closing band carries the `closing` line with the live and offer buttons beside
Book. `pageTitle` and `lede` give the `<title>` and the meta description;
`hero`, `website` and the posts add `image`, `sameAs` and `subjectOf` to the
JSON-LD. A showcase page does not draw `fits`, `screenshots` or "What it is". A
tool without a `headline` keeps its plain layout. Every claim in these fields
comes from the project's own README or docs, and "Where it stands" only from its
status section. Screenshots live in `static/img/tools/<slug>/` (see
[images.md](images.md)). A template's catalog item says "Built on" and links the
template's page.
