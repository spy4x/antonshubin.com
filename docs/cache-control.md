# Cache-Control headers

Cache policy lives in `lib/cache-control.ts`'s `cacheControlFor()`, a pure
function unit-tested in `lib/cache-control.test.ts`, applied to every response
by `main.ts`'s cache middleware. `/sw.js` (the retired worker) sets its own
header in `routes/sw.js.ts`. When adding or changing routes, add a new core page
to `lib/pages.ts` (see "Site frame" in [AGENTS.md](../AGENTS.md)): its
`CORE_PAGES` set and the sitemap both read that one list.

Cache tiers:

| Tier              | Duration                        | Targets                              | Use case                                                      |
| ----------------- | ------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Immutable         | 1 year (`max-age=31536000`)     | `/assets/*`, `/_fresh/*`             | Content-hashed files (fingerprint = immutable)                |
| Images and static | 7 days + stale-while-revalidate | `/img/*`, favicons, `/manifest.json` | Photos, illustrations, small root files (rarely change)       |
| Core pages        | 3 days + stale-while-revalidate | `CORE_PAGES` set                     | SSR pages that update every few days                          |
| Tools pages       | 1 hour + stale-while-revalidate | `/tools`, `/tools/*`                 | Versions, stars and CI status the server refreshes hourly     |
| No cache          | `no-cache, must-revalidate`     | `/sw.js`                             | Set by `routes/sw.js.ts` (byte-for-byte PWA update detection) |

Error responses (status ≥ 400) are never cached, regardless of which tier the
path would otherwise fall into — a 404 must not survive in a browser or at the
edge once the page comes back. A route that sets `no-store` itself (for example
`routes/unsubscribe.tsx`, which shows one subscriber's address) keeps it.

**A static-file tier always wins over Fresh's own default, even when `current`
already says `no-store`** (#183 follow-up, fixed alongside #184): Fresh's
`staticFiles()` middleware stamps a plain `Cache-Control: no-store` on any
static file it doesn't itself recognise as content-hashed — which, before this
fix, silently meant `/fonts/*` (self-hosted under `assets/fonts/`, Vite
content-hashes them into `/assets/*` — see "Visual system" in
[AGENTS.md](../AGENTS.md)), `/img/*`, favicons and any unstamped `/_fresh/*` JS
chunk never got their real tier, because `cacheControlFor()` checked "does the
response already say no-store?" _before_ checking whether the path was a
recognised asset/image/static file. `cacheControlFor()` now checks the
asset/image/static-root-file tiers first; only a path that doesn't match any of
them still respects an existing `no-store` (which is how a route's own
deliberate one, like `routes/unsubscribe.tsx`'s, keeps winning).
`lib/cache-control.test.ts` pins both directions: a hashed font/image/favicon/JS
chunk gets its tier even when `current` is already `"no-store"`, and
`/unsubscribe` keeps `no-store` regardless.

The site sends `X-Robots-Tag: noindex` for any status ≥ 400 and
`noindex, nofollow` for `/pay`, `/unsubscribe` and `/subscribe/confirm`
(`routes/_middleware.ts`).
