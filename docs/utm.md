# Tagged links

Every link posted elsewhere that points back to `antonshubin.com` carries UTM
parameters, so Umami can tell which post, video or message a visit came from.
Never write a tagged URL by hand: print it with `deno task links`, or let the
kits (`launch-kit`, `video-kit`, `publish:blog`) build it.

```
deno task links <path> [--campaign <name>] [--content <name>]
```

It prints one tagged URL per channel in the table below, for the page at
`<path>`.

## Three questions

A tagged link answers three questions, plus an optional fourth.

| Parameter      | Question                          | Rule                                                              |
| -------------- | --------------------------------- | ----------------------------------------------------------------- |
| `utm_source`   | Which platform is the link on?    | One row of the channel table.                                     |
| `utm_medium`   | What kind of placement is it?     | Comes with the source from the channel table. Never chosen apart. |
| `utm_campaign` | What does the link promote?       | See "Campaigns" below. Required on every link.                    |
| `utm_content`  | Which specific place, if several? | Optional: a subreddit, a thread reply, one of several posts.      |

Rules:

- Campaign and content are lowercase kebab-case (`opus55-vs-sonnet5`,
  `r-claudeai`). The builder throws on anything else, because a typo splits one
  campaign into two in Umami.
- `utm_content` is left out when there is nothing to tell apart. The builder
  omits it when it is unset.
- `utm_term` is never used: the site buys no search ads.
- Parameters always appear in the same order: source, medium, campaign, content.
- The link points at a page on `antonshubin.com`, never at a third-party site,
  so the visit lands in Umami. The path carries no trailing slash; the builder
  strips one.

## Channels

The medium describes where the link sits, not the platform: `social` for any
post or comment on a social or community site (Show HN included), `blog` for a
cross-post on another blog, `video` for a video description, `oss` only for a
link inside a repository, `dm` for a private message, `email` for an email, and
`profile` for a standing link that is not part of any post.

This table must match `CHANNELS` in `scripts/utm.ts` row for row;
`scripts/utm.test.ts` fails when they disagree. To add a channel, add it to
both.

| Source     | Medium    | Where the link goes         |
| ---------- | --------- | --------------------------- |
| `x`        | `social`  | X post or reply             |
| `linkedin` | `social`  | LinkedIn post or comment    |
| `reddit`   | `social`  | Reddit post or comment      |
| `hn`       | `social`  | Hacker News post or comment |
| `devto`    | `blog`    | Dev.to cross-post           |
| `youtube`  | `video`   | YouTube video description   |
| `github`   | `oss`     | README or release notes     |
| `upwork`   | `dm`      | Upwork proposal or chat     |
| `email`    | `email`   | Email signature or message  |
| `qr-card`  | `profile` | Business card QR code       |

## Campaigns

The campaign names the thing the link promotes.

| What is promoted    | Campaign                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| A repository launch | `<repo>-launch`, set by `deno task launch-kit`                         |
| An article          | its blog slug, or the post's `utmCampaign` front-matter field when set |
| A video             | `<topic>-yt`, set by `deno task video-kit` (default `<slug>-yt`)       |
| A standing link     | `evergreen`: a business card, an email signature, a profile            |

`deno task links` picks the campaign by itself only for an article: for a
`/blog/<slug>` path with no `--campaign`, it reads `utmCampaign` from
`content/blog/<slug>.md`, and falls back to the slug. Any other path needs
`--campaign`, and the task exits with an error without one, because only an
article has a name the task can know.

## Examples

An article shared on X, with its campaign set by hand:

```
deno task links /blog/opus-5-5-vs-sonnet-5-agent-costs --campaign opus55-vs-sonnet5
```

prints, among the other channels:

```
https://antonshubin.com/blog/opus-5-5-vs-sonnet-5-agent-costs?utm_source=x&utm_medium=social&utm_campaign=opus55-vs-sonnet5
```

The same article in two subreddits, told apart by `--content`:

```
https://antonshubin.com/blog/opus-5-5-vs-sonnet-5-agent-costs?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudeai
https://antonshubin.com/blog/opus-5-5-vs-sonnet-5-agent-costs?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudecode
```

A link in the rostok README to its launch post:

```
https://antonshubin.com/blog/rostok-self-hosted-scaffolder?utm_source=github&utm_medium=oss&utm_campaign=rostok-launch
```

A standing link in an Upwork message:

```
https://antonshubin.com/how-i-work?utm_source=upwork&utm_medium=dm&utm_campaign=evergreen
```

## The Dev.to cross-post

`deno task publish:blog` creates a Dev.to draft whose `canonical_url` is the
clean post URL, with no parameters, because it tells search engines which copy
is the original. The draft body ends with a "First published on antonshubin.com"
line whose link carries the `devto` channel's tags and the article's campaign,
so readers who click through are counted.

## Campaign log

Campaigns already used by hand. Keep them valid: reuse the same name when
sharing the same thing again.

### `opus55-vs-sonnet5` — 26 Sep 2026

Post: `/blog/opus-5-5-vs-sonnet-5-agent-costs`. The campaign differs from the
slug, so pass `--campaign opus55-vs-sonnet5` to `deno task links` for this post.
Links shared that day:

```
?utm_source=x&utm_medium=social&utm_campaign=opus55-vs-sonnet5
?utm_source=linkedin&utm_medium=social&utm_campaign=opus55-vs-sonnet5
?utm_source=hn&utm_medium=social&utm_campaign=opus55-vs-sonnet5
?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudeai
?utm_source=reddit&utm_medium=social&utm_campaign=opus55-vs-sonnet5&utm_content=r-claudecode
?utm_source=devto&utm_medium=blog&utm_campaign=opus55-vs-sonnet5
```

Exception: a Dev.to variant with `utm_medium=crosspost` was also drafted that
day and may have been posted. It is not the rule; if it shows up in Umami, count
it with the `devto` / `blog` row.

## Review cadence

`deno task weekly-numbers` reports the week's top campaigns by visits; see
[`docs/weekly-numbers.md`](./weekly-numbers.md).
