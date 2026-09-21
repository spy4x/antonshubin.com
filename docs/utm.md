# UTM convention

Every external link that points back to `antonshubin.com` should carry UTMs. The
site gets 91% direct traffic, but **0% of inbound channels are tagged**. Without
UTMs, we cannot tell whether a click came from a YouTube video, a Reddit thread,
a Hacker News comment, an Upwork chat, or a business card. That makes every
distribution decision blind.

The convention below is intentionally small. Three parameters, kebab-case,
always lowercase, never invented on the fly. Build the URL once, paste it
everywhere.

## The taxonomy

| Param          | Values                                                                                               | Rule                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `utm_source`   | the platform: `github`, `linkedin`, `youtube`, `reddit`, `hn`, `devto`, `upwork`, `email`, `qr-card` | Specific platform, never `social`                       |
| `utm_medium`   | the touch category: `oss`, `blog`, `video`, `social`, `profile`, `dm`, `qr`, `email`                 | Lets you attribute social vs content vs profile traffic |
| `utm_campaign` | the initiative: `template-launch`, `rostok-launch`, `mcp-yt`, `audit-q3`, `client-acme-audit`        | A discrete launch. Archived when done.                  |

### Hard rules

- Exactly these 3 params. Never add `utm_term` or `utm_content` (we don't have
  paid-search traffic and don't need A/B term splits inside a launch).
- Always lowercase, kebab-case. Never `Q3_Audit`.
- Always link to a page on `antonshubin.com`, never to a third-party domain (so
  Umami captures the visit).
- Campaign names = initiative + version if iterative (`rostok-launch-v2`).
- For business card QR: source `qr-card`, medium `profile`, no campaign.

## Worked examples — the actual URL to paste

These are real links Anton is shipping this week. Copy the pattern.

A `[slug]` route on this site 404s when the path ends in a trailing slash
(`/projects/smartlite/` 404s, `/projects/smartlite` is 200 — see the comment at
`lib/head.ts:43`). None of the examples below end in one, except the root `/`,
which is the one path where a trailing slash is correct.

**1. GitHub repo README link to a case study**

```
https://antonshubin.com/projects/smartlite?utm_source=github&utm_medium=oss&utm_campaign=template-launch
```

**2. Upwork proposal chat (client outreach)**

```
https://antonshubin.com/how-i-work?utm_source=upwork&utm_medium=dm&utm_campaign=client-acme-audit
```

**3. YouTube video description (companion blog post)**

```
https://antonshubin.com/blog/building-mcp-servers-with-deno?utm_source=youtube&utm_medium=blog&utm_campaign=mcp-yt
```

**4. LinkedIn post CTA link**

```
https://antonshubin.com/?utm_source=linkedin&utm_medium=social&utm_campaign=founder-pitch
```

**5. Hacker News Show post (rostok launch)**

```
https://antonshubin.com/infrastructure?utm_source=hn&utm_medium=oss&utm_campaign=rostok-launch
```

**6. Business card QR code**

```
https://antonshubin.com/?utm_source=qr-card&utm_medium=profile
```

**7. Reddit r/selfhosted post body link**

```
https://antonshubin.com/blog/rostok-self-hosted-scaffolder?utm_source=reddit&utm_medium=social&utm_campaign=rostok-launch
```

**8. Dev.to canonical cross-post**

```
https://antonshubin.com/blog/mig-tiny-self-hosted-scheduler?utm_source=devto&utm_medium=blog&utm_campaign=mig-launch
```

**9. Email signature / cold outreach**

```
https://antonshubin.com/catalog/free-architecture-audit?utm_source=email&utm_medium=profile&utm_campaign=audit-q3
```

## Build the link first, paste it second

Whenever drafting a post, draft the URL with UTMs _first_, paste it everywhere.
Never post a bare `antonshubin.com/blog/x` link — there is no going back to add
tags retroactively.

## Tracking setup

Umami's free tier already has campaign tracking. Tagged external links appear in
the Campaigns report automatically. Review monthly:

- Top 5 campaigns by visits
- Top 5 by visit → audit-form conversion
- Cut campaigns that drive traffic without conversions

## Naming campaigns

| Initiative                  | Campaign slug                                                                     |
| --------------------------- | --------------------------------------------------------------------------------- |
| Open-source repo launch     | `<repo>-launch` (`template-launch`, `rostok-launch`, `mig-launch`, `zond-launch`) |
| YouTube companion blog      | `<topic>-yt` (`mcp-yt`, `caldav-yt`)                                              |
| Per-client audit outreach   | `client-<name>-audit`                                                             |
| Quarterly audit funnel push | `audit-q<N>` (`audit-q3`)                                                         |
| LinkedIn credibility post   | `founder-pitch` (re-use across posts)                                             |

## Review cadence

Every Friday at 09:00 (10-min analytics ritual), open Umami → Campaigns. Note
the top 3 campaigns by visits and the top 3 by audit-form conversions.
End-of-quarter: cut campaigns with traffic but no conversions. Double down on
the ones that work.
