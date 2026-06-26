// Webpushr MUST be first line — handles all push notifications
importScripts("https://cdn.webpushr.com/sw.min.js");

const CACHE_NAME = "restaurant-v2";

const FILES = [
  "/restaurant/",
  "/restaurant/login.html",
  "/restaurant/Dashboard.html",
  "/restaurant/Profile.html",
  "/restaurant/details.html",
  "/restaurant/manifest.json"
];

// ── INSTALL — cache files for PWA install ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES).catch(() => {}))
  );
  self.skipWaiting();
});

// ── ACTIVATE — clear old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  clients.claim();
});

// ── FETCH — serve from cache if available ──
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request))
  );
});

// NOTE: NO push or notificationclick handlers here!
// Webpushr's sw.min.js handles those automatically above.
