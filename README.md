# antonshubin.com

[![status](https://ci.antonshubin.com/api/badges/spy4x/antonshubin.com/status.svg)](https://ci.antonshubin.com/repos/spy4x/antonshubin.com)

Website for Anton Shubin — senior full-stack engineer and tech lead helping
non-technical founders take SaaS products from idea through production
operations. It carries the portfolio, the pricing catalog, the blog and the
newsletter signup.

## Stack

- [Deno 2](https://deno.com/) runtime
- [Fresh 2](https://fresh.deno.dev/) with the Vite plugin for bundling and dev
  HMR
- [Preact](https://preactjs.com/) for components and islands
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- Docker Compose + Traefik for deployment

## Getting started

```bash
git clone https://github.com/spy4x/antonshubin.com.git
cd antonshubin.com
deno task dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

## Tasks

All tasks are defined in `deno.json`; this list mirrors it.

| Command                          | Description                                                               |
| -------------------------------- | ------------------------------------------------------------------------- |
| `deno task check`                | fmt --check + lint + type check + test + test:browser                     |
| `deno task test`                 | Build, then run `deno test`                                               |
| `deno task test:browser`         | Playwright lead-form, a11y, contrast, CSP and service-worker tests        |
| `deno task dev`                  | Dev server (Vite, HMR)                                                    |
| `deno task build`                | Production build (Vite)                                                   |
| `deno task start`                | Run the production server                                                 |
| `deno task update`               | Update Fresh                                                              |
| `deno task deploy`               | Deploy production → antonshubin.com                                       |
| `deno task deploy:stag`          | Deploy staging → website-stag.antonshubin.com                             |
| `deno task env:encrypt`          | Every `.env*` → its `.env*.age` (age64)                                   |
| `deno task env:decrypt`          | Every `.env*.age` → its plaintext (age64)                                 |
| `deno task env:status`           | Key presence + which env/age files exist                                  |
| `deno task publish:blog`         | After deploy: live check, Dev.to draft, tagged links (docs/publishing.md) |
| `deno task launch-kit`           | Draft a repo launch's Reddit/HN/LinkedIn/Dev.to/YouTube posts             |
| `deno task video-kit`            | Transcript → titles, description, chapters, blog draft                    |
| `deno task weekly-numbers`       | Umami/GitHub/YouTube numbers → markdown + NTFY                            |
| `deno task optimize:screenshots` | Compress portfolio screenshots                                            |

## Documentation

- [AGENTS.md](AGENTS.md) — project structure, coding conventions, deploy
  process, CSP, newsletter and SEO-crawler wiring — the source of truth for
  anyone (human or agent) working on this repo.
- [docs/](docs/) — deploy, dev setup, infra, newsletter, SEO, UTM and
  weekly-numbers reference docs.

## License

This project is for personal use. All rights reserved.
