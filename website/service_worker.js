const CACHE_NAME = "MyBox-v5";
const CORE_ASSETS = [
  "/website/index.html",
  "/website/style.css",
  "/website/service_worker.js",
  "/website/mybox_offline_template.html",
  "/website/favicon.ico",
  "/website/apple-touch-icon.png",
  "/website/icon_32.png",
  "/website/icon_maskable_192.png",
  "/website/icon_shadow_192.png",
  "/website/icon_windows_150.png",

  // Version 2.3
  "/website/2_3/index.html",
  "/website/2_3/beepbox_editor.min.js",
  "/website/2_3/beepbox_offline.html",

  // Version 3.0
  "/website/3_0/index.html",
  "/website/3_0/beepbox_editor.min.js",
  "/website/3_0/beepbox_offline.html",
  "/website/3_0/player/index.html",
  "/website/3_0/player/beepbox_player.min.js",

  // Main player
  "/website/player/index.html",
  "/website/player/beepbox_player.min.js",

  // Offline fallback
  "/website/offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (
            event.request.url.startsWith(self.location.origin) ||
            event.request.url.includes("cdn.jsdelivr.net")
          ) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, response.clone())
            );
          }
          return response;
        })
        .catch(() => caches.match("/website/offline.html"));
    })
  );
});
