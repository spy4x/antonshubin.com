# Weekly numbers

`scripts/weekly-numbers.ts` (`deno task weekly-numbers`) prints a markdown
report — from Umami: visitors, visits, pageviews, conversions and the conversion
rate, the goals, every event, Book clicks by place, posts read to the end, top
pages, referrers and campaigns; stars per repo from GitHub; subscribers and
views from YouTube — and sends a short summary to NTFY. It is meant to run every
Sunday from a Woodpecker cron, defined as the `weekly-numbers` step in
`.woodpecker.yml`.

Each data source is independent and optional: if its env vars are missing, that
source is skipped with a warning in the report instead of failing the whole run.
This is a reporting script, so it follows the repo's fail-open rule for
non-critical external calls — a broken YouTube key should not stop the Umami and
GitHub numbers from going out.

## What the Umami part shows

Every Umami number except the two 30-day sections stands beside the same figure
for the 7 days before. Visits, visitors and pageviews come from `/stats`, whose
`comparison` object already holds the previous period; every other section asks
for both weeks. The event names are the ones in `docs/analytics.md`.

- **Last 7 days**: visitors, visits, pageviews, conversions (`brief-sent` plus
  `call-booked`) and the conversion rate (conversions ÷ visitors, one decimal,
  "—" when there were no visitors).
- **Goals**: `book`, `brief-sent`, `call-booked`, `newsletter-signup` and
  `post-read`, each listed even at zero.
- **Every event**: all of them, not only the top ten; an event seen only in the
  previous week is listed with 0 this week.
- **Book clicks by place** and **posts read to the end**: the `book` event by
  its `place` property and `post-read` by its `item` (the post slug), from
  Umami's event-data values endpoint.
- **Top pages, referrers and campaigns**: the top ten of this week.
- **What brought conversions (30 days)**: Umami's Attribution for `brief-sent`
  and `call-booked`, by first and by last click: how many visitors converted
  ("all"), then the top five referrers and campaigns.
- **Journeys from the home page (30 days)**: the ten most common paths through
  five steps starting at `/` (a step is a page or an event), with "(left)" where
  the visit ended. Umami's Attribution and Journeys pages cannot save their
  settings, so these sections are where the two reports live.

Until 2026-10-14 the report opens with a line saying the event names changed on
2026-09-30, so week-over-week event and goal comparisons are not meaningful yet
(`EVENT_RENAME_DATE` in the script).

The NTFY push holds only visitors, conversions and the conversion rate, each as
"previous week → this week". Every Umami call has a 10-second timeout, and a
section whose call fails shows a warning instead of its table.

## Campaigns

The "top campaigns" section lists the week's `utm_campaign` values by visitors,
from Umami's metrics endpoint with `type=utmCampaign`. The self-hosted instance
runs Umami 3 or newer (its image pins `:latest`), where that type exists; its
count is distinct sessions, which Umami's own UI labels visitors. Umami 3
renamed the page metric from `url` to `path` and answers `url` with a 400, so
the top-pages section asks for `path`. How links get tagged, and how often the
campaign numbers are reviewed, is in `docs/utm.md`.

## Env vars

| Variable             | Where the value comes from                                              |
| -------------------- | ----------------------------------------------------------------------- |
| `UMAMI_API_URL`      | The Umami instance's API base (e.g. `https://stats.antonshubin.com`)    |
| `UMAMI_API_TOKEN`    | Umami → Settings → API keys (a token with read access to the site)      |
| `UMAMI_ID`           | Already used by the site's tracking snippet — the same Umami website id |
| `GITHUB_REPOS`       | Comma-separated `owner/repo` list, e.g. `spy4x/rostok,spy4x/mig`        |
| `YOUTUBE_API_KEY`    | Google Cloud Console → a YouTube Data API v3 key                        |
| `YOUTUBE_CHANNEL_ID` | The channel's id, from YouTube Studio → Settings → Channel → Advanced   |
| `NTFY_URL`           | The NTFY server's base URL (e.g. `https://ntfy.sh` or self-hosted)      |
| `NTFY_TOPIC`         | The topic to push the summary to                                        |

All of these are in `.env.example` as empty placeholders.

## One-time Woodpecker setup (cannot be done from this repo)

`.woodpecker.yml` only defines what the `weekly-numbers` step runs and which
event triggers it (`event: cron`, `cron: weekly-numbers`). Two things live in
Woodpecker's own configuration, not in this repo, and have to be set once by
hand:

1. **The cron trigger itself** — Woodpecker → this repo → Cron → Add cron job,
   name `weekly-numbers`, schedule `0 9 * * 0` (Sunday, 09:00, per issue #124;
   see `docs/utm.md`'s review cadence for how the campaign numbers are read),
   branch `main`.
2. **The secrets** referenced by the step's `from_secret` entries — Woodpecker →
   this repo → Secrets: `umami_api_url`, `umami_api_token`, `umami_id`,
   `weekly_numbers_github_repos`, `youtube_api_key`, `youtube_channel_id`,
   `ntfy_url`, `ntfy_topic`. Same values as the table above.
