# SEO Optimization Roadmap — Post-Implementation Report

All tasks completed and deployed to production. This doc records what was done,
architecture decisions, verification results, and ongoing maintenance.

**Date of implementation:** 2026-06-29\
**Initial audit score:** 45/100 (Abby SEO)\
**Commits:** 7 PRs on `main` (#27 through #33)

---

## What shipped

### T1 — Per-page `<head>` metadata (#27)

**Problem:** Every page had the same `<title>`, description, canonical,
OG/Twitter meta, and JSON-LD — because `routes/_app.tsx` hardcoded them once.

**Fix:** Created `lib/head.ts` (Preact signal store with `PageHead` interface)
and `components/SEOHead.tsx` (Fresh `<Head>` component). Each route sets
`head.value` before rendering, and `SEOHead` injects the correct tags.
`resetHead()` in `_app.tsx` prevents signal leaks across SSR requests.

**Architecture deviation from original plan:** The doc originally specified
inline signal reads in `_app.tsx`. That doesn't work in Fresh 2.2 SSR —
`_app.tsx` evaluates before the page component. The Fresh `<Head>` component
solves this: it collects children during render and injects them into `<head>`
_after_ the full component tree resolves.

New files:

- `lib/head.ts` — signal store, `PageHead` interface,
  `breadcrumbFromCanonical()`, `getBreadcrumb()`
- `components/SEOHead.tsx` — `<Head>`-based per-page injection of title,
  description, canonical, OG, Twitter, and JSON-LD graph

Modified: 12 route files (`routes/*.tsx`, `routes/*/index.tsx`,
`routes/*/[slug].tsx`) plus `routes/_app.tsx`.

### T2 — Noindex `/pay` + remove from sitemap (#28, #33)

**Problem:** `/pay` was in the XML sitemap with priority 0.5. Checkout URLs
should never be indexed.

**Fix:** Removed `/pay` from `routes/sitemap.xml.ts`. Added `noindex: true` to
the `head.value` in `routes/pay.tsx`, and `SEOHead` emits
`<meta name="robots" content="noindex, nofollow">` when `head.value.noindex` is
set.

**Architecture deviation:** The original plan used `X-Robots-Tag` HTTP headers
via middleware. Cloudflare's edge overwrites origin `X-Robots-Tag` headers, so
middleware was ineffective in production. Switched to `<meta name="robots">`
driven by the head signal.

The `routes/_middleware.ts` created in #28 was kept as-is (it still sets
headers, just not for this purpose). No harm in keeping it — future middlewares
can build on it.

### T3 — Enriched Person + Organization JSON-LD (#29)

**Problem:** Person schema on the homepage was thin — missing `image`, `sameAs`,
`award`, `knowsLanguage`, `givenName`/`familyName`. NeatSoft was only an inline
`worksFor` value, not a standalone entity.

**Fix:** Added to `components/SEOHead.tsx` Person block:

- `image`, `givenName`, `familyName`, `email`, `knowsLanguage` (`["en", "ru"]`)
- `award` (Expert-Vetted, 100% Job Success, $395K+)
- `sameAs` spread from `lib/config.ts` (`SAME_AS_URLS`)
- `worksFor` now references `@id: "https://neatsoft.dev/#org"`

Added standalone `Organization` block for NeatSoft with `founder` link back to
Person.

Also updated `routes/blog/[slug].tsx` BlogPosting `author` to use `@id`
reference and added `publisher` field.

New config:

- `lib/config.ts` — `SAME_AS_URLS` (Upwork, GitHub). Add LinkedIn / X / YouTube
  URLs here.

### T4 — Enriched BlogPosting + catalog Service (#30)

**BlogPosting** (`routes/blog/[slug].tsx`) gained:

- `@id` with fragment identifier
- `image` (the article's preview image, full URL)
- `inLanguage: "en-US"`
- `mainEntityOfPage` pointing to the canonical URL

**Catalog items** (`routes/catalog/[slug].tsx`) converted from
`@type: "Product"` to `@type: "Service"`:

- `serviceType`, `provider` linked to `#person`, `areaServed: "Worldwide"`
- Conditional `offers` block — omitted for free items (e.g. free architecture
  audit) where `priceNum` is `0`
- Removed unused `priceCurrency` variable

### T5 — Visible breadcrumb nav (#31)

**Problem:** `BreadcrumbList` JSON-LD was emitted but there was no visible
`<nav>` for humans. Google wants both.

**Fix:** Created `components/Breadcrumb.tsx` with proper semantics:

- `<nav aria-label="Breadcrumb">`, `<ol>`, last item as
  `<span aria-current="page">`
- Returns `null` when only 1 item (homepage)
- Not applied to `/pay` (noindex page)

All content routes (blog, catalog, projects detail + index pages, how-i-work,
contact-me, infrastructure) now include
`<Breadcrumb items={getBreadcrumb(...)} />` after `<SEOHead />`.

### Hotfixes shipped during deployment

- **#32** — Fresh 2.2 production build validates middleware handlers must have
  exactly one argument. Dev (Vite) was lenient. Fixed `routes/_middleware.ts` to
  single-arg `ctx` pattern.
- **#33** — Cloudflare edge overwrites `X-Robots-Tag` headers. Switched `/pay`
  noindex to `<meta name="robots">` via head signal.

---

## Architecture — key decisions

### Why Fresh `<Head>` instead of inline signal in `_app.tsx`

The original spec called for `head.value.title` directly in `_app.tsx` JSX. That
fails in Fresh 2.2 because `_app.tsx` evaluates during SSR _before_ the page
component sets `head.value`. The Fresh `<Head>` component collects children
during the full render tree traversal and injects them last — no timing issue.

### Why `<meta name="robots">` instead of `X-Robots-Tag` header

Cloudflare's edge rewrites `X-Robots-Tag` to `x-robots-tag: all`, discarding the
origin's per-route directives. Inline `<meta>` tags are opaque to Cloudflare and
reach search engines intact.

### Signal leak prevention

Module-level Preact signals persist across SSR requests in the same process.
`resetHead()` is called at the top of `_app.tsx` on every render, restoring
defaults before the page component sets new values.

---

## Current state — live verification

```
Page                           Title                                og:type     Breadcrumb  Robots
──────────────────────────────────────────────────────────────────────────────────────────────────
/                              Anton Shubin | Fractional CTO...    profile     —           index, follow
/blog                          Blog — Anton Shubin                 website     ✓           index, follow
/blog/<slug>                   <article> — Anton Shubin            article     ✓           index, follow
/catalog                       Catalog — Anton Shubin              website     ✓           index, follow
/catalog/<slug>                <item> — Anton Shubin               website     ✓           index, follow
/projects                      Projects — Anton Shubin             website     ✓           index, follow
/projects/<slug>               <project> — Anton Shubin            article     ✓           index, follow
/how-i-work                    How I Deliver — Anton Shubin        website     ✓           index, follow
/contact-me                    Contact Anton Shubin                website     ✓           index, follow
/infrastructure                Infrastructure & Architecture...    website     ✓           index, follow
/pay                           Payment — Anton Shubin | Frac...    website     —           noindex, nofollow
```

**Schema verification (homepage):**

- Person: `image` ✓, `sameAs` (Upwork, GitHub) ✓, `award` ✓, `knowsLanguage` ✓
- Organization (NeatSoft) as standalone block ✓
- BreadcrumbList per-page ✓

**Schema verification (blog detail):**

- BlogPosting: `image` ✓, `mainEntityOfPage` ✓, `inLanguage` ✓, `publisher` ✓

**Schema verification (catalog detail):**

- `@type: "Service"` ✓, `provider` ✓, conditional `offers` ✓

**Sitemap:** 42 URLs, `/pay` absent ✓\
**robots.txt:** 7 User-agent blocks including GPTBot, anthropic-ai,
PerplexityBot ✓\
**Security headers:** HSTS preload, COOP/COEP/CORP, X-Frame-Options DENY ✓

---

## External registrations — still to do

These are one-time manual tasks not committed to the repo. See the original
roadmap for detailed steps.

- [ ] Google Search Console — verify domain, submit sitemap, run URL Inspection
- [ ] Bing Webmaster Tools — verify, submit sitemap, configure IndexNow key
- [ ] Yandex Webmaster (only if Russian-language audience is targeted)
- [ ] Google Rich Results Test — paste `/` and `/blog/<slug>` to confirm schema
      passes
- [ ] Schema.org Validator — paste `/` to catch any syntax issues
- [ ] Facebook Sharing Debugger / Twitter Card Validator / LinkedIn Post
      Inspector
- [ ] Lighthouse audit → target SEO ≥ 100

---

## Maintenance — what to update when content changes

| Change                     | Files to update                                                            |
| -------------------------- | -------------------------------------------------------------------------- |
| New blog post              | `routes/sitemap.xml.ts`, `routes/llms-full.txt.ts`                         |
| New catalog item           | `routes/sitemap.xml.ts`, `routes/llms-full.txt.ts`                         |
| New project                | `routes/sitemap.xml.ts` (automatic), `routes/llms-full.txt.ts`             |
| Add LinkedIn/X/YouTube URL | `lib/config.ts` (`SAME_AS_URLS`)                                           |
| Change pricing/policies    | `routes/llms.txt.ts`, `routes/llms-full.txt.ts`                            |
| Change crawler rules       | `routes/robots.txt.ts`                                                     |
| Add new route              | `routes/sitemap.xml.ts`, `routes/llms-full.txt.ts`, wire head in new route |

When adding a new route, follow the pattern established in T1:

1. Import `{ head }` and `<SEOHead />`
2. Set
   `head.value = { ...head.value, title, description, canonical, ogType, ogImage }`
   before returning JSX
3. Include `<SEOHead />` inside `<Layout>`

---

## Verification one-liners

```bash
# All page titles
for p in "/" "/blog" "/how-i-work" "/contact-me" "/infrastructure" "/pay" "/catalog" "/projects"; do
  curl -s "https://antonshubin.com${p}" -H "User-Agent: Mozilla/5.0" | grep -oP '<title>\K[^<]+'
done

# Noindex on /pay
curl -s "https://antonshubin.com/pay" -H "User-Agent: Mozilla/5.0" | grep -oP '<meta name="robots"[^>]+>'

# Sitemap /pay check (should be 0)
curl -s "https://antonshubin.com/sitemap.xml" -H "User-Agent: Mozilla/5.0" | grep -c "/pay"

# Homepage schema completeness
curl -s "https://antonshubin.com/" -H "User-Agent: Mozilla/5.0" | grep -c "sameAs\|award\|knowsLanguage\|neatsoft.dev/#org"

# BlogPosting schema
curl -s "https://antonshubin.com/blog/ship-it-today" -H "User-Agent: Mozilla/5.0" | grep -c "mainEntityOfPage\|inLanguage"

# Service schema
curl -s "https://antonshubin.com/catalog/strategy-call" -H "User-Agent: Mozilla/5.0" | grep -c '"Service"\|provider'
```
