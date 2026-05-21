// Service Worker for SICUAN PWA
const CACHE_NAME = "sicuan-cache-v1";
const ASSETS_TO_CACHE = ["/", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
          return Promise.resolve(true);
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline if fetching fails
        return new Response(
          "Offline mode. Silakan periksa koneksi internet Anda.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      });
    }),
  );
});
