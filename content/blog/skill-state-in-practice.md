---
title: "I tried SKILL.state in my coding agents and stopped after four days"
seoTitle: "SKILL.state in practice: why I stopped after 4 days"
description: "SKILL.state replaces an AI agent's growing chat history with an explicit execution state. I ran it on real tasks in my Claude Code setup for four days, then stopped. Here is what helped, what got in the way and why the problem went away on its own."
tldr:
  - "SKILL.state swaps an agent's growing chat history for a state file and a fresh step each time. I ran my own version of it on real tasks and stopped after four days."
  - "The briefs were clean, but every run needed hand fixes, such as patches that failed the schema, invented timestamps, and a state folder that broke the linter."
  - "The problem it solves, context that grows until it is compacted, mostly went away when I moved to Opus 5.5: 2 of 48 units of work were compacted."
  - "The part worth keeping, a fresh agent per step with a self-contained brief, I already use without the state file."
intro: "A friend sent me the SKILL.state paper and later asked how it worked out. This is the answer: what I built from it, the four tasks I ran, and why I stopped. It is for anyone who runs coding agents on long tasks and wonders whether an explicit state file is worth it."
coverImage: "/img/blog/skill-state-in-practice/cover.png"
coverAlt: "The arXiv page of the paper \"SKILL.state: Scalable Long-Horizon Agent Skills\" with its title, authors and abstract."
publishedAt: "2026-10-30"
readTime: 5
topic: "scars"
---

In late September I read a paper that promised to fix the thing that bothered me
most about long agent tasks: the conversation grows until the agent forgets what
it was doing. I built my own version of it into my coding-agent setup, ran it on
real tasks, and switched it off four days later.

This is a post in my **Scars** series: things I tried or got wrong, and what I
changed after. If you run AI coding agents on long tasks and wonder whether an
explicit state file is worth it, it's for you.

## What is SKILL.state?

[SKILL.state](https://arxiv.org/abs/2608.26263) (Badhe, Tiwari and Chung, 2026)
is a runtime design for long agent tasks. Most agents keep everything in one
growing chat: every observation, action and piece of reasoning is appended to
the history. Over a long task that gets slow, and old, wrong details "poison"
later steps.

SKILL.state replaces that history with an explicit, mutable execution state. At
each step the model gets only three things: the skill it follows, the current
state, and the latest observation. Its reasoning is thrown away once it has
produced a valid state update. The paper reports better accuracy with much lower
token use.

## How I tried it

My agents run in Claude Code, which always keeps the full chat history. I can't
build every prompt myself the way the paper's runtime does, so I approximated
the idea with a skill:

1. **A state file per task.** The lead agent kept the task in a JSON file inside
   the worktree: the objective, the phase (spec, design, issue, implementation,
   review, merge), the decisions, the reviewer's findings and the next action.
2. **Changes only through a small CLI.** Every update was a patch the CLI
   checked against a schema before applying it, so a step could not leave the
   state broken.
3. **A fresh subagent per step.** Each step's work went to a new subagent whose
   whole brief was the skill, the current state and the latest observation. No
   conversation.

The plan was a fair comparison. My task flow alternated: one task with the
skill, the next without. Once each side had enough tasks, I would compare how
often the first review passed, how often I had to correct the agent, and the
minutes per task. The skill would become the default if it was at least as
reliable and not much slower.

## What happened

I stopped after four tasks: three with the skill, one without.

| Task | Flow        | Review rounds | Minutes |
| ---- | ----------- | ------------- | ------- |
| 1    | SKILL.state | 1             | 22      |
| 2    | SKILL.state | 2             | 122     |
| 3    | normal      | 2             | 25      |
| 4    | SKILL.state | 3             | 53      |

I didn't have to correct the agent in any of them, and none of the four
conversations was compacted. Four tasks prove nothing on their own. What made me
stop was what I saw inside them.

### What helped

The briefs were good. Each subagent got a small, self-contained frame and needed
no history. The reviewer needed no extra context. When a review asked for fixes,
a fresh implementer picked them up from the state alone.

### What got in the way

Every run with the skill hit at least two of these, and the lead agent fixed
them by hand:

- **Patches that failed the schema.** Subagents wrote state updates the CLI
  rejected, and the lead had to write some of them itself.
- **Invented timestamps.** The schema wanted a time on every finding. The
  subagents made them up, hours away from the real time, and the lead replaced
  them.
- **A state folder that broke the checks.** `deno fmt` and `deno lint` scanned
  the state folder, so it had to be moved out of the way before every check.

In one task a subagent also ignored an instruction not to push, and the lead had
to rewrite a public commit message. That one isn't the skill's fault, but more
handoffs meant more places for an instruction to get lost.

## Why I stopped

The problem went away on its own. In the middle of the experiment, I moved my
agents to Opus 5.5
([the numbers behind that switch](/blog/opus-5-5-vs-sonnet-5-agent-costs)).
After that, the median peak context was 162K tokens, and only 2 of 48 units of
work were compacted at all. The skill fought a problem I barely had anymore, and
it added bookkeeping to every task.

The comparison was also too slow to finish. At my pace, enough tasks on each
side would have taken weeks.

> A fix for a problem you no longer have is just overhead.

## What I kept

The best part of the idea didn't need the state file: a fresh agent for each
step, with a brief that holds everything it needs. That's already how my agents
work. A lead splits the work into lanes, each implementer starts clean with its
own brief, and a separate reviewer checks every diff. Later I removed the skill
from my setup.

My test was not the paper's setup. I approximated the idea inside a tool that
keeps the whole conversation, on a model with plenty of room. With a smaller
context window, a weaker model, or a runtime that builds every prompt itself,
I'd expect SKILL.state to do better than it did for me.

My agent rules and skills are public in my [dotfiles](/tools/dotfiles), if you
want to see how the lanes and briefs work.

Have you tried an explicit state file with your agents, and did it pay off?
Email me at [hi@antonshubin.com](mailto:hi@antonshubin.com). It comes straight
to me.
