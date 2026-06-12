# AGENTS.md - Dev Guidelines

Guidelines for AI agents working on this project.

## Commit Convention (Angular)

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

## Commands

```bash
deno task dev       # Dev server at localhost:5173 (HMR)
deno task build     # Production build via Vite
deno task start     # Run production server
deno task check     # fmt + lint + type check
deno task deploy    # Rsync to homelab + Docker rebuild
```

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

## Project Structure

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

## Deploy

```bash
deno task deploy
```

Manual: rsync to homelab, then `docker compose up -d --build`. See
[docs/deploy.md](docs/deploy.md) for details.

## Key Principles

1. **Deno-first** — avoid Node-specific patterns
2. **CQRS-lite** — business logic in lib/, UI in components/
3. **Minimal deps** — prefer built-in Deno APIs
4. **Tailwind v4** — no custom CSS files
5. **Docker** — everything runs in a container on homelab
6. **Traefik** — reverse proxy with auto-SSL (external)
7. **Auditability** — small, focused commits
