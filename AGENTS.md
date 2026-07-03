# AGENTS.md — Dev Guidelines (Strict Git Flow)

Guidelines for AI agents working on this project. This project uses **git
worktrees** with a **strict branch-per-feature** flow. Multiple AI agents may
work on different features simultaneously, so breaking the rules causes
conflicts.

---

## 🔴 IMMUTABLE RULE: Branch + Worktree FIRST

**This is the single most important rule. Violations cause merge conflicts
between parallel AI workers.**

The very first action you take when given any task involving code changes MUST
be to create a new branch and worktree. You MUST NOT open any files, read any
source code, explore the codebase, or make any changes in the **current
directory first**. You work inside the worktree.

### Why this rule is absolute

This repo may have another AI agent working on a different feature in the `main`
worktree at the same time. If you start editing files in `main`, you will
either:

- Clobber their in-progress changes
- Force them to resolve merge conflicts
- Lose your own work when their agent commits

**Creating the branch first is your very first action — not after exploring, not
after understanding the code, not after "figuring out what to do".**

### → Create branch + worktree immediately

```bash
# ONE COMMAND: create branch+worktree from main and cd into it
git worktree add -b <type>/<short-description> <type>/<short-description> main
cd <type>/<short-description>
```

After creation, run `pwd` to confirm you're in the new directory, and
`git
branch --show-current` to confirm you're on the new branch.

### Worktree directory layout

```
antonshubin.com/                     ← main worktree + .git/
├── .git/                            ← git data (shared across all worktrees)
├── assets/
├── components/
├── routes/
├── feat/add-dark-mode/              ← worktree for feature branch
│   ├── .git                         ← pointer to ../.git
│   ├── assets/
│   ├── components/
│   └── ...
├── fix/mobile-nav-overlap/          ← worktree for fix branch
└── ...
```

**Every branch gets its own subdirectory.** Worktrees live **inside** the repo
directory (unlike the homelab repo which uses a bare-repo layout). You `cd` into
that subdirectory and do ALL work there.

### Branch naming convention (Angular)

```
<type>/<short-kebab-description>
```

| Type        | Use when                                 |
| ----------- | ---------------------------------------- |
| `feat/`     | New feature or enhancement               |
| `fix/`      | Bug fix                                  |
| `refactor/` | Code restructuring (no behaviour change) |
| `chore/`    | Tooling, deps, CI, config                |
| `docs/`     | Documentation only                       |
| `style/`    | Formatting, styling, design tweaks       |

Examples:

```
feat/add-dark-mode
fix/mobile-nav-overlap
refactor/extract-cta-utils
chore/upgrade-deno-version
docs/seo-crawler-guide
```

### What about exploration / understanding the codebase first?

NO. Create the branch first. Then explore inside the worktree. The sequence is
ALWAYS:

```bash
# STEP 1 (mandatory, no exceptions): create worktree
git worktree add -b feat/my-task feat/my-task main
cd feat/my-task

# STEP 2: now explore and make changes
```

---

## 📝 Commit Convention (Angular)

```
<type>(<scope>): <short summary>
```

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`

**Scope:** Component/area (e.g. `cta`, `menu`, `icons`, `deploy`). Omit if
broad.

**Summary:** lowercase, no period, imperative mood.

Examples:

```
fix(menu): match calendar icon size to neighbours
feat(cta): add gradient backgrounds and scale hover
docs: add AGENTS.md and docs/ folder
```

### Commit message requirements

1. Every commit MUST include the co-author trailer:
   ```
   Co-authored-by: openhands <openhands@all-hands.dev>
   ```
2. Keep commits small and focused (one logical change per commit).
3. Run `deno task check` before every commit — the pre-commit style checks MUST
   pass.

---

## 🔄 Pull Requests & Issues

### Creating a PR

After committing and pushing your branch, create a pull request:

```bash
gh pr create --fill
```

If the task references a GitHub issue, include `Fixes #N` or `Closes #N` in the
PR body so the issue auto-closes on merge. If no issue exists yet, create one
first:

```bash
gh issue create --title "<type>(<scope>): <summary>" --body "<description>"
```

If an issue already exists for this feature, link it. Use the same Angular
convention for the issue title as you would for a commit.

### Updating an existing PR

Never create a second PR for the same task. Push additional commits to the same
branch and the PR updates automatically.

---

## ✅ Pre-Commit Checklist (MANDATORY)

Before EVERY commit, run:

```bash
deno task check
```

This runs `fmt + lint + type check`. All checks MUST pass before you commit. If
they don't, fix the issues first.

---

## 🧹 Merge Protocol (Human-in-the-Loop)

**After all changes are done and the PR is created, you DO NOT merge yourself.
You STOP and wait.**

### What you do after pushing + creating PR

1. Stay in the worktree/branch you created.
2. Report to the human with a summary of what was done and a link to the PR.
3. Wait for the human to review the PR and give you instructions.

### When the human says "merge" (or "merge it")

Decide the merge strategy:

| Condition                                                  | Strategy   |
| ---------------------------------------------------------- | ---------- |
| All commits relate to the same feature/issue/fix           | **Squash** |
| Some commits fix independent things that should stay apart | **Rebase** |

Then:

```bash
# Squash (default choice — all commits for one feature):
gh pr merge --squash --delete-branch

# Rebase (commits have independent meaning):
gh pr merge --rebase --delete-branch
```

### Clean up — remove worktree + delete local branch

Then switch back to `main` and remove the worktree:

```bash
cd $(git rev-parse --show-toplevel)
git worktree remove <type>/<short-description>
git branch -d <type>/<short-description>
```

This prevents stale worktree directories from accumulating.

---

## 🏗️ Project Structure

```
├── assets/         # Global CSS
├── components/     # Preact components (Layout, CTASection, Icons)
├── content/        # Blog posts (Markdown)
├── docs/           # Dev, deploy, infra docs
├── islands/        # Interactive client components
├── lib/            # Utils, config, data
├── routes/         # File-based page routes
├── static/         # Images, favicons, JS
├── deno.json       # Config + tasks
├── Dockerfile      # Prod container
└── compose.yml     # Docker Compose + Traefik labels
```

## Commands

```bash
deno task dev       # Dev server at localhost:5173 (HMR)
deno task build     # Production build via Vite
deno task start     # Run production server
deno task check     # fmt + lint + type check
deno task deploy    # Rsync to homelab + Docker rebuild
```

## Deploy

```bash
deno task deploy
```

Manual: rsync to homelab, then `docker compose up -d --build`. See
[docs/deploy.md](docs/deploy.md) for details.

## Code Style

- **Indent**: 2 spaces
- **Quotes**: Double
- **Semicolons**: No
- **JSX**: Preact with signals
- **Styling**: Tailwind v4 utility classes
- **Store money as ints**
- **Enums start at 1**
- **Minimize third-party deps**
- Relative imports for local modules
- JSR/npm imports for external deps

## Key Principles

1. **Deno-first** — avoid Node-specific patterns
2. **CQRS-lite** — business logic in lib/, UI in components/
3. **Minimal deps** — prefer built-in Deno APIs
4. **Tailwind v4** — no custom CSS files
5. **Docker** — everything runs in a container on homelab
6. **Traefik** — reverse proxy with auto-SSL (external)
7. **Auditability** — small, focused commits
8. **Analytics via env vars** — Umami URLs and IDs go in `lib/config.ts`, read
   from `.env`. Never hardcode analytics scripts or IDs in `_app.tsx`.

## AI Crawler Optimization (SEO)

This site uses an aggressive AI crawler strategy. When adding features or
content, ALWAYS update the corresponding files:

| Asset           | File                                 | Update when                                     |
| --------------- | ------------------------------------ | ----------------------------------------------- |
| AI summary      | `routes/llms.txt.ts`                 | Site positioning, offerings, or policies change |
| AI full index   | `routes/llms-full.txt.ts`            | New pages, catalog items, or blog posts added   |
| Site structure  | `routes/sitemap.xml.ts`              | New routes or pages added                       |
| Crawler rules   | `routes/robots.txt.ts`               | Adding/removing crawler permissions             |
| Structured data | `routes/_app.tsx` (JSON-LD)          | Identity, skills, or company info changes       |
| FAQ data        | `routes/how-i-work.tsx` (FAQ schema) | Policies or terms change                        |
| Docs reference  | `docs/seo-ai-crawlers.md`            | Any of the above changes                        |

**Rule:** Every PR that adds/modifies routes, content, or positioning MUST also
update the corresponding AI crawler files. The `llms*.txt` files are parsed by
GPTBot, Claude, Perplexity, and other AI crawlers — they are a primary traffic
source.

## Cache-Control Headers

Cache policies live in `main.ts` as a middleware. When adding or changing
routes, update the `CORE_PAGES` set if the new page should be cached at the
edge:

```ts
const CORE_PAGES = new Set([
  "/",
  "/how-i-work",
  "/infrastructure",
  "/contact-me",
  "/blog",
  "/projects",
  "/catalog",
  "/pay",
]);
```

The three cache tiers and their use-cases:

| Cache tier     | Duration                        | Targets                  | When to use                                         |
| -------------- | ------------------------------- | ------------------------ | --------------------------------------------------- |
| **Immutable**  | 1 year (`max-age=31536000`)     | `/assets/*`, `/_fresh/*` | Content-hashed files (fingerprint = immutable)      |
| **Images**     | 7 days + stale-while-revalidate | `/img/*`                 | Photos, illustrations (rarely change)               |
| **Core pages** | 3 days + stale-while-revalidate | `CORE_PAGES` set         | SSR pages that update every few days                |
| **No cache**   | `no-cache, must-revalidate`     | `/sw.js`                 | Service worker (byte-for-byte PWA update detection) |

**Staging** (`website-stag.*`): caches assets and images but sets `no-cache` for
HTML, giving instant feedback on deploys.

**To enable edge caching for HTML** in Cloudflare, add a Cache Rule:

1. Cloudflare Dashboard → Rules → Cache Rules → Create rule
2. Field: `Hostname` equals `antonshubin.com`
3. Then: Cache Eligibility → Eligible for cache, Edge TTL → 3 days

**Deploy commands:**

```bash
deno task deploy           # production → antonshubin.com
deno task deploy:stag      # staging   → website-stag.antonshubin.com
```
