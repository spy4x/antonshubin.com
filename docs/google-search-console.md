# Google Search Console — Setup

## Why

Google Search Console shows what Google actually indexes and which queries drive
impressions — data the site doesn't otherwise have. Set it up if it isn't
already, and use it to keep Coverage and Core Web Vitals errors down.

## Steps

1. Go to https://search.google.com/search-console
2. Add property: `antonshubin.com` (URL prefix, not domain)
3. **DNS verification**: Add TXT record via DNS provider (likely Hetzner DNS):
   - Name: `antonshubin.com`
   - Type: `TXT`
   - Value: `google-site-verification=...` (provided by GSC)
4. After verification, submit sitemap:
   - URL: `https://antonshubin.com/sitemap.xml`
5. Request manual indexing: homepage, /how-i-work, /blog, /work
6. Check Coverage report weekly for errors

## Also

- Bing Webmaster Tools: https://www.bing.com/webmasters
- Check Core Web Vitals report in GSC
- Monitor Search Analytics tab for which queries drive impressions and organic
  traffic
