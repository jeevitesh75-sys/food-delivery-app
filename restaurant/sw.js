// ── RESTAURANT sw.js — Webpushr ──
importScripts("https://cdn.webpushr.com/sw.min.js");

const CACHE_NAME = "restaurant-v2";

const FILES = [
  "/restaurant/",
  "/restaurant/login.html",
  "/restaurant/Dashboard.html",
  "/restaurant/Profile.html",
  "/restaurant/details.html",
  "/restaurant/manifest.json",
  "/restaurant/icons/restaurant-192.png",
  "/restaurant/icons/restaurant-512.png"
];

// ── INSTALL ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  clients.claim();
});

// ── FETCH ──
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request))
  );
});

// ── PUSH — shows popup even when app/browser is closed ──
self.addEventListener("push", (event) => {
  let title   = "🍴 New Order!";
  let body    = "You have a new order. Tap to view.";
  let icon    = "/restaurant/icons/restaurant-192.png";
  let badge   = "/restaurant/icons/restaurant-192.png";
  let url     = "/restaurant/Dashboard.html";

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title   || title;
      body  = data.body    || data.message || body;
      icon  = data.icon    || icon;
      url   = data.url     || url;
    } catch(e) {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate:            [300, 100, 300, 100, 300],
      tag:                "restaurant-order",   // replaces old notif (no spam)
      renotify:           true,                 // still vibrates even if same tag
      requireInteraction: true,                 // stays on screen until tapped
      data: { url },
      actions: [
        { action: "open",    title: "View Orders" },
        { action: "dismiss", title: "Dismiss" }
      ]
    })
  );
});

// ── NOTIFICATION CLICK — opens dashboard when user taps popup ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : "/restaurant/Dashboard.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // If dashboard tab already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/restaurant/") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
