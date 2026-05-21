// Service Worker for SICUAN PWA
// Strategy: Network-first for navigation (HTML), cache-first for static assets.
const CACHE_NAME = "sicuan-cache-v2";
const STATIC_ASSETS = ["/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  // Activate new SW immediately without waiting for old tabs to close
  self.skipWaiting();
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
  // Take control of all open pages immediately
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // NETWORK-FIRST for HTML navigation requests (page loads).
  // This ensures server-side auth redirects always work correctly.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, fall back to a simple offline message
        return new Response(
          "<!DOCTYPE html><html><body><h2>Anda sedang offline.</h2><p>Silakan periksa koneksi internet Anda dan muat ulang halaman.</p></body></html>",
          {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        );
      }),
    );
    return;
  }

  // CACHE-FIRST for static assets (images, fonts, icons).
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Default: network only (API calls, server actions, etc.)
  event.respondWith(fetch(event.request));
});
