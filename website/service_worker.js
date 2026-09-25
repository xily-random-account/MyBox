const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `Slarmoos-Box-${CACHE_VERSION}`;

// Precise list of files required for full offline application functionality
const ASSETS_TO_CACHE = [
	"/",
	"/index.html",
	"/index_debug.html",
	"/manifest.webmanifest",
	"/style.css",
	"/editor.html",
	
	// Core Editors and Synths
	"/mybox_editor.min.js",
	"/mybox_synth.min.js",
	"/foolish_editor.min.js",
	
	// Player Assets
	"/player/",
	"/player/index.html",
	"/player/mybox_player.min.js",
	"/player/foolish_player.min.js",
	
	// Legacy / Alternate Versions
	"/2_3/index.html",
	"/2_3/beepbox_editor.min.js",
	"/3_0/index.html",
	"/3_0/beepbox_editor.min.js",
	"/3_0/player/index.html",
	"/3_0/player/beepbox_player.min.js",

	// Sample Packs (Crucial for offline audio playback)
	"/samples.js",
	"/samples2.js",
	"/samples3.js",
	"/drumsamples.js",
	"/kirby_samples.js",
	"/wario_samples.js",
	"/mario_paintbox_samples.js",
	"/nintaribox_samples.js",
	
	// External Essential CDNs
	"https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js"
];

// 1. Install Stage: Cache all critical assets immediately
self.addEventListener("install", function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache) {
			// Map settled array responses to prevent individual 404s from breaking the entire installation loop
			return Promise.allSettled(
				ASSETS_TO_CACHE.map(url => 
					cache.add(url).catch(err => console.warn(`Failed to cache asset: ${url}`, err))
				)
			);
		}).then(() => self.skipWaiting())
	);
});

// 2. Activate Stage: Automatically drop old version caches to preserve storage
self.addEventListener("activate", function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cache) {
					if (cache !== CACHE_NAME) {
						return caches.delete(cache);
					}
				})
			);
		}).then(() => self.clients.claim())
	);
});

// 3. Fetch Stage: Cache-First Strategy with Background Revalidation
self.addEventListener("fetch", function(event) {
	if (event.request.method !== "GET") return;

	const url = event.request.url;

	// Dynamic lookup rules for assets we want saved to permanent offline cache structures
	const isCacheableOrigin = 
		url.startsWith(self.location.origin) ||
		url.startsWith("https://googleapis.com") ||
		url.startsWith("https://gstatic.com") ||
		url.startsWith("https://jsdelivr.net");

	if (!isCacheableOrigin) return;

	event.respondWith(
		caches.match(event.request).then(function(cachedResponse) {
			// Trigger a silent background request to keep assets completely up-to-date
			const networkFetch = caches.open(CACHE_NAME).then(function(cache) {
				return fetch(event.request).then(function(networkResponse) {
					if (networkResponse.status === 200) {
						cache.put(event.request, networkResponse.clone());
					}
					return networkResponse;
				}).catch(() => null); // Gracefully absorb network dropouts in the background
			});

			// Instantly return the local file copy if it exists, otherwise fall back to network fetch
			return cachedResponse || networkFetch;
		})
	);
});
