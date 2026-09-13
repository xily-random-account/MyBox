const CACHE_NAME = "MyBox-v6";
const CORE_ASSETS = [
  "/index.html",
  "/style.css",
  "/service_worker.js",
  "/mybox_offline_template.html",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icon_32.png",
  "/icon_maskable_192.png",
  "/icon_shadow_192.png",
  "/icon_windows_150.png",
  "/2_3/index.html",
  "/2_3/beepbox_editor.min.js",
  "/2_3/beepbox_offline.html",
  "/3_0/index.html",
  "/3_0/beepbox_editor.min.js",
  "/3_0/beepbox_offline.html",
  "/3_0/player/index.html",
  "/3_0/player/beepbox_player.min.js",
  "/player/index.html",
  "/player/beepbox_player.min.js",
  "/offline.html"
];

// Send progress updates
function sendProgress(progress) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: "CACHE_PROGRESS", progress });
    });
  });
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      let completed = 0;
      const total = CORE_ASSETS.length;

      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn("Failed to cache:", asset, e);
        }
        completed++;
        sendProgress(Math.round((completed / total) * 100));
      }
    }).then(() => self.skipWaiting())
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
    (async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response && response.ok) {
          if (
            event.request.url.startsWith(self.location.origin) ||
            event.request.url.includes("cdn.jsdelivr.net")
          ) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
          }
          return response;
        }

        // Fallback if response is not ok
        const fallback = await caches.match("/offline.html");
        return fallback || new Response("Offline", { status: 503 });
      } catch (err) {
        console.warn("Fetch failed:", event.request.url, err);
        const fallback = await caches.match("/offline.html");
        return fallback || new Response("Offline", { status: 503 });
      }
    })()
  );
});
