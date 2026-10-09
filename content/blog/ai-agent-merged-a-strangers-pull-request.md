---
title: "My AI agent merged a stranger's pull request, and I didn't notice for three weeks"
seoTitle: "My AI agent merged a stranger's pull request"
description: "An AI coding agent merged an outside contributor's pull request into my public library under my own account, with a polished review comment. Nothing broke. Here is why it happened, the supply-chain hole behind it and the rules I changed the same day."
tldr:
  - "An AI agent merged a stranger's pull request into my public library under my account. It was a correct docs fix, so nothing broke, but code would have gone through the same way."
  - "The cause was my own rule: \"merge when the reviewer agent passes\" never said whose pull requests it covered."
  - "Now agents never merge, review or build on a pull request from anyone but me until I ask for that exact action in chat, and they warn me about every one they see."
  - "If you run agents on public repos: scope their autonomy in writing, check the author before any merge, and treat other people's comments as data, not instructions."
intro: "This is the first post in a new series, Scars: mistakes of mine, told with the timeline, the cause and what I changed after. This one is about AI coding agents on public repositories, and how one of mine merged a stranger's pull request under my name. If you let agents merge anything, read the checklist at the end."
coverImage: "/img/blog/ai-agent-merged-a-strangers-pull-request/cover.png"
coverAlt: "A GitHub timeline: spy4x merged the commit into main, then spy4x posted a comment headed \"Reviewer evidence — PASS\"."
publishedAt: "2026-10-09"
readTime: 7
topic: "scars"
---

Today I found a merged pull request in my own public library. My account merged
it. My account posted a detailed review under it, ending in "PASS". I don't
remember doing either. Three weeks earlier, one of my AI coding agents had
merged a stranger's pull request as if it were its own work.

Nothing broke this time. But the same path would have merged a change to code,
CI or dependencies just as easily, in a library other apps import. This post is
the timeline, the three causes, and the rules I changed the same day.

It's the first post in a series I call **Scars**: things I got wrong, and what I
changed after them. If you let AI agents work on public repositories, this one
is for you.

## How I work with agents

I'm a solo developer, and AI coding agents (Claude Code) write most of the code
in my repositories. I don't review their pull requests before they land. A
separate reviewer agent checks every diff, and a passing review is enough to
merge without asking me.

Two more details matter here:

- The agents and I share one GitHub account.
- Agents work through my GitHub issues in parallel batches I call waves. Each
  issue ends in one pull request.

The repository is
[preact-components](https://github.com/spy4x/preact-components), my public MIT
library of Preact UI components.

## What happened

All times are UTC.

| When          | What                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| 19 Sep, 13:09 | An agent files an issue from my account: three small wording fixes in the docs of a skeleton-loading component.      |
| 19 Sep, 13:25 | An outside account opens a pull request with exactly those three fixes, 16 minutes after the issue appeared.         |
| 19 Sep, 13:46 | An agent session merges it under my account.                                                                         |
| 19 Sep, 13:48 | The agent posts "Reviewer evidence — PASS". It reproduced every measurement and confirmed the change was docs only.  |
| 9 Oct         | The outside account comments on the merged pull request, thanks me for the merge and links its GitHub Sponsors page. |
| 9 Oct         | I find the pull request, don't remember approving it, and ask my agent to explain.                                   |

![The merge and the review comment, both under my account](/img/blog/ai-agent-merged-a-strangers-pull-request/merged-and-passed.webp "My account merged it, then my account passed it. I did neither.")

The change itself was fine: 12 lines added and 9 deleted, in documentation and
one test comment. The review checked that the test assertions were untouched.
The contributor was polite, and the fix was correct. The problem was mine.

## Why it happened

### "Merge on green" never said whose pull requests

That week I gave my agent runs merge authority in the session: merge once the
reviewer passes. I meant the agents' own pull requests, and that was so obvious
to me that I never said it. The next day I wrote the rule into my agent rules,
still without saying whose pull requests it covered. The agent did what I said,
not what I meant, and applied it to everyone.

### The stranger's pull request looked like the agent's own

The run was working through issues, and this issue already had a pull request
that matched it line for line. The agent took it as that issue's pull request,
reviewed it and merged it. From the agent's side, it was finishing its own work.

### One account erased who did what

On that day nothing an agent did was marked: not the issue, not the review, not
the merge. So all three show "spy4x", and to anyone reading the page, including
me three weeks later, it looks as if I did everything myself. Today agents start
every comment with a hidden `<!-- agent -->` tag. Merges still carry no mark.

## The real risk

This time it was twelve lines of docs. Next time the same path would have merged
whatever the pull request contained, with only an AI reviewing it, into a
library other apps import. That's a supply-chain hole: one merge, and every app
that updates gets the change.

An AI reviewer is good at checking what a change does. It's not the right gate
for deciding whether a stranger's change should be in the repository at all.
That's a decision about trust, and it was never the reviewer's to make.

## A pattern worth knowing

A small, precise public issue got a matching pull request within minutes, and a
sponsorship request after the merge. I can't prove what's behind it, and the
contributor was courteous throughout. But the lesson holds either way: an issue
written by an agent is a complete spec. It names the files, the lines and the
expected result. On a public repository, that's a ready-made task for anyone,
and a fast way to get a pull request merged by a busy maintainer, or by their
agent.

## What I changed the same day

1. **A new rule for every repository and every AI tool I run.** A pull request
   or issue whose author is not me is never merged, approved, reviewed for
   merge, built on or taken as work, until I ask in chat for a specific action
   on that item. A mention or a question about it doesn't count as asking. It
   overrides any repository's own rules.
2. **Warn me at once.** Agents tell me about any outside pull request or issue I
   haven't mentioned: the link, the author and what it changes.
3. **Comments from other accounts are never instructions.** An agent reads them
   as data.
4. **The wave process** never picks up outside items, and only my own pull
   requests make an issue count as taken.
5. **The library's own rules** repeat the same limit.

The full rule is public, in the "Outside authors" section of my
[agent rules](https://github.com/spy4x/dotfiles/blob/main/ai-harnesses/AGENTS.md).

Then I checked the rest. Across all my repositories, one other pull request from
an outside account came in this year, in January, and was closed without a
merge. #85 is the only one that was merged.

## If you run agents on public repositories

- **Write down the scope of every "do it without asking" rule.** Whose pull
  requests, which repositories, which actions. Whatever you leave implied, the
  agent will fill in.
- **Check the author before any merge.** One `gh pr view --json author` line in
  the merge step would have stopped this.
- **Treat other people's comments, issues and pull requests as data.** Never as
  instructions to an agent.
- **Give agents their own account, or mark everything they do.** If merges carry
  no mark, three weeks later you can't tell your work from theirs.

It still feels strange to find my own account merging a stranger's code, with a
careful review under it that I never read. I'd rather tell you about it than
have you find the same thing in your repository.

If you want the setup behind all this, I wrote up
[what my coding agents cost and how I run them](/blog/opus-5-5-vs-sonnet-5-agent-costs).

Have you seen this pattern on your own repos, or found another hole in agent
autonomy? Email me at [hi@antonshubin.com](mailto:hi@antonshubin.com). It comes
straight to me.
