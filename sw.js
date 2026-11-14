/* Offline support for the website / installed web app. Not used inside the Android, iOS or desktop apps. */
const CACHE = "sandhya-japa-v1.4.0";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./fonts/fonts.css",
  "./fonts/tiro-devanagari-sanskrit-devanagari-400-normal.woff2", "./fonts/tiro-devanagari-sanskrit-latin-400-normal.woff2",
  "./fonts/anek-latin-latin-400-normal.woff2", "./fonts/anek-latin-latin-600-normal.woff2", "./fonts/anek-latin-latin-700-normal.woff2",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // The page itself: try the network first so updates arrive, fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Fonts, icons and the rest: saved copy first, then the network (and keep what comes back).
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
