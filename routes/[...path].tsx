// Catch-all for a URL that matches no other route (see #177 R-001). Without
// this file, Fresh renders such a request through _404.tsx's error-handler
// path, which runs outside the middleware chain — so an unmatched URL got no
// Content-Security-Policy header, unlike a matched-but-missing page such as
// /blog/no-such-post. Reusing _404.tsx's own handler and component (not
// copying them) routes an unmatched URL through the same middleware chain as
// every other request, so it picks up the CSP, cache and X-Robots-Tag
// headers like any other page.
//
// This is the least specific route Fresh can match (see `fs_routes.ts`'s
// `getRoutePathScore` — a `[...name]` segment sorts last), so every static
// file, `/api/*` route, `/sw.js` and any other specific route still wins.
// `_404.tsx` only defines GET and HEAD handlers; a request with any other
// method to an unmatched URL is unaffected by this file — Fresh answers it
// with the same bare "Not Found" text and no security headers, matched or
// not, the same as it already does for any other method this site's routes
// don't define (verified: POST to an unmatched URL and POST to a real
// GET-only route both return identical bodies).
export { default, handler } from "./_404.tsx";
