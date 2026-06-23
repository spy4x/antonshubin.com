# YouTube Video Ideas for a Solo Dev Channel That Actually Get Watched

I launched my YouTube channel in late 2023 and recorded about 12 videos before
taking a break. The mistake I made was filming "look at my code" content that
served nobody — not beginners (too much assumed), not senior devs (too much
overhead), not potential clients (no payoff). When I came back, I rebuilt the
content strategy from scratch.

This post is the content map I now use. It is built around three audiences I
actually want to reach — and a content mix that compounds instead of
churn-and-burn.

## The audience triangle

I have stopped trying to make videos for "developers" in the abstract. That is a
category, not an audience. The real audiences I want to reach are:

1. **Junior to mid-level developers** learning the craft. They watch "how-to"
   content with high intent and convert into long-term followers who eventually
   become peers, collaborators, or hires.
2. **Senior developers and tech leads** evaluating my taste. They watch short
   "watch me work" or "here is what I would do differently" videos to decide if
   I am the kind of person they would want on their team.
3. **Non-technical founders and operators.** This is my actual client base. They
   watch "what does it cost / what does it look like" videos to de-risk hiring
   me.

Each audience has a different video format, a different length, and a different
title formula. The mistake is making one video for three audiences. The win is
matching the format to the audience.

## The format mix (per 10 videos)

| Format                             | Count | Audience          | Length    | Goal                           |
| ---------------------------------- | ----- | ----------------- | --------- | ------------------------------ |
| Build-in-public walkthrough        | 3     | Senior + juniors  | 15–25 min | Show taste, attract followers  |
| Architecture decision breakdown    | 2     | Seniors + clients | 10–15 min | Show judgment, attract clients |
| Cost / "how much does X cost"      | 2     | Founders          | 6–10 min  | Top-of-funnel for client work  |
| Bug hunt / post-mortem             | 1     | All               | 8–12 min  | Build trust, get shares        |
| Tooling comparison / opinion piece | 1     | Seniors + juniors | 12–18 min | SEO, evergreen traffic         |
| Personal essay / career story      | 1     | Founders          | 4–6 min   | Build human connection         |

This is intentionally heavier on build-in-public and architecture content
because those are the videos that compound. A "how much does a SaaS MVP cost"
video filmed today will still be relevant in 18 months. A "look at my new
Next.js feature" video is dead in 6 months.

## 30 video ideas that match the mix

Below is a topic list I keep in a Notion doc and pick from each week. Each one
maps to one of the formats above. I tag every idea with the audience triangle so
the title can be tuned.

### Build-in-public (3 ideas minimum per quarter)

1. Building a CalDAV Task Manager as a PWA from scratch — episode 1: scaffolding
2. Building a CalDAV Task Manager — episode 2: implementing VTODO
3. Building a CalDAV Task Manager — episode 3: PWA + offline support
4. Building a custom MCP server for a protocol I actually use — part 1
5. Building a custom MCP server — part 2: shipping to Open WebUI
6. Migrating my home server from Prometheus to VictoriaMetrics live
7. Self-hosting a CalDAV server and connecting it to Radicale + Thunderbird
8. Setting up Authentik SSO across 5 self-hosted services
9. Building a self-hosted email server (Docker Mailserver) from zero
10. Building a self-hosted analytics stack (Plausible + Umami)

### Architecture decision breakdowns (2 per quarter)

11. Why I run a $50/month Hetzner server instead of AWS
12. Why I picked Preact over React for my SaaS frontends
13. Why I write CQRS in a 2-person team (and when I do not)
14. Why I self-host instead of using Vercel + PlanetScale
15. Monorepo vs polyrepo in 2026 — what I actually do
16. SQLite vs Postgres for solo SaaS — the real tradeoffs
17. Why my MCP servers speak Streamable HTTP, not stdio

### Cost / "how much does it cost" (2 per quarter)

18. How much does it cost to build a SaaS MVP in 2026? Real breakdown
19. How much does it cost to run 20+ self-hosted services on one server
20. How much does Cal.com self-hosted cost to operate at scale
21. How much does an email server cost in 2026 (compute + sending fees)
22. How much does an AI agent cost per month (Open WebUI + DeepSeek + Claude)

### Bug hunt / post-mortem (1 per quarter)

23. The day my home server ran out of disk at 3 AM — and what I changed
24. How a typo in my docker-compose file took down 5 services for 2 hours
25. The time a CalDAV URL encoding bug cost me 4 hours of debugging

### Tooling comparison / opinion (1 per quarter)

26. VictoriaMetrics vs Prometheus + Loki — measured on the same workload
27. Cal.com vs Cal.diy vs SavvyCal — what I actually use and why
28. Authentik vs Authelia vs Keycloak — for self-hosters in 2026

### Personal essay / career (1 per quarter)

29. The 6 months that turned me from $2/hour Upwork dev to $150/hour fractional
    CTO
30. Why I am leaving hourly billing forever (and what I am doing instead)

## The title formula

The title is 80% of the click-through rate. I use four patterns depending on
audience.

**For founders (client acquisition):**
`"How much does [X] cost in [year]? Real breakdown"`
`"What [X] actually looks like in production — not the demo"`
`"I built [X] for [audience]. Here is what I learned."`

**For seniors (peer respect):** `"Why I switched from [A] to [B] after 3 years"`
`"The architecture mistake I keep making in [X]"`
`"[A] vs [B] in 2026: the real tradeoff"`

**For juniors (growth):** `"How to [specific task] in [N] minutes"`
`"[Common pitfall] in [tech] — and the fix"`
`"Building [thing] from scratch — full tutorial"`

**For all (evergreen + shareable):**
`"I [did X] and [Y happened]. Here is the post-mortem."`
`"The [tech] feature nobody talks about"`

## Production rules

After two years of recording, I have hard rules:

1. **Record in 25-minute takes, not 60.** Cut into shorter videos in post.
2. **Show real code, real terminal, real bugs.** Green-screen "explainer" videos
   underperform screen-share "watch me work" videos 5:1 in my data.
3. **Pin a comment linking to the GitHub repo** for every build-in-public video.
   This compounds — the repos are indexed, they get stars, and they pre-sell my
   services.
4. **End with a single CTA.** Either "subscribe if you want more" or "book a
   free audit if you want help" — never both.
5. **Write a satellite article** (see next post in this series) for every video.
   The article does the SEO work, the video does the brand work.

## What I do not do

I do not chase trends. I do not post daily. I do not film my face for more than
90 seconds per video. I do not explain the same concept twice. I do not
apologise for my English on camera.

## Compounding

The point of all this is not one viral video. It is that every video:

- Indexes on YouTube and Google (with the satellite article)
- Lives on my portfolio site (antonshubin.com)
- Drives traffic to my calendar (free 30-min intro call)
- Builds authority with a specific audience

Three years of this produces something hard to fake: a content archive that
pre-sells. A founder Googles "how much does a SaaS MVP cost" and lands on one of
my videos. They watch three more. They see the calibre. They book the call. The
funnel works because the content was there, ahead of the demand.

That is the game.
