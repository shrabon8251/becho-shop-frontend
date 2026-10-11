// Minimal service worker: cache-first for static assets, network-first for pages/API.
// Bump CACHE_VERSION on every release: Vite hashes JS/CSS so those
// self-invalidate, but unhashed assets (icon-*.png, manifest.webmanifest)
// stay stale until this string changes (old caches are purged on activate).
const CACHE_VERSION = "v2";
const CACHE = "shopsaas-" + CACHE_VERSION;
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
    const u = new URL(e.request.url);
    if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
    // Never cache /src/: those are Vite dev-server modules that change on every
    // edit — cache-first here serves stale code after each save. Production
    // builds don't have /src/ (hashed files live under /assets/).
    if (u.pathname.startsWith("/src/")) return;
    if (u.pathname.startsWith("/assets/") || u.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2?|css|js)$/)) {
        e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { c.put(e.request, res.clone()); return res; }).catch(() => hit))));
    }
});
