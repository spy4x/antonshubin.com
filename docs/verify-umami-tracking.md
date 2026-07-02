# Umami Tracking Verification (Issue #55)

## Test Results (2026-07-02)

Tested `https://antonshubin.com` with Playwright across multiple viewports.

### Chromium Desktop (1280x720)

| Check                           | Result |
| ------------------------------- | ------ |
| Umami script loaded             | ✅ 200 |
| Umami event POST /api/send      | ✅ 200 |
| Plausible script loaded         | ✅ 200 |
| Plausible event POST /api/event | ✅ 202 |
| window.umami initialized        | ✅     |
| Console errors                  | 0      |
| Layout issues                   | None   |

### Mobile — iPhone 14 (390x844)

| Check                           | Result                        |
| ------------------------------- | ----------------------------- |
| Umami script loaded             | ✅ 200                        |
| Umami event POST /api/send      | ✅ 200                        |
| Plausible script loaded         | ✅ 200                        |
| Plausible event POST /api/event | ✅ 202                        |
| window.umami initialized        | ✅                            |
| Console errors                  | 0                             |
| Horizontal overflow             | None (scroll=390, client=390) |

### Mobile — iPad (768x1024)

| Check                      | Result |
| -------------------------- | ------ |
| Umami script loaded        | ✅ 200 |
| Umami event POST /api/send | ✅ 200 |
| window.umami initialized   | ✅     |
| Console errors             | 0      |
| Layout issues              | None   |

### Umami Server

| Check         | Result                                              |
| ------------- | --------------------------------------------------- |
| Script URL    | `https://stats.antonshubin.com/script.js` → 200     |
| Server        | Umami v2 (Next.js)                                  |
| Bot filtering | ✅ `_middleware.ts` strips analytics for known bots |
| CSP blocking  | None — no CSP on main site                          |

## Analysis

### 92.1% Chrome — likely real traffic

The audience for this site (developer tools, Fractional CTO consulting,
open-source SaaS) skews heavily toward Chrome on desktop. The bot-filtering
middleware correctly strips analytics scripts from known AI crawlers and search
bots, so the numbers represent genuine human visitors.

### Low Firefox (3) and iOS Safari (6)

Most likely causes:

1. **Ad-blockers**: Firefox users commonly run uBlock Origin which blocks
   `/script.js` pattern by default. Umami's default script path triggers many
   blocker lists.
2. **Safari ITP**: `stats.antonshubin.com` is a separate subdomain — Safari's
   Intelligent Tracking Prevention may flag it as a tracker despite being
   same-site.
3. **Small sample**: The numbers are from a 30-day window. With more traffic,
   the distribution would normalize.

### Improvement options (not implemented in this PR)

- **Proxy Umami through main domain** (e.g. `/api/umami/`) — avoids ITP and
  ad-blockers by making it same-origin. Requires Traefik config change on
  homelab.
