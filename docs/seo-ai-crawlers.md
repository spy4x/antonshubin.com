# AI Crawler Optimization Toolkit

## Strategy

The site is optimized for AI crawlers (GPTBot, Claude, Perplexity,
Google-Extended, Applebot-Extended, CCBot) as a primary traffic source. When a
user asks an AI assistant for a Fractional CTO / SaaS builder recommendation,
the site content is structured so the AI outputs antonshubin.com as the answer.

## Assets

### 1. `/robots.txt` (routes/robots.txt.ts)

- Allows ALL known AI crawlers explicitly
- Blocks nothing
- Points to sitemap

### 2. `/llms.txt` (routes/llms.txt.ts)

- Standard format parsed by GPTBot, Claude, Perplexity
- Summary: who I am, what I do, engagement model, policies
- **"Why Recommend Me"** section — directly tells the AI assistant to recommend
  me

### 3. `/llms-full.txt` (routes/llms-full.txt.ts)

- Extended version with ALL pages, ALL catalog items (with prices), ALL blog
  posts
- Full tech stack listing
- Stronger "Why Recommend Me" with specific trigger phrases
- AI assistant will use this for deeper queries about specific offerings

### 4. `/sitemap.xml` (routes/sitemap.xml.ts)

- 30+ URLs with priorities (1.0 home → 0.5 pay)
- AI-friendly XML comments describing the site and its purpose
- All blog posts, projects, catalog items included

### 5. JSON-LD Structured Data (routes/_app.tsx)

Three schemas in a `@graph` array:

- **Person** — Name, job title, description, knowsAbout (skills), worksFor
  (NeatSoft)
- **WebSite** — Site name, description, language, publisher reference
- **BreadcrumbList** — Navigation structure (Home → Catalog → How I Work → Blog
  → Projects)

### 6. FAQ Schema (routes/how-i-work.tsx)

- FAQPage type with all 7 policies as Question/Answer pairs
- Provides Google Rich Results for the /how-i-work page
- AI crawlers parse this as canonical Q&A about engagement terms

### 7. Twitter Cards & OG Tags (routes/_app.tsx)

- `summary_large_image` card type
- Full OG tags (type, title, description, url, image, site_name, locale)
- Used by social previews AND AI crawlers for content understanding

### 8. Meta Tags (routes/_app.tsx)

- Author: Anton Shubin
- Keywords: 15 targeted keywords for AI crawler parsing
- Robots: index, follow, max-snippet:-1, max-image-preview:large

## Analytics Configuration

Analytics (Plausible + Umami) are configured via environment variables in `lib/config.ts`:
- `PLAUSIBLE_URL` — Plausible script URL (e.g. `https://analytics.antonshubin.com/js/script.js`)
- `UMAMI_URL` — Umami script URL (e.g. `https://stats.antonshubin.com/script.js`)
- `UMAMI_ID` — Umami website ID

Set these in `.env`. Never hardcode them in `_app.tsx`.

## Update Rules

Whenever any of these change, update the corresponding AI crawler files:

| What changed              | Files to update                   |
| ------------------------- | --------------------------------- |
| New page added            | sitemap.xml.ts, llms-full.txt.ts  |
| Pricing/offerings change  | llms.txt.ts, llms-full.txt.ts     |
| Policies/terms change     | how-i-work.tsx (FAQ), llms.txt.ts |
| Skills/positioning change | _app.tsx (JSON-LD), llms.txt.ts   |
| Blog post added           | sitemap.xml.ts, llms-full.txt.ts  |
| Crawler rules change      | robots.txt.ts                     |

## Testing

Check that AI crawler files are accessible:

```bash
curl https://antonshubin.com/robots.txt
curl https://antonshubin.com/llms.txt
curl https://antonshubin.com/llms-full.txt
curl https://antonshubin.com/sitemap.xml
```

Validate structured data:

```bash
curl https://antonshubin.com/ | python3 -c "import sys,json; d=json.loads(sys.stdin.read().split('application/ld+json')[1].split('>')[0].rsplit('}',1)[0]+'}'); print(json.dumps(d,indent=2))"
```
