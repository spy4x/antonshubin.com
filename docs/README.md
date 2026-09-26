# Docs

Project documentation for antonshubin.com.

## Contents

### [Dev](dev.md)

Local dev setup, commands, code style, project structure.

### [Deploy](deploy.md)

Deploy to homelab via rsync + Docker.

### [Infra](infra.md)

Production infrastructure: Docker, Traefik, updates.

### [AI Crawlers](seo-ai-crawlers.md)

LLM-friendly surface: llms.txt, llms-full.txt, sitemap, robots, JSON-LD graph.
Update rules when adding content or pages.

### [SEO Optimization Roadmap](seo-optimization-roadmap.md)

Post-implementation report of all SEO fixes shipped 2026-06-29. Covers 5 feature
PRs + 2 production hotfixes, architecture decisions, live verification results,
and ongoing maintenance procedures.

### [Tagged links](utm.md)

How every link posted elsewhere back to antonshubin.com is tagged: the channel
table (source and medium) shared with `scripts/utm.ts`, how campaigns are named,
the campaign log, and `deno task links`, which prints a page's tagged URL for
every channel.

### [Publishing a blog post](publishing.md)

The end-to-end flow for a new post: draft, pull request, deploy,
`deno task publish:blog <slug>`, channel texts and the newsletter on Anton's
yes. The voice to write in is in [voice.md](voice.md).

### [Video kit](video-kit.md)

`deno task video-kit`: YouTube titles, description, chapters and a blog draft
from a transcript.
