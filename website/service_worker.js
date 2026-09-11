
const cacheName = "MyBox-v2";

self.addEventListener("install", function(event) {
	event.waitUntil(
		caches.open(cacheName).then(function(cache) {
			return cache.addAll([
				"/",
				"/index.html",
				"/style.css",
				"/service_worker.js",
				"/mybox_editor.min.js",
				"/player/",
				"/player/mybox_player.min.js",
				"/3_0/",
				"/3_0/mybox_editor.min.js",
				"/3_0/player/",
				"/3_0/player/mybox_player.min.js",
				"/2_3/",
				"/2_3/mybox_editor.min.js",
				"https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js",
			]).then(() => self.skipWaiting());
		})
	);
});

self.addEventListener("activate", function(event) {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
	if (event.request.method != "GET") return;
	
	event.respondWith(
		caches.open(cacheName).then(function(cache) {
			return fetch(event.request).then(function(response) {
				// If this is a local resource or related to google fonts, add
				// it to the permanent cache.
				if (event.request.url.startsWith(self.location.origin) ||
					event.request.url.startsWith("https://fonts.googleapis.com") ||
					event.request.url.startsWith("https://fonts.gstatic.com") ||
					event.request.url.startsWith("https://cdn.jsdelivr.net"))
				{
					cache.put(event.request, response.clone());
				}
				return response;
			}).catch(function() {
				return cache.match(event.request);
			});
		})
	);
});
