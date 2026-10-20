const CACHE = "meteli-v5-aligned-text-2026-10-20";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./scheme.svg"];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith("meteli-") && name !== CACHE).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req).then(async response => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(req, response.clone());
        }
        return response;
      }).catch(async () =>
        (await caches.match(req)) || (await caches.match("./index.html"))
      )
    );
  } else {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  }
});