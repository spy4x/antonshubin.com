---
title: "I tested Trail-code on my Claude Code agents. They ignored the map."
seoTitle: "Trail-code on Claude Code: a test on 10 real PRs"
description: "Trail-code promises cheaper, faster coding agents through a code map. I replayed 10 merged PRs with and without it, in both of its modes, with blind reviews. My agents barely touched the map, and the cost differences stayed inside run-to-run noise."
tldr:
  - "Trail-code's code map changed nothing for my Opus 5.5 agents over 10 tasks: 7 map calls in one mode, none in the other."
  - "Its prompt hook matched only 2 of 10 issue-sized briefs, so in most runs nothing was pushed to the agent."
  - "The same task's cost moved by about 13% from run to run. At that noise, 10 tasks can't prove a saving smaller than about 13%."
  - "Test a tool on your own work: replay merged PRs from the commit before, with and without it, review blind, and measure the noise first."
intro: "Trail-code promises cheaper, faster coding agents by giving them a map of your code. I replayed 10 merged PRs with and without it, in both of its modes, and reviewed every result blind. This post is what I found and how I tested it, so you can run the same test on the next tool that makes this promise."
coverImage: "/img/blog/trail-code-claude-code-test/cover.png"
coverAlt: "The per-task cost chart of round 2: 10.5% cheaper in total, inside the −13% to +13% noise, with the first tasks as dots over the shaded noise band."
publishedAt: "2026-10-22"
readTime: 8
topic: "ai-mcp"
relatedTool: "seed"
---

Trail-code says it makes Claude Code, Cursor and Codex faster and cheaper by
giving them a map of your code. Its README shows 32% lower cost and 60% less
time. It was trending, and my agents' bill is a number I watch every week, so I
tested it on my own work: 10 real tasks, two modes, blind reviews.

My agents barely touched the map. That is the short version. The longer version
is how I tested it, which you can reuse for the next tool that promises the same
thing.

## What Trail-code is

Trail-code (formerly graft) has two parts:

1. **The code map.** It parses your repo with tree-sitter into a graph of every
   file, function and caller. No model and no network: on my Seed repo, 885
   files took about 23 seconds. Agents query it for "where is X" and "who calls
   Y" instead of grepping.
2. **Learnings.** Agents save what they worked out from your conversations into
   files in the repo, so the next session starts from them.

I tested only the map. My agents work under written rules, and a decision only
lands in those rules after I approve it. Notes that agents write into the repo
on their own don't fit that.

## How I tested it

My agents work in waves: an implementer writes the code for one GitHub issue, a
separate reviewer checks it, and nothing merges until the reviewer passes it. I
wrote about the setup and its costs in
[Opus 5.5 vs Sonnet 5](/blog/opus-5-5-vs-sonnet-5-agent-costs).

Comparing two different weeks of work tells you nothing, because the tasks
differ. So I replayed work that was already done:

1. I picked 10 PRs that had already merged in [Seed](/blog/seed-saas-starter),
   my SaaS starter: auth and billing fixes, a refactor, infrastructure, caching,
   structured data, tests.
2. For each one I made a fresh clone at the commit **before** the PR, one commit
   deep, so the answer was nowhere in its history.
3. An Opus 5.5 implementer got the original issue as its brief and built it with
   the map and without it. The runs of a task went in parallel, so they saw the
   same machine load.
4. A reviewer checked every result **blind**, on a clean copy under a random
   letter, with the merged PR as a reference answer.
5. Afterwards I scanned every tool call to check that no agent peeked at the
   real repo or the real PR.

Trail-code gives an agent the map in two ways, so I tested both.

## Round 1: the map as tools ("pull")

The agent gets MCP tools like `trail_find_code` and `trail_trace_calls`, and
calls them when it wants to. I added one line to the brief: use the map before
grepping.

Over 10 tasks the agents made **7 map calls**. Everything else was `grep` and
`sed` through Bash, exactly as without the map. On the 9 comparable tasks, the
runs with the map cost 3.9% less in total, and the per-task change swung from
18% cheaper to 26% dearer.

<TaskCostChart round="pull" />

One task is left out. On the auth fix, the run without the map decided the fix
needed a new release of my shared library first, and stopped. The run with the
map searched the library, found the option was already released, and finished
the job. Its one map call had nothing to do with that. It was a different
judgment call on the same evidence.

## Round 2: the map pushed into the prompt ("push")

Trail-code's own benchmark found the bigger saving in "push" mode, where the
matching code reaches the agent without being asked for. In Claude Code, its
setup does this with hooks that run at session start, on every prompt and after
every edit, plus a skill that tells the agent to use `trail`.

I used exactly those hooks, taken from a real `trail init`, and gave them to
each run through its own settings file, so my global config stayed untouched.
This time the brief said nothing about the map: the hooks are the product.

The agents made zero map calls. Then I looked at what the hooks actually sent:

- At session start: about 3 KB of instructions to use `trail`.
- On the brief: "no strong match for this prompt" on 8 of the 10 briefs.
- After edits and searches: nothing.

So I fed the prompt hook by hand. The bare issue text of the refactor, which
names the exact file and the exact constant, got no match. One-line questions
did better, but not well: 2 of 7 returned the right files. "Where is the IPv6
sign-up rate limit?" worked. "Which file defines JOB_AGGREGATE_ID?" returned
nothing.

The prompt matching is built for a short chat message. My agents get issue-sized
briefs, so push mode mostly pushed nothing.

<TaskCostChart round="push" />

The push runs cost 10.5% less in total and took 8% less time. They also got the
worse reviews: 6 of 10 passed, against 8 of 10 without the map. And the saving
doesn't line up with the map: on the two briefs where the hook did send code,
one run got 11% dearer and the other 15% cheaper.

## The number that decides it: noise

A 10% saving when nothing reached the agent in 8 tasks out of 10? That can't be
the tool.

On the first four tasks I ran the baseline twice: two identical runs, same
model, same brief, differed by 7–12% in cost. Across all 10 tasks, **the cost
change with the map has a spread of about 13% from task to task,** in both
modes. That spread is the noise any saving has to beat.

> If two identical runs differ by 10%, a tool that saves 10% looks exactly like
> no tool at all.

That's the main thing I took away. Before you believe a saving, from a vendor or
from your own test, measure the noise. At 13% noise, 10 tasks can only show a
saving of about 13% or more. Neither mode got there, and the push mode's 10%
comes with worse reviews. Trail-code's 32% would have shown up clearly, and it
didn't.

How many tasks would you need? Set your own noise, then the saving a vendor
promised you.

<!-- deno-fmt-ignore -->
<RunsCalculator noise={13} saving={10} experimentTasks={10} marks={[{"value": 10, "label": "10%: my push round"}, {"value": 32, "label": "32%: Trail-code's claim"}]} />

## Why their benchmark and my test disagree

I don't think Trail-code's numbers are wrong. They measure something else:

- **Their tasks were questions about code**, answered by Sonnet 5. Mine were
  full implementations: read the issue, change the code, write tests, run
  checks.
- **Their agents started cold.** Mine read a repo with a detailed AGENTS.md, and
  Opus 5.5 navigates with grep quickly and cheaply. A map saves little when
  finding the file was never the expensive part.
- **Their prompts are short.** Push mode matches on the prompt, and a lane brief
  isn't a chat message.

If you use Cursor on a large repo you don't know, with short questions, your
result may well be different. That's the point: the only benchmark that answers
your question is your work.

## What it cost

Everything together, 34 implementer runs and 33 blind reviews: about $101 at API
list prices. That's cheap compared with a month of a tool that adds hooks to
every session and does nothing for it.

## Try this on the next tool

1. Pick merged PRs of different kinds. Ten is a good start.
2. Clone each at the commit before it, one commit deep.
3. Run the same agent with and without the tool, in parallel.
4. Review blind, with the merged PR as the reference answer.
5. Run the baseline twice, so you know your noise before you read any saving,
   and check with the calculator above whether your task count can show it.

Deciding whether an AI tool is worth it for your team? In a
[60-minute strategy session](/catalog/strategy-call) we can plan this test for
your own agents and repo.

Which tool should I put through this next? Reply to the newsletter or write to
me. And if you want the next test in your inbox, subscribe below.
