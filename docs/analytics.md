# Analytics

The site counts visits and a small set of events in a self-hosted Umami
(`https://stats.antonshubin.com`, website "antonshubin.com"). The events measure
the three outcomes the site exists for: a written brief that was sent, a call
that was booked, and a post that was read to the end. Issue #318 set this up.

## Where nothing is sent

- **`/unsubscribe`, `/subscribe/confirm` and `/pay`.** `routes/_app.tsx` leaves
  the Umami script out on these pages, as it does for crawlers. An unsubscribe
  link's token is a working credential, a confirmation link's token holds the
  address, and Umami stores the full query string of every page view.
- **Crawlers.** `lib/bots.ts`'s `isBot()` decides at render time.
- **A browser that opted out.** The button on `/privacy`
  (`islands/AnalyticsOptOut.tsx`) sets `umami.disabled` in local storage, and
  Umami's tracker sends no page view or event while that key holds a value.
  Anton presses it once in every browser and device he uses, so his own visits
  stay out of the numbers; clearing the site's data switches counting back on.
  Visits counted before the press stay in Umami. Safari is documented to delete
  a site's script-written local storage after seven days without a visit to it
  (not tested here), so on an iPhone or in Safari the press may need repeating;
  `/privacy` shows the current state.

## Events

This table is the canonical list. `lib/analytics.ts` is the code's copy of the
same list, and a name not in it fails type checking. Umami stores the page URL
with every event, so no event has a `page` property.

| Event                                | When                                                                                                          | Properties                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `book`                               | a Book link or button is clicked                                                                              | `place` (`nav`, `hero`, `card`, `band`, `side`, `end`, `top`), `item` (catalog or project slug, when there is one)                                                                                                                                     |
| `brief`                              | a "Send a written brief" link is clicked                                                                      | `place`, `item`                                                                                                                                                                                                                                        |
| `brief-sent`                         | the lead form reports success                                                                                 | `service` (slug, when prefilled)                                                                                                                                                                                                                       |
| `brief-error`                        | the lead form fails                                                                                           | `reason`                                                                                                                                                                                                                                               |
| `call-booked`                        | mig reports a booking                                                                                         | none                                                                                                                                                                                                                                                   |
| `calendar-shown` / `calendar-failed` | embed lifecycle                                                                                               | none                                                                                                                                                                                                                                                   |
| `newsletter-signup`                  | the server accepts a signup (the address still has to confirm by mail)                                        | none                                                                                                                                                                                                                                                   |
| `outbound`                           | a link to another site is clicked, including links inside posts                                               | `to` (short host or profile id: `upwork`, `github`, `youtube`, `telegram`, `email`, `neatsoft`, a tool's `live` …), `item`; on the home page also `place`; on a tool page also `place` and the `to` values `issues`, `registry`, `website`, `demo-app` |
| `cta`                                | an internal call-to-action link (work card, service card, tool card, How I work, FAQ …)                       | `place`, `target` (the link's path)                                                                                                                                                                                                                    |
| `tool-install-copy`                  | an install command, or a tool page's quick-start command, is copied                                           | `item`                                                                                                                                                                                                                                                 |
| `demo-play`                          | a tool page's demo clip is played (`DemoVideo`'s play link pressed)                                           | `item` (tool slug), `place` (`hero`, `body`, or `card` on the `/tools` hub)                                                                                                                                                                            |
| `zoom`                               | a screenshot on a tool page opens in the lightbox                                                             | `item` (tool slug)                                                                                                                                                                                                                                     |
| `tool-try`                           | a tool page's own interaction is used                                                                         | `item` (tool slug), `part` (which interaction; each page lists its values under "Tool pages" below)                                                                                                                                                    |
| `copy`                               | a `/pay` copy button                                                                                          | `field`                                                                                                                                                                                                                                                |
| `post-read`                          | the end of a post's body has been on screen, and the visitor has been on the page 15 s or more; once per view | `item` (post slug)                                                                                                                                                                                                                                     |
| `post-try`                           | a reader first uses one of a post's interactive components; once per component per view                       | `item` (post slug), `part` (the component's tag name, `RunsCalculator` …); never a value the reader entered                                                                                                                                            |
| `case-try`                           | a visitor picks a step of a case page's interaction; once per step per view                                   | `item` (project slug), `part` (the interaction: `tour`, `map`, `device`), `step` (the step's id, `sogroya-consent` …)                                                                                                                                  |
| `not-found`                          | the not-found page renders                                                                                    | none                                                                                                                                                                                                                                                   |

`place: nav` on `book` (or on `brief` when `SCHEDULE_URL` is unset) is the
navigation's Contact entry since #529: the rail's bottom entry, the More sheet's
last row and the phone header's link, all to `/book` (`/book#brief` without a
scheduler). Before #529 it was the rail's orange Book, so a drop in `nav` clicks
after 2026-10-21 is the change, not lost interest; on the home page compare
`hero` plus `band`, and `brief-sent` plus `call-booked`, over four weeks before
and after.

The old event names (`nav-book`, `form-submit-audit`, `meet-embed-frame-load`
and about 90 others) stopped on 2026-09-30. The weekly report says so until
2026-10-14 instead of comparing across the rename.

## Reports

`scripts/umami-reports.ts` keeps these saved reports in Umami. Each one answers
one question:

| Report                                  | Question                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Goal: book                              | How many Book clicks, across every place they sit?                                                                        |
| Goal: brief-sent                        | How many written briefs actually reached Anton?                                                                           |
| Goal: call-booked                       | How many intro calls were actually booked?                                                                                |
| Goal: newsletter-signup                 | How many newsletter signups succeeded?                                                                                    |
| Goal: post-read                         | How many post views reached the end of the post?                                                                          |
| Funnel: any page → /book → call-booked  | Of all visitors, how many open the booking page, and how many of those book?                                              |
| Funnel: /book → call-booked             | Of the visitors who open the booking page, how many book?                                                                 |
| Funnel: case page → /book → call-booked | Of the visitors who open a client case page (`/work/<slug>`), how many open the booking page, and how many of those book? |
| Funnel: any page → brief-sent           | How many visitors send a written brief?                                                                                   |

Every funnel gives a visitor 60 minutes from its first step. A step may match
the same page view or event as the step before it (Umami's `getFunnel.ts`
compares the times inclusively), so a visitor who lands straight on `/book`
counts for both "any page" and `/book`. The two-step booking funnel asks the
same question without the entry step.

**Attribution and Journey live in the weekly report.** In Umami 3 (checked in
v3.3.1 and v3.4.0) the Attribution and Journeys pages keep their settings
(model, type, step; steps, start step) in the open page and never load a saved
report; only the date range comes from the URL. So neither can be set up once in
Umami. `deno task weekly-numbers` asks Umami's API for the same answers every
Sunday, over the last 30 days because a week holds too few conversions to
attribute (`docs/weekly-numbers.md`):

| Section                     | API call                                                                       | Question                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| What brought conversions    | `/attribution`, type `event`, step `call-booked` and `brief-sent`, both models | Which referrer and campaign brought the people who booked or sent a brief? |
| Journeys from the home page | `/journeys`, 7 steps (5 shown), start step `/`                                 | Where do visitors go after the home page?                                  |

To look at another step or model, open the page in Umami and pick the same
settings; they last until the page is closed.

### Running the reports script

```bash
# Show what would change; lists the saved reports but sends no write.
UMAMI_API_URL=https://stats.antonshubin.com UMAMI_API_TOKEN=… UMAMI_ID=… \
  deno task umami-reports --dry-run

# Create or update the reports.
UMAMI_API_URL=https://stats.antonshubin.com UMAMI_API_TOKEN=… UMAMI_ID=… \
  deno task umami-reports
```

It needs the same three variables as the weekly report
(`docs/weekly-numbers.md`) and throws naming any that is missing. The token
belongs to an Umami user who can edit the website. The script lists the
website's saved reports, matches each of its reports by name, updates one whose
settings differ, creates one that is missing and prints `unchanged` for the
rest. It never touches a report whose name it does not own, so a report made by
hand in Umami stays. The one thing it deletes is a report listed in
`RETIRED_REPORTS` whose description still carries its "Managed by" marker: since
the booking page moved to `/book` (#190), the first run after that deploy
deletes the two old `/contact-me` funnels, and later runs find nothing to
delete. Every call has a 10-second timeout; a failed call ends the run with exit
code 1, and running it again finishes the rest. Rerun it after changing a report
in `REPORTS`, or after an event is renamed.

### Umami API used

Read from umami-software/umami at v3.4.0 (commit
`ec0ff50388c264ed8ce46f00967e92f7e71476ae`) and compared with v3.3.1; the live
instance answers `/api/websites/<id>/goals`, which only 3.4 has.

- Reports: `GET /api/reports?websiteId=&page=&pageSize=` lists (answer
  `{ data, count, page, pageSize }`), `POST /api/reports` creates,
  `POST /api/reports/<id>` updates. Umami 3.4 serves these from
  `src/app/(compat)/compat/api/reports/` through a rewrite in `next.config.ts`;
  the body is `reportSchema` in `src/lib/schema.ts`. A goal's parameters are
  `{ type: "event" | "path", value }` and a funnel's `{ window, steps }`
  (`goalParametersSchema`, `funnelParametersSchema` in
  `src/lib/analytics-schema.ts`).
- Event properties:
  `GET /api/websites/<id>/event-data/values?eventName=&propertyName=&startAt=&endAt=`
  answers `[{ value, total }]`, largest first, at most 100 rows
  (`src/app/api/websites/[websiteId]/event-data/values/route.ts`). The weekly
  report uses it for `book` by `place` and `post-read` by `item`.
- Stats: `GET /api/websites/<id>/stats` answers plain numbers plus a
  `comparison` object for the previous period of the same length.

## Analytics in the code

`lib/analytics.ts` is the only list of Umami events (#318): `ANALYTICS_EVENTS`
is a closed list, and detail goes into `data-umami-event-<key>` properties
(`place`, `item`, `to`, `target`, `field`, `reason`, `service`, `part`, `step`),
never into the name, so Umami can add up every Book click across pages. A link
or button spreads `eventAttrs(name, props)`; `linkEvent(href, props)` picks
`outbound`, `brief`, `book` or `cta` from the href (the closing band and the
promise timeline use it); an island calls `track()`, which never throws. Never
write a `data-umami-event` string or call `umami.track` by hand.
`test/analytics.test.ts` fails on any event, property or `place` outside the
list on every sitemap page, `/pay` and a not-found page.

Outcomes are tracked where they happen: `islands/LeadForm.tsx` sends
`brief-sent` (with `service`) only after `/api/lead` accepted the brief and
`brief-error` (`reason` `invalid` or `server`) otherwise, the submit click is
not an event; `islands/MeetEmbed.tsx` sends `calendar-shown` on the first valid
`mig:height`, `calendar-failed` on the timeout and `call-booked` for each
`{ type: "mig:booked" }` message under the same origin and `event.source` guard
as `mig:height`; `islands/NewsletterForm.tsx` sends `newsletter-signup`;
`islands/PostRead.tsx` sends `post-read`; a post's component (#537) calls
`trackPostTry(post, tag)` on every input and the helper sends `post-try` once
per page view; `islands/CaseScreenTour.tsx` calls
`trackCaseTry(item, part,
step)` when a step is picked and the helper sends
`case-try` once per step per page view (#523); `components/NotFound.tsx` sends
`not-found` through `islands/TrackPageEvent.tsx`. Links to other sites inside a
post get `outbound` from `lib/markdown.ts`.

`routes/_app.tsx` loads no tracker for crawlers or on `UNTRACKED_PATHS`
(`/unsubscribe` and `/subscribe/confirm`, whose URLs carry a token, and `/pay`).
`/privacy` also holds a button (`islands/AnalyticsOptOut.tsx`) that sets
`umami.disabled` in the browser's local storage, the flag Umami's tracker checks
before it sends anything: Anton presses it once in each of his own browsers, so
his visits stay out of the numbers, and any visitor can do the same.
`routes/privacy.tsx` describes exactly this; change it together with the code.
This file holds the event names and properties and the saved reports
`deno task umami-reports` keeps.

`demo-play` and `zoom` are sent with `track()` from islands
(`islands/ToolHeroClip.tsx`, `islands/ToolZoom.tsx`), never as
`data-umami-event` attributes on the clip's play link: Umami's tracker answers a
click on a tracked `<a href>` by cancelling it and then opening the href, which
for the play link is the video file. A `tool-try` on a `<label>`, `<summary>` or
`<button>` may use `eventAttrs()`; on a link that must not navigate, use
`track()`.

## Tool pages

Every tool page sends the frame's events (#454): `demo-play`, `zoom`, `outbound`
(`place` `hero`, `card`, `band` or `body`), `tool-install-copy`, `book`
(`place: band`, `item`) and `cta` (the offer or "Services", More tools, the
post). A page's own events go in its subsection below; each lane edits only its
own.

### The hub (`/tools`)

`demo-play` (`item`; `place: hero` for the spotlight's clip, `card` for a
card's), `cta` (`place: hero` for "See Seed", `card` for a card's name, `body`
for a Being built or archive line's name, `band` for Services), `outbound`
(`to: live` or `github`, `item`, `place: hero` or `card`) for a link to another
site, `book` for an on-site link to `/book` (`place: card` and `item: mig` for
mig's "Open the booking page", `place: band` for the band's Book), and
`tool-install-copy` (`item`). The hub has no lightbox, so no `zoom`. The number
the hub should move: the share of hub visits with a `cta` to a tool page or a
`demo-play`.

### caldav-mcp

- `tool-try` with `part` `mode:all`, `mode:no-delete` or `mode:read-only`: a
  position of the "Which tools the server offers" switch was clicked (on its
  radio, never its label: a label click reaches the radio as a second click,
  which would count twice).
- `tool-try` with `part` `tool:<name>` (`tool:query_todos` …): a tool's row in
  the reference was opened or closed (on its `<summary>`).
- `tool-install-copy`: the Claude Desktop config block was copied.
- `outbound` (`to: github`, `place: body`): the clients guide link under the
  config block.

### caldav-tasks-web

- `tool-try` with `part` `field:title`, `field:priority`, `field:parent`,
  `field:order` or `field:reminder`: a field of "Same file, two apps" was picked
  (on its radio, so a click on the chip or an arrow key counts once).
- `outbound` (`to: github`, `place: body`): "Every field" under the task file
  and "The compatibility guide" under "What was tested".
- `outbound` (`to: issues`, `place: body`): "Issue #119" in the known-issue line
  of "Where it stands" (the entry's `knownIssue`).

### dotfiles

- `tool-try` (`item: dotfiles`, `part: harness-map`): a press on a source's
  summary in "Where each file goes", below 1024px. The table above that width
  has nothing to press and sends nothing.
- `outbound` (`to: github`, `place: card`): a file link on one of the six "The
  AI-agent setup" cards; `place: hero` on "Read the global agent rules".
- `cta` (`place: band`, `target: /how-i-work`): "How I work" in the band.

### financy

None yet.

### mig

- `tool-try` (`item: mig`, `part: calendar`): "Load my calendar here" in "Try it
  here" was pressed and the real calendar is loading in place. Sent with
  `track()` from `islands/MigTryCalendar.tsx`, because the button is a link to
  `/book#book` (its no-JavaScript fallback) and a tracked link would leave the
  page.
- The calendar it loads is `/book`'s `MeetEmbed`, so `calendar-shown`,
  `calendar-failed` and `call-booked` come from this page too; a booking made
  here is a real one and counts toward the goal.
- "Open the calendar in a new tab" and "open issues" send `outbound` (`to`
  `live` or `issues`, `place: body`); both copy buttons (the compose file, the
  embed snippet) send `tool-install-copy`.

### oko

`routes/tools/oko.tsx` (#464) sends, besides the frame's events:

- `tool-try` (`item: oko`, `part` `state:up`, `state:down` or `state:unknown`):
  a state in "From config to card" is chosen. The attributes sit on the native
  radio, which gets a click from a press on its label or from the arrow keys.
- `tool-install-copy` (`item: oko`): the config entry or a quick-start block
  (`compose.yml`, `config.json`) is copied.

### preact-components

The palette demo (`islands/PaletteDemo.tsx`, #522) sends its events with
`track()`, `item: preact-components`:

- `tool-try`, `part: palette:open`: the palette opened (a click, Ctrl K or ⌘K,
  `/`, or an example), once a page view. The number the demo should move is the
  share of page views with this event.
- `tool-try`, `part` `example:typo`, `example:order`, `example:layout` or
  `example:cyrillic`: an example search under the field was pressed.
- `tool-try`, `part: pick:forgiving` or `pick:name`: a component was picked;
  `forgiving` when the search needed a typo, another name, the other keyboard
  layout, the other alphabet or word order. `pick:forgiving` over all picks says
  whether the forgiving search is what people try.
- `tool-try`, `part` `command:theme-light`, `command:theme-dark`,
  `command:toast` or `command:undo`: a "Try" command ran, or Undo on its toast
  was pressed.
- `tool-install-copy`, `part: install` or `import`: the install command or a
  component's import line was copied.
- `outbound` (`to: live`, `place: body`): the "Open the live UI guide" command
  (sent with `track()` before the page leaves).

From attributes, as elsewhere:

- `tool-try` (`part: theme-dark` / `theme-light`): the preview's Dark and Light
  radios, through `ThemePreview`'s `inputAttributes`. A "Switch the preview"
  command checks the radio without a click, so it counts once, as its command.
- `tool-try` (`part: code`): "Show the code" under the demo is opened. The
  attributes sit on the `<summary>`, which is not a link, so the tracker's click
  handling does not cancel the toggle.
- `outbound` (`to: live`, `place: body`): "See it in the live UI guide" on the
  stage and "Open the live UI guide" under the demo; (`to: issues`,
  `place: body`): the #210 link and "open issues" in "Where it stands".

### rostok

| Event               | When                                                          | Properties                           |
| ------------------- | ------------------------------------------------------------- | ------------------------------------ |
| `tool-try`          | a catalog stack's summary is clicked (to open or to close it) | `item=rostok`, `part=stack:{name}`   |
| `tool-install-copy` | a catalog stack's add command is copied                       | `item=rostok`, `part=stack:{name}`   |
| `cta`               | a stack's "This tool's page" link                             | `place=body`, `target=/tools/{slug}` |

The category index links jump inside the page and send nothing.

### seed

No events of its own; the page adds `outbound` targets (#455). The hero's "Open
the live demo" goes to seedsaas.com with `to: live` (#521). The two "See it
running" cards send `to` `demo-app` or `website` with `place: body`, and the
admin panel video beside them sends `demo-play` with `place: body` (visitors get
no admin sign-in, so there is no admin link). The "try it" link under a "What
you get" card sends `demo-app` with `place: card`. The hero's website line sends
`website` and "The full quick start" sends `github`, both with `place: hero`.
The copy button of "The next commands" sends `tool-install-copy`. `book` and
`cta` to the MVP offer with `item: seed` are the number the page should move.

### ts-libs

- `tool-try` with `part` the package name without its scope (`validation`,
  `platform`, … `tasks`): a press on a "Pick a package" summary. It counts
  opening and closing alike. The summary carries the attributes and lets clicks
  on its children through (`pointer-events: none`), because Umami reads the
  event from a click's own target when no link or button holds it.
- `tool-install-copy`: the "Run the example" copy buttons (hero and band) and
  each package's install line.
- `outbound` with `to: registry`, `place: body`: each package's "On JSR" link;
  `to: github`, `place: body`: the README link under "Run the example" and the
  three import lists under "Where I use it". The hero's "See the packages on
  JSR" sends `to: registry`, `place: hero`.

### zond

| Event               | When                                                              | Properties                                        |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `tool-try`          | a request chip in "Ask zond" is picked (on its radio)             | `item=zond`, `part=ask:{path}` (`ask:/health`, …) |
| `tool-install-copy` | any Quick start block is copied (Compose, config, command, Gatus) | `item=zond`                                       |

Changing a service's answer sends nothing: a `<select>` reports a change, not a
click, and an island only for that event would cost more than it tells.

### air-quality-sensor, toread-today

Archived: the frame's events only.

## Case pages

Every `/work/<slug>` page (#523, `components/case-frame/`) sends the frame's
events: `book` (`place` `card` or `band`, `item`), `brief` (`place: band`, the
link carries `?service=<catalog slug>`), `outbound` (`to: live`, `item`, and
`place: hero` on the secondary link under the lead), `cta` (Similar work today,
the More client work cards, All client work, How I work). A page's own
interaction sends `case-try`:

- `/work/sogroya`: `case-try` (`item: sogroya`, `part: tour`, `step` one of
  `sogroya-home`, `sogroya-consent`, `sogroya-schedule`, `sogroya-download`)
  when a step of "The four steps" is picked, by a tab, the arrow keys or the
  lightbox's Previous and Next. The first step, shown when the page opens, sends
  nothing until it is picked again after another.
- `/work/corecircle`: `case-try` (`item: corecircle`, `part: tour`, `step` one
  of `corecircle-1` … `corecircle-4`) when a screen of the "Corecircle screens"
  tour is picked, the same way. Its "See Connectful" link sends `cta`.
- `/work/connectful` has no interaction of its own; its "See Corecircle" link
  sends `cta`.
- `/work/smartlite`: the same for "What an operator sees" (`item: smartlite`,
  `part: tour`, `step` `smartlite-` plus the screen's caption in kebab case:
  `smartlite-dashboard`, `smartlite-alerts`, … `smartlite-lamp-profiles`,
  `smartlite-profile`; 12 in all). "How a click reaches a pole" is static and
  sends nothing.
- `/work/roley`: the same for "Make a movie in four steps" (`item: roley`,
  `part: tour`, `step` one of `roley-scripts-mobile`, `roley-recorder-mobile`,
  `roley-processing-mobile`, `roley-watch-mobile`).
- `/work/truth-or-dare`: `case-try` (`item: truth-or-dare`, `part: map`, `step`
  one of `requests`, `chat`, `image`, `push`) when a flow of "One backend for
  every app" is picked. The map has no island: the event is the radio's own
  `data-umami-event` attribute, so it counts every pick, not once per step per
  view. `outbound` (`to: darechat.me`, `item`) on "Open the public API docs".
- `/work/foodrazor`: `demo-play` (`item: foodrazor`, `place: hero`) once per
  view when the video's play link is pressed (`islands/CaseYouTube.tsx`, sent
  with `track()`, like a tool clip); `case-try` (`item: foodrazor`,
  `part: device`, `step` `phone` or `desktop`) when the walkthrough's device
  switch is picked, and (`part: tour`, `step` such as `foodrazor-phone-orders`)
  when a step of "From a paper invoice to a price alert" is picked, each once
  per step per view.

"Funnel: case page → /book → call-booked" (above) reads these pages as one entry
step.
