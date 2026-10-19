# Tools registry

`lib/tools.ts` is the only list of my own projects (#189, #273): `/tools`,
`/tools/<slug>`, the sitemap and both llms files read it, and adding a tool is
adding an entry there. Every field except the name, the job line, the summary,
the status, the group and the kind is optional, and the page shows only the
blocks an entry has data for: no registry means no install line, no `ci` means
no CI pill, no `repo` means no repository row. A project with no page yet would
be a `toolRows` entry, a hub line with links, not in the sitemap or the llms
files; there is none today. A status is written down for every entry, never
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
catalog item the band's "Have me build it" column names; `deployable` adds
`SoftwareApplication` JSON-LD, whose `url` is only ever its running `live`
instance. The hub carries `CollectionPage` and `ItemList` JSON-LD. A tool page's
links send `outbound` (`to` `live` or `github`, `item` the slug), `cta` and
`book` with `item`, and its copy button `tool-install-copy`; see "Analytics in
the code" in [analytics.md](analytics.md).

**The tool frame (#454).** Every tool page wears one shared frame from
`components/tool-frame/`, so a visitor who has read one page can read the next;
the spec is issue #454. A custom page is `routes/tools/<slug>.tsx`, which Fresh
matches before `routes/tools/[slug].tsx`; `[slug].tsx` stays for every tool
without one and draws a default middle from the entry (Seed's "What you get"
cards, credit, live proof, "What it is", the screenshots the hero does not show,
"How it fits", "Where it stands"). A custom page loads its data and renders the
frame with its own middle as children:

```tsx
const data = await loadToolPage("oko"); // components/tool-frame/tool-page.ts
return (
  <ToolFrame
    data={data}
    currentPath={ctx.url.pathname}
    more={["zond", "mig", "rostok"]}
  >
    {/* the page's own middle */}
  </ToolFrame>
);
```

`ToolFrame` renders, in order: the head and JSON-LD (`ToolJsonLd`:
`SoftwareSourceCode`, `SoftwareApplication` for a `deployable` tool, and a
`VideoObject` once `clip.video` is set), the "‹ Tools" back link, `ToolHero`
(top line `name · job · StatusMark`, the `<h1>` from `headline` or "name: job",
the lede, at most one secondary button for `live` with "View on GitHub", the
hero media and an optional line under the actions), the page's middle,
`ToolDetails` ("Where it stands" from `works`/`notYet` or the page's `beside`,
the sticky "Tool facts" card `ToolFacts`, "Use it if", "Skip it if" and "The
story behind it"), `ToolBand` ("Two ways to use it": the install or quick-start
command and "View on GitHub" beside the catalog price and the page body's only
Book) and `ToolMore` (three tools: pass `more` with the three slugs a visitor of
that page wants next). Props `hero`, `beside` and `band` change only what those
parts document. The hero media is `ToolHeroMedia`: the `clip`
(`islands/ToolHeroClip.tsx`, the library's `DemoVideo`, sending `demo-play`) in
its `WindowFrame`, or its poster as a still until the files exist, else the
`hero` shot or the first screenshot; that still is the page's only eager,
`fetchpriority="high"` image. Every screenshot sits in a `data-lightbox` box
that the frame's one `islands/ToolZoom.tsx` opens full size (sending `zoom`); a
crop opens the full file named in its `data-lightbox-src`. The middle uses only
`@theme` tokens and `@spy4x/preact-*` components, and never the accent: Book in
the band is the only accent in the page body.

Wording the frame keeps: "Skip it if", never "Don't use it if"; "View on GitHub"
and "open issues" are the only names of links to the tool's repository; Seed is
a "SaaS starter"; every copy button's tooltip is "Copy the install command".
`test/tool-frame.ts` holds the shared checks a custom page's test calls:
`assertToolFrame()` on the built HTML, `toolPageProblems()` in a browser (axe,
no sideways scroll, one `<h1>` at 390 and 1440px). `test/tool-frame.test.ts`
runs the first over every tool page; `test/a11y.browser.test.ts` runs axe over
every tool page. A clip's files follow docs/images.md "Videos", and a page's own
events go in its subsection of docs/analytics.md "Tool pages". Every claim in
these fields comes from the project's own README or docs. Screenshots live in
`static/img/tools/<slug>/` (see [images.md](images.md)). A starter's catalog
item (`kind: "starter"`) says "Built on" and links the starter's page.
