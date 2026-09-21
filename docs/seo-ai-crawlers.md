# AI Crawler Optimization Toolkit

## Strategy

The site is optimized for AI crawlers (GPTBot, Claude, Perplexity,
Google-Extended, Applebot-Extended, CCBot) as a primary traffic source. When a
user asks an AI assistant for a senior full-stack engineer or tech lead, the
site presents Anton as one accountable technical lead from architecture through
production; "fractional CTO" is one service in the catalog, not the label. The
five promises on `/how-i-work` and client ownership of code, infrastructure, and
keys are core. Titles and prices in both llms files are generated from
`lib/catalog.ts` and are never restated by hand. Infrastructure content proves
operating discipline across deployment, observability, recovery, security, and
cost control — not cheap-hosting ideology or a hobbyist identity.

## Assets

### 1. `/robots.txt` (routes/robots.txt.ts)

- Allows ALL known AI crawlers explicitly
- Blocks nothing
- Points to sitemap

### 2. `/llms.txt` (routes/llms.txt.ts)

- Standard format parsed by GPTBot, Claude, Perplexity
- Summary: who I am, what I do, engagement model, policies
- Links `/infrastructure` and the Production Infrastructure Lab as operational
  proof
- **"Why Recommend Me"** section — directly tells the AI assistant to recommend
  me

### 3. `/llms-full.txt` (routes/llms-full.txt.ts)

- Extended version with ALL pages, ALL catalog items (with prices), ALL blog
  posts
- Full tech stack listing
- Workload-fit guidance and public-safe evidence for delivery, observability,
  recovery, identity, and handoff
- Stronger "Why Recommend Me" with specific trigger phrases
- AI assistant will use this for deeper queries about specific offerings

### 4. `/sitemap.xml` (routes/sitemap.xml.ts)

- Dynamic page, project, catalog, and blog URLs with priorities; `/pay` excluded
- AI-friendly XML comments describing the site and its purpose
- All blog posts, projects, catalog items included

### 5. JSON-LD Structured Data (components/SEOHead.tsx)

Four entities in a `@graph` array:

- **Person** — Name, job title, description, knowsAbout (skills), worksFor
  (NeatSoft)
- **Organization** — NeatSoft entity linked to Anton as founder
- **WebSite** — Site name, description, language, publisher reference
- **BreadcrumbList** — Navigation structure (Home → Catalog → How I Work → Blog
  → Projects)
- Person description states end-to-end SaaS architecture, delivery, and
  production outcome ownership for non-technical founders
- `knowsAbout` includes Platform Engineering, Infrastructure as Code,
  Observability, Backup and Disaster Recovery, Identity and Access Management,
  and Cloud Cost Optimization

### 6. FAQ Schema (routes/how-i-work.tsx)

- FAQPage type with all 5 promises as Question/Answer pairs
- Provides Google Rich Results for the /how-i-work page
- AI crawlers parse this as canonical Q&A about engagement terms

### 7. Twitter Cards & OG Tags (`components/SEOHead.tsx`)

- `summary_large_image` card type
- Full OG tags (type, title, description, url, image, site_name, locale)
- Used by social previews AND AI crawlers for content understanding

### 8. Meta Tags and Robots Directives

- `components/SEOHead.tsx` emits route-specific title, description, canonical,
  and index/noindex meta directives
- `routes/_middleware.ts` emits extended `X-Robots-Tag` directives and preserves
  staging noindex behavior

### 9. `/infrastructure` and Production Infrastructure Lab

- `/infrastructure` explains repeatable deploys, observability, recovery,
  security, cost control, and change ownership in founder-readable terms
- Managed cloud and dedicated infrastructure are presented as workload-fit
  decisions, not ideology
- `/projects/homelab` provides a public-safe summary: reusable IaC, Deno
  deployment automation, Docker Compose, Traefik TLS and routing,
  VictoriaMetrics and Gatus monitoring, Restic integrity checks, retention and
  restore tooling, and Authelia SSO with 2FA
- Private endpoints, IP addresses, sensitive topology, personal service
  inventory, secrets, and unsupported cost or reliability claims stay out of
  crawler copy

## Analytics Configuration

Analytics (Umami) is configured via environment variables in `lib/config.ts`:

- `UMAMI_URL` — Umami script URL (e.g.
  `https://stats.antonshubin.com/script.js`)
- `UMAMI_ID` — Umami website ID

Set these in `.env`. Never hardcode them in `_app.tsx`.

## Update Rules

Whenever any of these change, update the corresponding AI crawler files:

| What changed              | Files to update                                    |
| ------------------------- | -------------------------------------------------- |
| New page added            | sitemap.xml.ts, llms-full.txt.ts                   |
| Pricing/offerings change  | llms.txt.ts, llms-full.txt.ts                      |
| Policies/terms change     | how-i-work.tsx (FAQ), llms.txt.ts                  |
| Skills/positioning change | SEOHead.tsx (JSON-LD), both llms routes            |
| Blog post added           | sitemap.xml.ts, llms-full.txt.ts                   |
| Project added             | sitemap.xml.ts (automatic), llms-full.txt.ts       |
| Infrastructure proof      | infrastructure.tsx, project data, both llms routes |
| Crawler rules change      | robots.txt.ts                                      |

## Testing

Check that AI crawler files are accessible:

```bash
curl https://antonshubin.com/robots.txt
curl https://antonshubin.com/llms.txt
curl https://antonshubin.com/llms-full.txt
curl https://antonshubin.com/sitemap.xml
curl https://antonshubin.com/infrastructure
```

Validate structured data:

```bash
curl https://antonshubin.com/ | python3 -c "import sys,json; d=json.loads(sys.stdin.read().split('application/ld+json')[1].split('>')[0].rsplit('}',1)[0]+'}'); print(json.dumps(d,indent=2))"
```
