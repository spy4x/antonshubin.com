# Dev

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) (latest)

## Commands

```bash
deno task dev      # Start dev server at localhost:5173 (HMR)
deno task build    # Production build via Vite
deno task start    # Run production server
deno task check    # fmt + lint + type check
```

## Project Structure

```
├── assets/         # Global CSS
├── components/     # Reusable Preact components (Layout, CTASection, Icons)
├── content/        # Blog posts (Markdown)
├── islands/        # Interactive client components (Menu, CopyButton, ImageGallery)
├── lib/            # Utilities, config, data
├── routes/         # File-based page routes
├── static/         # Images, favicons, JS
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

## Checks Before Deploy

```bash
deno task check
```
