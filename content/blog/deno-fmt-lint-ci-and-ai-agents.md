---
title: "Code formatting and linting in 2026: deno fmt, deno lint, a CI gate, and AI agents held to it"
seoTitle: "Code formatting and linting in 2026: my setup"
description: "My formatting and linting setup: deno fmt and deno lint, a CI step that blocks the merge, AI agents held to the same check, and what to pick on Node or Bun."
tldr:
  - "On Deno, deno fmt and deno lint replace Prettier and ESLint: no packages, a few lines in deno.json."
  - "deno fmt reads .editorconfig for indentation, line width and line endings; deno.json wins, and quote_type is ignored."
  - "The check counts only when CI runs it and a red run blocks the merge, for people and AI agents alike."
  - "On Node or Bun: Biome for one tool that formats and lints, dprint for many languages, or keep a working Prettier setup."
intro: "In 2022 I wrote about Prettier. My TypeScript projects run on Deno now, and formatting needs no extra package, so here is the setup I use in them today: the config, the CI step that blocks a merge, and the rules that hold my AI agents to the same check."
coverImage: "/img/blog/deno-fmt-lint-ci-and-ai-agents/cover.png"
coverAlt: "Step logs of a Woodpecker CI run: deno fmt --check printed Checked 128 files, deno lint printed Checked 52 files, and deno task test follows."
publishedAt: "2026-10-30"
readTime: 8
topic: "ai-mcp"
relatedTool: "dotfiles"
catalogSlug: "codebase-health-audit"
---

In 2022 I wrote about
[code formatting with Prettier](/blog/the-importance-of-code-formatting-with-prettier):
Husky, lint-staged and a `.prettierrc`. That post is archived now, because my
TypeScript projects run on Deno, and Deno ships a formatter and a linter in the
same binary.

This post is the setup I use in my TypeScript repositories today. It's for
developers and tech leads who want formatting and linting that nobody has to
think about, and for teams where AI agents write part of the code. If you're on
Node or Bun, the last section compares Prettier, Biome and dprint as they are
this month.

## Format and lint with what the runtime ships

Here is the whole formatter config of this site, from
[`deno.json`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/deno.json#L2):

```json
"fmt": { "semiColons": false },
```

One option. Everything else is Deno's default: 2 spaces, double quotes, 80
columns. My shared libraries spell it out, in
[`spy4x/ts-libs/deno.jsonc`](https://github.com/spy4x/ts-libs/blob/12f950ac3929e9d4ffc5977c2cba022c154a19ea/deno.jsonc#L186-L198):

```jsonc
"fmt": {
  "useTabs": false,
  "lineWidth": 100,
  "indentWidth": 2,
  "singleQuote": false,
  "semiColons": false,
  "proseWrap": "preserve"
},
"lint": {
  "rules": {
    "tags": ["recommended"]
  }
},
```

1. `useTabs` and `indentWidth`: spaces, two of them.
2. `lineWidth`: 100 columns instead of the default 80.
3. `singleQuote: false`: double quotes, the default, written down so nobody
   wonders.
4. `semiColons: false`: no semicolons, except where JavaScript needs one.
5. `proseWrap: "preserve"`: leave line breaks in Markdown alone. The default,
   `always`, rewraps every paragraph to the line width.
6. `lint.rules.tags`: the `recommended` rule set. Deno's linter has
   [over 100 rules](https://docs.deno.com/runtime/reference/cli/lint/); the tags
   switch on groups of them.

This site adds the `fresh` tag for its web framework and turns one rule off,
[in the same `deno.json`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/deno.json#L33-L36):

```json
"lint": {
  "rules": {
    "tags": ["fresh", "recommended"],
    "exclude": ["react-no-danger"]
  }
},
```

`react-no-danger` flags `dangerouslySetInnerHTML`, and the site uses it on
purpose to render its own Markdown posts and JSON-LD. Turning a rule off is
fine. Doing it in one visible place, instead of in a comment on every line, is
the point.

The commands:

```bash
deno fmt            # format everything
deno fmt --check    # change nothing, exit non-zero if a file isn't formatted
deno lint           # report problems
deno lint --fix     # fix what the rules can fix
```

`deno fmt` covers TypeScript, JavaScript, JSON, Markdown, CSS, HTML, YAML and
more, per its
[reference page](https://docs.deno.com/runtime/reference/cli/fmt/). Vue, Svelte,
Astro and SQL need an `unstable` flag. No package, no plugin, no version to keep
in sync with your editor.

## Where .editorconfig fits

`.editorconfig` is the file most editors read for indentation and line endings.
`deno fmt` reads it too, but only to fill gaps: indentation (`indent_style`,
`indent_size`, `tab_width`), line width (`max_line_length`) and line endings
(`end_of_line`). The order is CLI flags first, then `deno.json`, then
`.editorconfig`, then defaults.

I checked it with Deno 2.9.7:

```bash
printf 'root = true\n\n[*]\nindent_style = tab\nquote_type = single\n' > .editorconfig
printf 'function greet(name: string) {\n  return "Hi, " + name\n}\n' > a.ts
deno fmt a.ts && cat a.ts
```

With no `deno.json`, the file comes out indented with a tab, as `.editorconfig`
asked, and still with double quotes. Add
`{ "fmt": { "useTabs": false, "semiColons": false } }` as `deno.json`, run it
again, and you get two spaces and no semicolon: `deno.json` wins.

That `quote_type` line isn't made up for the example. This site's own
[`.editorconfig`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/.editorconfig)
says `quote_type = single`, while the code uses double quotes, and
`deno fmt --check` passes. The formatter never reads that line.

So `.editorconfig` is for what it is good at: editors that don't run the
formatter on save, and files the formatter doesn't touch, like shell scripts.
Its indentation and line-ending settings reach `deno fmt` too, unless
`deno.json` sets them.
[mig's](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/.editorconfig)
is a good shape to copy: spaces, two of them, LF line endings, UTF-8, trim
trailing whitespace except in Markdown. The style rules themselves live in one
place, the formatter's config.

## Make the check a gate, not a habit

A formatter on save is a convenience. What keeps a codebase consistent is a
check that fails the build. This is the CI step of my dotfiles repository,
[`.woodpecker.yml`](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/.woodpecker.yml#L8-L18):

```yaml
steps:
  check:
    image: denoland/deno:2.9.7
    commands:
      # The image has neither `git` nor `ps`; the env-key-copy and sweep-orphans tests run both.
      # The secrets-backup test runs `restic`; the demo-video encoder test runs ffmpeg and fc-match.
      - apt-get update -qq && apt-get install -y -qq --no-install-recommends git procps restic ffmpeg fontconfig
      - deno --version
      - deno fmt --check
      - deno lint
      - deno task test
```

Here is that step in a real run,
[pipeline 368](https://ci.antonshubin.com/repos/13/pipeline/368/3):

![Step logs of the check step in a Woodpecker CI run: deno fmt --check printed "Checked 128 files", deno lint printed "Checked 52 files", then deno task test, and the step ended with exit code 0](/img/blog/deno-fmt-lint-ci-and-ai-agents/ci-check-step.webp "Format and lint come before the tests")

Format and lint come first, so a style slip fails the run before the tests even
start. This site's CI runs one task instead, `deno task check`, which is
`deno fmt --check . && deno lint . && deno check` followed by the tests.

Two more things make it a gate rather than a suggestion:

1. **The main branch is protected.** A pull request merges only when the
   Woodpecker check is green, admins included, and nothing pushes to `main`
   directly. On GitHub that is one required status check in the branch
   protection settings.
2. **A local hook for fast feedback.** Seed, my SaaS starter, has a task that
   installs a pre-commit hook running the same check,
   [in its `deno.jsonc`](https://github.com/spy4x/seed/blob/f290a837fee251f95537251ed78e41bcdba5989c/deno.jsonc#L145-L146):

   ```jsonc
   "hooks:install": "deno run -R=deno.json,deno.jsonc,.git/hooks/ -W=.git/hooks/ jsr:@hongminhee/deno-task-hooks@0.1.2",
   "hooks:pre-commit": "deno task check"
   ```

   A hook can be skipped with `git commit --no-verify`, so it's a convenience
   too. CI is the gate.

Compared with my 2022 setup, Husky and lint-staged are gone: the task runner and
the formatter are already in the runtime.

## AI agents pass the same checks

I run several AI coding agents at once. Their rules live in one file in my
[dotfiles](https://github.com/spy4x/dotfiles), rendered for each harness. Two
parts of those rules matter here.

First, an agent may not make a check easier to pass. From
[`ai-harnesses/AGENTS.md`](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L199-L200):

> Never add, remove, reword or weaken a rule, and never remove or weaken a check
> (lint or format config, a `check` task, a CI step), unless I asked for that
> change in chat.

So when a lint rule fails, the fix goes into the code, not into `deno.json`.

Second, an agent may not merge around the check. A Claude Code hook in the same
repository reads every shell command an agent runs, before it runs, and refuses
`gh pr merge --admin`, the flag that skips branch protection,
[in `rules.ts`](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/settings/claude/mods/harness-rules/hooks/rules.ts#L236-L243):

```ts
function mergeVerdict(words: string[]): Verdict {
  if (words.includes(`--admin`)) {
    return {
      deny: `Never pass \`--admin\` to \`gh pr merge\`: the branch protection is the owner's. ` +
        `Wait for the check with \`timeout 900 gh pr checks <n> --repo <owner>/<repo> ` +
        `--watch\`, or leave the PR open and say so.`,
    }
  }
```

The rest is the same gate a person gets: the agent runs the check locally the
way CI does, with an empty cache
([the rule](https://github.com/spy4x/dotfiles/blob/9921684b5bfcc6e3d1e46bd32f54714ca339b737/ai-harnesses/AGENTS.md#L703-L709)),
and CI runs it again on a clean machine.

Why bother? An agent writes a lot of code quickly, and a formatter turns that
code into the same shape as mine, so a diff shows only what changed in meaning.
A linter catches the careless kind of mistake before a reviewer, human or agent,
spends time on it. And a rule written only in prose is a rule an agent can
misread; a red CI run can't be misread.

## If you're not on Deno: Prettier, Biome and dprint

Each one's latest release and docs as of 30 October 2026:

| Tool                                  | Release | Does                                | CI command         |
| ------------------------------------- | ------- | ----------------------------------- | ------------------ |
| [Prettier](https://prettier.io/docs/) | 3.9.10  | Formats; lint is a separate tool    | `prettier --check` |
| [Biome](https://biomejs.dev/)         | 2.6.4   | Formats and lints in one tool       | `biome ci`         |
| [dprint](https://dprint.dev/)         | 0.64.3  | Runs formatter plugins from one CLI | `dprint check`     |

**Prettier** formats JavaScript, TypeScript, CSS, HTML, Markdown and YAML, plus
Vue, Angular, MDX and Handlebars templates. It has stopped adding options on
purpose, which is a feature. It doesn't lint, so a real setup is Prettier plus
ESLint (10.13.0 this month): two tools, two configs, two commands in CI.

**Biome** formats and lints JavaScript, TypeScript, JSON, CSS, GraphQL and more
as one tool with one config file. Its site claims 97% compatibility with
Prettier's output and 670 lint rules. `biome ci` runs the format check, the
linter and its assist actions without changing a file, and
`biome migrate prettier --write` and `biome migrate eslint --write` carry your
existing configs over.

**dprint** is a formatting platform: one CLI and one config that run plugins,
mostly WebAssembly, for TypeScript, JSON, Markdown, TOML, Dockerfiles and more,
and wrappers around Prettier, Biome, Ruff and others for the rest. It caches
results, so repeat runs are fast. It doesn't lint. Fun fact: `deno fmt` itself
is built on dprint's TypeScript, JSON and Markdown plugins, compiled into the
binary; they're in
[Deno 2.9.8's `Cargo.toml`](https://github.com/denoland/deno/blob/v2.9.8/Cargo.toml#L370-L374).

What I'd pick:

1. **A new JavaScript or TypeScript project on Node or Bun:** Biome. One tool
   and one command is the closest thing to `deno fmt` plus `deno lint`.
2. **A repository with many languages** (TOML, Dockerfiles, Markdown, Python):
   dprint, with a linter per language next to it.
3. **A Prettier and ESLint setup that already works:** keep it. Add
   `prettier --check .` and `eslint .` to CI and make the step required. That
   gate is worth more than switching tools.

## Your turn

Open your CI config. If it doesn't run a format check and a linter, or a red run
doesn't block the merge, fix that before the next pull request, whether a person
or an agent writes it.

My whole agent setup, rules and hooks included, is public:
[see how it works](/tools/dotfiles). And if you want a senior engineer to look
through your codebase and tell you what to fix first, that's my
[code and security audit](/catalog/codebase-health-audit).
