---
title: "Claude Code vs MiniMax M3: 30 days against 3 months, in merged pull requests"
seoTitle: "Claude Code vs MiniMax M3: 30 days of real numbers"
description: "I counted my GitHub output for three months on MiniMax M3 and my first 30 days on Claude Code: 19 times more merged pull requests a day. Here is what that number hides, what actually shipped, and how to count your own."
tldr:
  - "My first 30 days on Claude Code merged 1,845 pull requests, 61.5 a day. The three months on MiniMax M3 before it merged 295, 3.2 a day: about 19 times fewer."
  - "Much of the jump is not the model alone. My agents worked 6.3 times as many hours, and I stopped reviewing every pull request myself."
  - "Per hour of work the gain was 3 times, and pull requests got slightly smaller, not bigger. Volume is not value: 227 released versions are the better number."
  - "The plan costs four times as much, yet the subscription cost per merged pull request fell to about a fifth."
intro: "For three months my coding agents ran on MiniMax M3, then I moved to Claude Code. This post counts what changed on my GitHub account, and is honest about how much of it the model did and how much came from changing how I work. It's for developers choosing an AI coding setup, and for anyone who wants to measure theirs."
coverImage: "/img/blog/claude-code-vs-minimax-m3-30-days/cover.png"
coverAlt: "My GitHub contribution graph from April to October: pale squares through the summer, then much brighter ones from late September."
publishedAt: "2026-10-20"
readTime: 9
topic: "ai-mcp"
---

![My GitHub contribution graph for the last year: dim green squares through the summer, then the brightest squares of the year from late September, when I moved to Claude Code](/img/blog/claude-code-vs-minimax-m3-30-days/contributions.webp "My GitHub contribution graph on 20 October 2026. The bright squares on the right are the Claude Code month.")

On 20 September I moved my coding agents from MiniMax M3 to Claude Code. In the
30 days after, my GitHub account merged **1,845 pull requests**. In the three
months before, it merged 295.

That's about 19 times as many per day. It's also the kind of number that gets a
post laughed off Hacker News, because it hides almost everything that matters.
So this post gives you the number, and then takes it apart.

**What is it about?** Real counts from my own GitHub account, two periods, and
the other things that changed at the same time, named. **Who is it for?**
Developers deciding whether a $200 subscription is worth it over a $50 one, and
anyone who runs AI agents and wants to measure what they actually get. At the
end there's a way to count your own.

## The two periods

- **The M3 months**, 20 June to 19 September 2026 (92 days). MiniMax M3 on its
  $50-a-month plan was my subscription, used through OpenCode and DSH. It wasn't
  the only model I ran; more on that below.
- **The Claude Code month**, 20 September to 19 October 2026 (30 days). Claude
  Code on Claude Max, $200 a month, with agents on Opus and Sonnet models.
  [My previous post](/blog/opus-5-5-vs-sonnet-5-agent-costs) covers which model
  does what, and why.

The counts come from GitHub's search and API: pull requests authored by my
account and merged on a given day, commits on default branches, tags, releases
and issues. Private repositories are included. Days are counted in my time zone.
Which model ran when comes from my local agent logs.

## The numbers

| Per period                    | M3, 92 days | Claude Code, 30 days | Per day |
| ----------------------------- | ----------: | -------------------: | ------: |
| Merged pull requests          |         295 |                1,845 |   19.2× |
| Merged changed lines          |     263,000 |            1,242,000 |   14.5× |
| Median pull request, lines    |         266 |                  228 |   0.86× |
| Commits on main               |         482 |                1,980 |   12.6× |
| Issues closed                 |         132 |                1,150 |   26.7× |
| Git tags                      |           3 |                  228 |         |
| Days with at least one commit |    46 of 92 |             30 of 30 |         |
| Hours with a commit, per day  |         1.8 |                 11.5 |    6.3× |
| Pull requests per such hour   |        1.77 |                 5.36 |    3.0× |

"Changed lines" is additions plus deletions, as GitHub counts them.

![Merged pull requests per day from 20 June to 19 October 2026. The M3 months average 3.2 a day, with one spike of 63 on 19 September. From 20 September Claude Code averages 61.5 a day and peaks at 161](/img/blog/claude-code-vs-minimax-m3-30-days/prs-per-day.svg "Merged pull requests per day. The dashed line is the switch to Claude Code.")

The jump is real. It's also not one thing.

## What the headline hides

![Per day, the Claude Code month against the M3 months: issues closed 26.7 times, merged pull requests 19.2 times, changed lines 14.5 times, commits 12.6 times, hours with a commit 6.3 times, pull requests per such hour 3.0 times, median pull request size 0.9 times](/img/blog/claude-code-vs-minimax-m3-30-days/per-day-ratios.svg "The same month, split into how much more time and how much more per hour.")

### More hours, not just faster hours

In the M3 months my account committed something on 46 days out of 92, in about
3.6 hours of each of those days. In the Claude Code month it committed every
single day, in 11.5 different hours of the day on average.

Those aren't my working hours: most commits come from agents, not from me at the
keyboard. But the split is the honest one: about 6 times more hours of work, and
about 3 times more merged pull requests in each of those hours. If you expected
a new model to make the same amount of work 19 times faster, that's not what
happened.

### I stopped reviewing every pull request

This change isn't in any chart.

With M3, I reviewed every pull request myself before it merged, because I
couldn't trust it. That made me the bottleneck: agents can open pull requests
much faster than one person can read them.

With Claude Code and the rules in my
[dotfiles repository](https://github.com/spy4x/dotfiles), about 99% of what the
agents wrote matched what I would have written. So I stopped. A separate
reviewer agent now checks every pull request: it runs the tests, breaks the code
on purpose to see whether a test goes red, and checks every claim in the
description. Nothing merges until it passes. That removed the bottleneck, and it
only works because the output became predictable enough to trust a second agent
with the check.

### The whole workflow changed at the same time

I didn't just swap the model. In the same weeks I started working in waves: one
lead agent splits a list of GitHub issues into lanes that touch different files,
and a separate agent builds each lane in its own git worktree. Every unit of
work became its own pull request, squash-merged, so one pull request now means
one commit on main.

So the gain belongs to several things at once: the model, the harness, the
workflow and my own review leaving the loop. I can't separate them from this
data, and I won't pretend I can.

### The M3 months weren't only M3

M3 was my subscription, but I tried other models along the way, and my logs say
so. They only start in mid-July (OpenCode) and early September (DSH), and in
them:

- In September, GPT-5.6 and GPT-6 models gave 717 replies in OpenCode, against
  431 from M3. That was a $20 ChatGPT subscription I was experimenting with.
- In August, DeepSeek V4 Flash gave 249 replies in one OpenCode session.
- On 18 and 19 September, about 300 DSH sessions ran on DeepSeek V4 Flash, and
  45 more on 20 September, the first day of the Claude Code month.

DeepSeek was my main provider before MiniMax. I moved to M3 when DeepSeek raised
its prices, and kept using DeepSeek's paid API now and then.

So "M3 against Claude Code" is really "my setup before against my setup after",
with M3 as the main subscription before.

### A first month has a backlog to clear

The first month on a new tool can be a burst: ideas that waited for the
capacity, and the fun of a new toy. Week by week, the Claude Code month merged
501, 529, 259 and 438 pull requests, so there's no clear fall-off yet, just one
quiet week in the middle. Ask me again in three months.

### Volume is not value

1.24 million changed lines sounds impressive and means little. Lines include
lock files and generated data: three data imports into one of my private
repositories added up to about 98,000 lines on their own.

What I checked instead is whether pull requests just got smaller, which would
inflate the count for free. They didn't: the median went from 266 changed lines
to 228. The slicing got a bit finer, not ten times finer.

Issues closed rose the most, 26.7 times. Part of that is agents filing issues
for what they notice, then other agents closing them, so read it with care.

### The day before the switch

One more caveat, against myself. The last day of the M3 period, 19 September,
had 63 merged pull requests, more than any other day before the switch. My agent
logs show that on that day I ran most agents on DeepSeek V4 Flash, not M3. Leave
that day out and the M3 months average 2.5 pull requests a day, which makes the
Claude Code month about 24 times as busy, not 19. I kept it in to be
conservative.

## What actually shipped

Pull requests are a means. These are the tags pushed in the Claude Code month,
all of them public:

- [ts-libs](/tools/ts-libs), my shared TypeScript libraries on JSR, went from
  v1.0.0 to v1.81.0.
- [preact-components](/tools/preact-components), my component library, went from
  v0.1.0 to v8.6.1. I wrote about
  [why I built it instead of using shadcn](/blog/preact-component-library-without-shadcn).
- [caldav-mcp](/tools/caldav-mcp) went from v1.0.0 to v1.6.0.
- [mig](/tools/mig), [rostok](/tools/rostok) and
  [caldav-tasks-web](/tools/caldav-tasks-web) got 23, 25 and 17 release tags,
  and [Seed](/tools/seed) got one, `v1-final`, which marks its old code rather
  than a release.

That's 228 tags, 227 of them versions, against 3 tags in the three months
before. A release tag is a version someone else can install, which makes it a
better count of shipped work than pull requests.

## What it cost

Subscription money only:

|                         | M3 months | Claude Code month |
| ----------------------- | --------: | ----------------: |
| Subscription            |   3 × $50 |          1 × $200 |
| Per merged pull request |     $0.51 |             $0.11 |
| Per 100 merged lines    |    $0.057 |            $0.016 |

The pricier plan came out at about a fifth of the cost per merged pull request.
That doesn't count the $20 ChatGPT experiment or the occasional DeepSeek API
calls, or my own time, which is the expensive part.

Cost per pull request only means something if the pull requests are good. My
quality guard is the reviewer agent's first-pass rate, and in
[the Opus 5.5 vs Sonnet post](/blog/opus-5-5-vs-sonnet-5-agent-costs) I showed
how much it varies by model: a cheaper implementer that fails its first review
more often gives part of the saving back in fix rounds.

## Did M3 get worse over time?

It felt that way to me. When I started, M3 felt overpowered for the price. Then
MiniMax ran into a backlash from users over a pricing change, and a week or two
after that I started to feel that M3 got dumber. It made mistakes more often, I
had to hold its hand a lot, and I had to review every pull request because I
couldn't trust it.

My guess is that they found another way to make it cheaper to run, for example a
more heavily quantized model. That's only a guess: I have no proof, and MiniMax
hasn't said anything like it.

My data can't settle it either. My local logs from the M3 months are thin: about
660 model replies in OpenCode over 16 days and a dozen sessions in DSH, with no
record of where one task ends and the next begins. In August they show 30 API
errors, mostly "high load" and "usage limit reached" responses. That's not
enough to measure mistakes per task, let alone a trend.

For comparison, I trust Opus now the way I never trusted M3. I can't say the
same about Sonnet yet: in my last cost comparison it passed its first review far
less often.

## How to count your own

The pull request counts come from GitHub search, one day per query, because a
search returns at most 1,000 results:

```bash
gh api graphql -f query='
query($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { additions deletions repository { nameWithOwner } } }
  }
}' -f q='is:pr author:YOUR_LOGIN is:merged merged:2026-10-01'
```

1. `is:pr author:YOUR_LOGIN is:merged` counts pull requests you authored and
   merged, in every repository your token can see.
2. `merged:2026-10-01` is one UTC day; loop over the days of each period and
   when `hasNextPage` is true, run it again with `-f after=<endCursor>`.
3. `additions` and `deletions` give changed lines. Take the median, not the
   mean: one generated file can swamp a month.
4. For hours worked, use the REST commit search,
   `gh api -X GET search/commits -f q='author:YOUR_LOGIN committer-date:2026-10-01'`,
   and count the distinct hours that have a commit. It only sees default
   branches, allows 30 requests a minute, and finds a commit twice when two
   repositories share history, so count each commit hash once.

Compare per day, not per period, and write down everything else you changed in
the same weeks. That list is the honest part of the result.

## What's next

The obvious question is how: which rules made the agents' output predictable
enough that I stopped reading it. The whole setup is public in
[spy4x/dotfiles](https://github.com/spy4x/dotfiles), and my next post walks
through it, with the incident behind each rule.

If you've measured your own switch between models, I'd like to see your numbers,
especially if they disagree with mine. My email is in the footer.
