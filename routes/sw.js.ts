import { define } from "../lib/utils.ts";

// The site has no service worker any more (#285). Browsers that registered
// the old one (#259: it reloaded a first visit; it precached eight pages)
// still check this URL on their next visit. This script replaces it: it
// deletes every cache, unregisters itself and does nothing else, so those
// browsers end up with no worker and no stored pages. Nothing registers it
// now. Keep the route until old registrations have had time to expire (until
// about the end of January 2027), then delete it together with the purge
// step's build-id read (scripts/cloudflare-purge.ts).
//
// BUILD_ID is set from the deploy commit hash (see scripts/deploy.ts). The
// script still carries it as `const CACHE = "antonshubin-<id>"` because the
// deploy reads that line from the live URL to know when the new build is up
// and which static files changed since the previous one.
const BUILD_ID = Deno.env.get("BUILD_ID") || "dev";

// It never calls skipWaiting() or clients.claim(): replacing the old worker
// under an open page fires "controllerchange", and the old page's update code
// reloads on it. So this worker waits until the visitor's old tabs are closed,
// or until the old page's "New version available" banner asks it to take over
// (its Reload button posts { action: "skipWaiting" }), then clears the caches
// and unregisters. Calling unregister() at install
// instead left the old worker alive and refilling its caches.
const SW_SCRIPT =
  `// Retired service worker: clears its caches and unregisters itself.
const CACHE = "antonshubin-${BUILD_ID}";

self.addEventListener("message", (event) => {
  if (event.data?.action === "skipWaiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister()),
  );
});
`;

export const handler = define.handlers({
  GET() {
    return new Response(SW_SCRIPT, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        // The browser detects a worker update byte for byte, so this file
        // must never be cached.
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  },
});
