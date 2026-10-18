# Redirect table

`lib/redirects.ts` holds the one 301 table (#188) for URLs that no longer exist
as written: the old `/projects` section (`/projects` goes to `/work`, and each
`/projects/<slug>` goes to `/work/<slug>` for a client project), the nine own
projects that moved to `/tools` in #273 (`/work/<old>` and `/projects/<old>` go
to `/tools/<new>`, `lib/tools.ts`'s `movedSlugs`; `todoapp-caldav` became
`caldav-tasks-web`), the retired `/projects/homelab` (to `/tools/rostok`), the
renamed `/tools/template` (to `/tools/seed`), the old booking page `/contact-me`
(to `/book`, #190; `?service=<slug>` is kept like any query and the browser
keeps `#brief`) and blog slugs retired by a rename (today: the CalDAV post).
Every old path is listed with and without a trailing slash, so both land in one
hop, and no entry points at another redirect. A `/projects/<x>` with no new home
is not in the table and answers 404. Besides the table, a trailing slash on any
`/blog/<slug>`, `/work/<slug>` or `/tools/<slug>` URL redirects to the
slash-free form. An old `/blog?tab=<x>` link (the retired tab filter) answers
one 301 to `/blog`, keeping any other parameters: `lib/redirects.ts`'s
`blogTabRedirect()`, called from `routes/blog/index.tsx`'s handler, since it
depends on the query rather than the path. `redirectTarget()` is a pure
function, unit-tested in `lib/redirects.test.ts` without a server — the same
pattern as `lib/csp.ts` and `lib/cache-control.ts`; `test/structure.test.ts`
checks every old URL on the built site (one 301, query string kept, a 200 behind
it), and its internal-link crawl fails on any link that the table would
redirect. `main.ts` wires it as its own middleware, placed after the CSP and
cache middlewares but before `staticFiles()`/`app.fsRoutes()`: a redirect
response still needs the CSP and cache headers every other response gets, and it
gets them because those two middlewares set headers on whatever `ctx.next()`
resolves to, which is this middleware's response when it doesn't call
`ctx.next()` itself. It appends the request's query string to the target, so
launch links keep their UTM tags.
