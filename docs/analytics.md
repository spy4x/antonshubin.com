# Analytics

The site counts visits and a small set of events in a self-hosted Umami
(`https://stats.antonshubin.com`, website "antonshubin.com"). The events measure
the three outcomes the site exists for: a written brief that was sent, a call
that was booked, and a post that was read to the end. Issue #318 set this up.

## Where nothing is sent

- **Staging.** `scripts/staging-env.ts` blanks `UMAMI_ID`, so staging never
  reports into the production website.
- **`/unsubscribe`, `/subscribe/confirm` and `/pay`.** `routes/_app.tsx` leaves
  the Umami script out on these pages, as it does for crawlers. An unsubscribe
  link's token is a working credential, a confirmation link's token holds the
  address, and Umami stores the full query string of every page view.
- **Crawlers.** `lib/bots.ts`'s `isBot()` decides at render time.

## Events

This table is the canonical list. Once `lib/analytics.ts` lands, it is the
code's copy of the same list, and a name not in it fails type checking. Umami
stores the page URL with every event, so no event has a `page` property.

| Event                                | When                                                                                                          | Properties                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `book`                               | a Book link or button is clicked                                                                              | `place` (`nav`, `hero`, `card`, `band`, `side`, `end`, `top`), `item` (catalog or project slug, when there is one)         |
| `brief`                              | a "Send a written brief" link is clicked                                                                      | `place`, `item`                                                                                                            |
| `brief-sent`                         | the lead form reports success                                                                                 | `service` (slug, when prefilled)                                                                                           |
| `brief-error`                        | the lead form fails                                                                                           | `reason`                                                                                                                   |
| `call-booked`                        | mig reports a booking                                                                                         | none                                                                                                                       |
| `calendar-shown` / `calendar-failed` | embed lifecycle                                                                                               | none                                                                                                                       |
| `newsletter-signup`                  | the server accepts a signup (the address still has to confirm by mail)                                        | none                                                                                                                       |
| `outbound`                           | a link to another site is clicked, including links inside posts                                               | `to` (short host or profile id: `upwork`, `github`, `youtube`, `telegram`, `email`, `neatsoft`, a tool's `live` …), `item` |
| `cta`                                | an internal call-to-action link (work card, service card, tool card, How I work, FAQ …)                       | `place`, `target` (the link's path)                                                                                        |
| `tool-install-copy`                  | an install command is copied                                                                                  | `item`                                                                                                                     |
| `copy`                               | a `/pay` copy button                                                                                          | `field`                                                                                                                    |
| `post-read`                          | the end of a post's body has been on screen, and the visitor has been on the page 15 s or more; once per view | `item` (post slug)                                                                                                         |
| `not-found`                          | the not-found page renders                                                                                    | none                                                                                                                       |

The old event names (`nav-book`, `form-submit-audit`, `meet-embed-frame-load`
and about 90 others) stopped on 2026-09-30. The weekly report says so until
2026-10-14 instead of comparing across the rename.

## Reports

`scripts/umami-reports.ts` keeps these saved reports in Umami. Each one answers
one question:

| Report                                 | Question                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Goal: book                             | How many Book clicks, across every place they sit?                           |
| Goal: brief-sent                       | How many written briefs actually reached Anton?                              |
| Goal: call-booked                      | How many intro calls were actually booked?                                   |
| Goal: newsletter-signup                | How many newsletter signups succeeded?                                       |
| Goal: post-read                        | How many post views reached the end of the post?                             |
| Funnel: any page → /book → call-booked | Of all visitors, how many open the booking page, and how many of those book? |
| Funnel: /book → call-booked            | Of the visitors who open the booking page, how many book?                    |
| Funnel: any page → brief-sent          | How many visitors send a written brief?                                      |

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
