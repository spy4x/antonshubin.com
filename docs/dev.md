# Dev

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) (latest)

## Commands

```bash
deno task dev            # Start dev server at localhost:5173 (HMR)
deno task build          # Production build via Vite
deno task start          # Run production server
deno task check           # fmt + lint + type check + test + test:browser
deno task test            # Build, then deno test
deno task test:browser    # Playwright browser-driven tests (needs Chromium)
```

## Project Structure

```
├── assets/         # Global CSS
├── components/     # Reusable Preact components (Layout, SEOHead, Icons)
├── content/        # Blog posts (Markdown)
├── islands/        # Interactive client components (Menu, CopyButton, ImageGallery)
├── lib/            # Utilities, config, data
├── routes/         # File-based page routes
├── static/         # Images, favicons
├── deno.json       # Deno config + tasks
├── Dockerfile      # Prod container
└── compose.yml     # Docker Compose + Traefik labels
```

## Code Style

- CQRS-lite: keep business logic in lib/, UI in components/
- Store money as ints
- Enums start at 1
- Minimize third-party deps
- Tailwind v4 utility classes
- Preact with signals for state

## Browser-driven tests

`deno task test:browser` (part of `deno task check`) drives a real headless
Chromium via Playwright — for hydration, focus, `<dialog>` and CSP behaviour
that only exists once client JS runs. The base `denoland/deno` image ships with
none of the OS libraries a headless Chromium needs, so install it first, pinned
to the exact version `deno.json`'s `playwright` import and `test/browser.ts`'s
`PLAYWRIGHT_VERSION` use — a mismatch downloads a different Chromium build than
the one the tests launch:

```bash
deno run -A npm:playwright@1.63.0 install --with-deps chromium
```

`.woodpecker.yml`'s `check` step runs this same install command before it runs
`deno task check` in CI.

## Checks Before Deploy

```bash
deno task check
```
