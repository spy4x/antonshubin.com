import { define } from "../lib/utils.ts";

// Cache name is derived from the build, not hand-bumped, so a deploy never
// edits a tracked file. BUILD_ID is set from the deploy commit hash (see
// scripts/deploy.ts); it falls back to a fixed value so `deno task dev` and
// local builds still work without it.
const BUILD_ID = Deno.env.get("BUILD_ID") || "dev";
const CACHE = `antonshubin-${BUILD_ID}`;

const PRECACHE_URLS = [
  "/",
  "/catalog",
  "/how-i-work",
  "/contact-me",
  "/blog",
  "/work",
  "/tools",
  "/pay",
  "/manifest.json",
];

const SW_SCRIPT =
  `// Cache version — derived from the build id, never hand-edited.
const CACHE = "${CACHE}";

const PRECACHE_URLS = ${JSON.stringify(PRECACHE_URLS)};

// Install: precache core pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

// Activate: delete old caches, claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => clients.claim()),
  );
});

// The fetch handler never writes a response marked no-store (the unsubscribe
// page shows one subscriber's address) to the cache, and never serves one
// from it. The precache list above holds no such page.
const isNoStore = (response) =>
  (response.headers.get("Cache-Control") || "").includes("no-store");

// Fetch: stale-while-revalidate — serve cache instantly, refresh in background
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((match) => {
      const cached = match && !isNoStore(match) ? match : undefined;
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic" && !isNoStore(response)) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

// Message: allow page to trigger skipWaiting
self.addEventListener("message", (event) => {
  if (event.data?.action === "skipWaiting") {
    self.skipWaiting();
  }
});
`;

export const handler = define.handlers({
  GET() {
    return new Response(SW_SCRIPT, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        // The browser detects a service-worker update byte for byte, so this
        // file must never be cached.
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  },
});
