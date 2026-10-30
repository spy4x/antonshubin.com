---
title: "My AI coding agent setup: one rules file, a worktree per task, and a reviewer that breaks the code"
seoTitle: "My AI coding agent setup, rules and reviewer"
description: "How I run several AI coding agents at once: one public rules source for three harnesses, a git worktree per task, and a reviewer that breaks the code to test the tests."
tldr:
  - "My agents' rules, skills and agents live once, in the public spy4x/dotfiles repo. One command renders them into Claude Code, OpenCode and DSH."
  - "Every task runs in its own git worktree, and parallel tasks never touch the same files, so agents can't overwrite each other's work."
  - "A separate reviewer agent checks every change. It breaks the code on purpose, and a test that stays green on broken code counts for nothing."
  - "It still breaks: an agent once merged a stranger's pull request, because my rule never said whose pull requests it covered."
intro: "I run several AI coding agents at once, and I don't review their pull requests before they land. This post shows the setup that makes that safe enough: where the rules live, how parallel tasks stay apart, and what the reviewer agent checks. It's for founders who want to know how I work, and for developers who run agents themselves."
coverImage: "/img/blog/ai-coding-agent-setup/cover.png"
coverAlt: "A terminal split in three columns: the same reviewer agent rendered as Claude Code's reviewer.md, OpenCode's reviewer.md and DSH's agent.cordis.yml."
publishedAt: "2026-10-30"
readTime: 9
topic: "ai-mcp"
relatedTool: "dotfiles"
---

AI coding agents write much of the code in my repositories, and I don't review
their pull requests before they land. That only works because of the setup
around them. This post walks through that setup, with real excerpts from the
public repository it lives in.

It's for two kinds of reader. If you're a founder thinking of hiring me, it
shows what happens to your code between "write this feature" and the merge. If
you run agents yourself, you can copy any part of it.

I already wrote about the numbers:
[what my agents cost per line on each model](/blog/opus-5-5-vs-sonnet-5-agent-costs)
and
[my first 30 days on Claude Code against three months on MiniMax M3](/blog/claude-code-vs-minimax-m3-30-days).
This post is about the machinery, not the bill.

## A few words first

- An **AI coding agent** is a language model that can run commands, read and
  edit files, and open pull requests, not only chat.
- A **harness** is the program that runs the agent: it gives the model its tools
  and loads its rules. I use three: Claude Code, OpenCode and DSH (a DeepSeek
  harness).
- A **subagent** is an agent another agent starts for one job, such as writing
  one feature or reviewing one pull request.
- A **git worktree** is a second working copy of the same repository, on its own
  branch, in its own folder.

Everything below is in [spy4x/dotfiles](https://github.com/spy4x/dotfiles). I
quote it at commit
[`9921684`](https://github.com/spy4x/dotfiles/tree/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses),
from 30 October 2026, so the links keep pointing at the text I describe.

## One rules source, three harnesses

Each harness wants its rules in its own place and format. Claude Code reads
`~/.claude/CLAUDE.md`, OpenCode and DSH read an `AGENTS.md`, and the three
describe a subagent in three different file formats. Keep three copies by hand
and they drift apart.

So everything lives once, in `ai-harnesses/`, and one command renders it.
Straight from
[the folder's README](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/README.md#L9-L12):

```bash
deno task ai           # apply: copy this directory into every installed harness
deno task ai --check   # write nothing; exit 1 if any harness differs from this directory
```

The source folder holds four kinds of thing:

1. `AGENTS.md`, the global rules every session reads. It's copied byte for byte
   to all three harnesses.
2. `agents/`, one file per subagent: the reviewer, the implementer, the designer
   and so on. There are 25 at this commit.
3. `skills/`, step-by-step instructions an agent loads when a task needs them,
   such as `wave` for running parallel work. There are 8.
4. `settings/` and `mcp.jsonc`, merged into each harness's own settings files.

An agent file is written once, in a neutral format. Its front matter says what
the agent may use (the reviewer's `tools: [read, search, shell]` leaves out the
edit tool) and a model tier (`strong`), and each harness's adapter turns that
into its own format and its own model name.

![A terminal split in three columns: the reviewer agent as Claude Code's reviewer.md with model opus, as OpenCode's reviewer.md with edit and webfetch denied, and as DSH's agent.cordis.yml. The body text, starting "You are the reviewer", is the same in all three](/img/blog/ai-coding-agent-setup/three-harnesses.webp "One reviewer, rendered for three harnesses")

`--check` answers one question: is what the harnesses read on this machine the
same as what's committed? A hand edit to a rendered copy makes it fail, and the
next `deno task ai` overwrites that edit. The rules file says so itself
([AGENTS.md, line 206](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L206-L208)):

<!-- deno-fmt-ignore -->
```markdown
- **One source.** Every harness gets its rules, skills, agents and settings from
  `dotfiles/ai-harnesses/`; `deno task ai` renders it into each (`ai-harnesses/README.md`). Edit
  the source, never a copy: the next `deno task ai` overwrites a hand edit to what it renders.
```

You can try it on your own machine; it writes nothing:

```bash
git clone https://github.com/spy4x/dotfiles && cd dotfiles && deno task ai --check
```

One more detail: the rules file has a size budget, because DSH reads at most 64
KiB of rules. A test fails past 850 lines or 56,000 bytes. At this commit the
file is 849 lines and 55,999 bytes, so a new rule first has to make room by
merging duplicates or moving history out.

## Rules a machine refuses to break

A rule in prose is a request. The model usually follows it, and once in a while
it doesn't. So the rules file has one more rule: whatever a machine can check
gets a check.

In Claude Code that check is a plugin, the `harness-rules` mod. It sees each
tool call and each new subagent before it runs, and can refuse it with a reason
the model reads. Here is the one that judges every new subagent
([`rules.ts`](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/settings/claude/mods/harness-rules/hooks/rules.ts#L32-L54)):

<!-- deno-fmt-ignore -->
```ts
export function spawnVerdict(spawn: Spawn, fiveHourPercent: number | undefined): Verdict {
  if (fiveHourPercent !== undefined && fiveHourPercent >= FIVE_HOUR_STOP) {
    return {
      deny: `The 5-hour limit is at ${fiveHourPercent}%. Start no new agent: let the running ` +
        `ones finish, post the handoff and end the turn.`,
    }
  }
  if (spawn.fork) return ALLOW
  if (spawn.model === undefined) {
    return {
      deny: `Pass \`model\` on every Agent call: an omitted one inherits the lead's model. ` +
        `Search and inventory: haiku. Everything else, implementers and reviewers ` +
        `included: opus.`,
    }
  }
  if (OPUS_ONLY.has(spawn.subagentType) && !spawn.model.includes(`opus`)) {
    return {
      deny: `${spawn.subagentType} runs on opus (global CLAUDE.md, "Subagents": implementers ` +
        `and reviewers run on opus).`,
    }
  }
  return ALLOW
}
```

1. At 90% of the five-hour usage limit, no new agent starts. A limit that hits
   halfway through a review throws that review away.
2. A fork, a copy of the current conversation, keeps its parent's model on
   purpose.
3. Every other subagent must name its model. Without one it inherits the lead's
   model, which is always the most expensive.
4. Implementers and reviewers must run on Opus. The
   [cost post](/blog/opus-5-5-vs-sonnet-5-agent-costs)'s update moved my
   implementers to Sonnet 5.5; the rules have since moved them back, because
   [Sonnet 5.5 did worse at both jobs](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L762-L767).

The same mod refuses `rm` of a shell variable (an empty one deletes from `/`), a
merge that bypasses branch protection, and new version 4 UUIDs in code. It also
refuses a GitHub issue or pull request body without the `<!-- agent -->` marker,
so I can tell my own comments from my agents'.

The README is honest about its limits: it reads a command's words, not what the
shell would run, and "the guard catches accidents, not deliberate leaks". That's
the right bar for it. It stops a confused agent; it isn't a sandbox.

## One worktree per task

I run several agents at once. Two agents in one folder corrupt each other's
work, so every task gets its own git worktree, a sibling folder next to the
repository, never inside it. The rules give the exact command
([AGENTS.md, "Git Flow"](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L584-L588)):

```bash
MAIN=$(realpath "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")")
WT="$(dirname "$MAIN")/worktrees/$(basename "$MAIN")/<type>/<slug>"
git fetch origin && mkdir -p "$(dirname "$WT")" && git worktree add -b <type>/<slug> "$WT" origin/main
```

Why not inside the repository? The repository's own format and type checks would
sweep the nested checkout in with everything else.

### Waves: parallel work that never collides

When there are several issues to build, a lead agent runs a **wave** (the
[`wave` skill](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/skills/wave/SKILL.md#L60-L83)).
The lead doesn't write code. It reads the issues, splits them into lanes, writes
one brief per lane and starts one implementer subagent per lane. The constraint
is files, not size:

<!-- deno-fmt-ignore -->
```markdown
- Lanes must be file-disjoint; that, not size, is the constraint. Start with 3 and scale by
  disjoint directories. One worktree per agent, branch `<type>/<slug>` from the latest `main`: two
  agents in one worktree corrupt each other. Parallelise reads, serialise writes.
```

"File-disjoint" means no two lanes change the same file. When every lane needs
the same change first, such as a database schema, that change is built and
merged alone, and only then do the lanes fan out.

Two more habits from the skill:

- **One issue per implementer.** The next issue goes to a fresh agent. Every
  step an agent takes re-reads its whole conversation, so the history of the
  last task makes every step of the next one cost more.
- **The brief is everything the agent sees.** It names the worktree, the files
  the lane may change, and what to do when stuck: decide, write the decision
  down, keep going.

## The reviewer: a second agent that breaks the code

The reviewer is the gate. Nothing merges until a separate reviewer agent passes
it, and that agent never wrote the code. Its definition opens like this
([`agents/reviewer.md`](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/agents/reviewer.md#L17-L21)):

<!-- deno-fmt-ignore -->
```markdown
You are the reviewer. You did not write this code and you owe its author nothing. Your output is
evidence; a finding without a reproduction is an opinion and does not ship. Rejection is a normal
outcome.

You never edit the author's worktree. You never fix. You never merge.
```

It can read files and run commands, but its tool list leaves out the edit tool,
and its instructions forbid touching the author's worktree. Then it works
through a fixed procedure. The step I'd copy first is **verify by mutation**:
break the code, run the test, and see whether it goes red
([reviewer.md, step 3](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/agents/reviewer.md#L42-L49)):

<!-- deno-fmt-ignore -->
```markdown
3. **Verify by mutation.** For each behaviour the change claims to test, break the implementation
   and confirm the test goes red. Do it in a disposable copy, never in the author's tree:
   `M=$(mktemp -d) && git worktree add --detach "$M" HEAD`, mutate there, run the one test file,
   then `git worktree remove --force "$M"`, which removes the folder too. Clean up only the paths
   you created, by name: the harness scratchpad and other agents' folders are shared, never yours
   to empty. A test that passes either way proves nothing: report it under **Not blocking**,
   unless the PR body's `Mutation:` line says that same break goes red, which is a false claim.
   Sample the riskiest 3–5 behaviours, not every line.
```

Why bother? A test that stays green when the code is broken looks exactly like a
good test in a green CI run. In the cost post, at least 7 of 20 failed first
reviews in one window were
[tests that stayed green on broken code, or a PR description that claimed something untrue](/blog/opus-5-5-vs-sonnet-5-agent-costs#most-prs-fail-their-first-review).

So the implementer has to do the same before the reviewer starts. Every test it
adds or changes needs one line in the pull request description
([implementer.md](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/agents/implementer.md#L81-L86)):

<!-- deno-fmt-ignore -->
```text
Mutation: <file:line> <what you changed> → <test name> → <its first failing line>
```

A pull request with a missing line goes back before any reviewer is spent. The
reviewer then repeats a sample of the breaks itself. If a line says a break goes
red and it doesn't, that's a false claim, and a false claim blocks the merge.

### What blocks a merge, and what doesn't

A reviewer that blocks everything is as useless as one that blocks nothing. So
the definition lists what may block: a bug, a security or data-loss risk, a
false claim, a failing check, or code the rules forbid outright. Everything
else, a nit, a missing test, a question, goes under "Not blocking". The lead
turns what holds up into a GitHub issue for later, instead of another round on
this pull request.

It also checks every claim in the description, such as "no new deps" or "all
call sites migrated": it counts or reruns each one. In the definition's own
words, "Overclaims are the highest-value catch."

A failed review goes back to the implementer, and the same reviewer checks the
fix. A pull request gets at most three failed reviews. After the third, the lead
finishes a fix of about ten lines itself, or leaves the pull request open with a
note on what's left.

## What goes wrong

All of this still breaks, and the public record shows how.

**An agent merged a stranger's pull request.** My rule said "merge when the
reviewer passes" and never said whose pull requests it meant. An agent applied
it to an outside contributor's pull request, under my account. The change was a
correct docs fix, but code would have gone through the same way. The whole story
is in
[My AI agent merged a stranger's pull request](/blog/ai-agent-merged-a-strangers-pull-request).
The rules now have an
["Outside authors" section](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L165-L171):
nothing from another account is merged, reviewed or built on until I ask for
that exact action in chat. The lesson I took: whatever a rule leaves implied, an
agent fills in.

**Most pull requests fail their first review.** In the cost post's data, most
pull requests from every model failed their first review on ordinary code.
That's the gate doing its job, and it's also the bill: in one window, fix rounds
were about 71% of what the implementers cost.

**The guard has holes, and says so.** The hook reads words, so it misses `rm`
inside `xargs` or `bash -c '…'`. The README lists those gaps instead of hiding
them. The prose rule still applies; the hook is a second net, not the only one.

## What this means if you hire me

However the code was written, I answer for the result. The agents do much of the
typing. I decide what gets built, write the spec, and set the rules they work
to, and those rules are public, so you can read them before we talk. My
[How I work](/how-i-work#hiw-ai) page says the same in four short paragraphs,
including what happens to your code.

If you run agents yourself, start with two things: one rules source with a check
that fails on drift, and a reviewer that has to break your code before it
believes your tests. The [dotfiles tool page](/tools/dotfiles) has a one-minute
clip of the first.

Do you run coding agents in parallel? Tell me what broke for you at
[hi@antonshubin.com](mailto:hi@antonshubin.com). It comes straight to me.
