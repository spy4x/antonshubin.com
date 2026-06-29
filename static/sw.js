// Cache version — bump on each deploy where sw.js changes
const CACHE = "antonshubin-v34";

const PRECACHE_URLS = [
  "/",
  "/catalog",
  "/how-i-work",
  "/contact-me",
  "/blog",
  "/projects",
  "/pay",
  "/manifest.json",
];

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

// Fetch: stale-while-revalidate — serve cache instantly, refresh in background
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
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
