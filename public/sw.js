const CACHE_NAME = "legioncoin-shell-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/images/legion-cat-mascot-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    let assets = APP_SHELL;
    try {
      const response = await fetch("/precache-manifest.json", { cache: "no-store" });
      if (response.ok) {
        const manifest = await response.json();
        if (Array.isArray(manifest.assets)) assets = [...new Set([...APP_SHELL, ...manifest.assets])];
      }
    } catch {
      // Development mode may not have a generated manifest yet; keep the basic app shell.
    }
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("legioncoin-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("/"))));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok && response.type === "basic") caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    });
  }));
});
