# Google Search Console — Setup

## Why

Site gets zero Google organic traffic. `site:antonshubin.com` returns nothing.
Without GSC, Google may not know the site exists at all.

## Steps

1. Go to https://search.google.com/search-console
2. Add property: `antonshubin.com` (URL prefix, not domain)
3. **DNS verification**: Add TXT record via DNS provider (likely Hetzner DNS):
   - Name: `antonshubin.com`
   - Type: `TXT`
   - Value: `google-site-verification=...` (provided by GSC)
4. After verification, submit sitemap:
   - URL: `https://antonshubin.com/sitemap.xml`
5. Request manual indexing: homepage, /how-i-work, /blog, /projects
6. Check Coverage report weekly for errors

## Also

- Bing Webmaster Tools: https://www.bing.com/webmasters
- After indexing, check Core Web Vitals report in GSC
- Monitor Search Analytics tab for which queries drive impressions

## Verification

- `site:antonshubin.com` returns results within 1-2 weeks
- Umami shows google.com referrer traffic
