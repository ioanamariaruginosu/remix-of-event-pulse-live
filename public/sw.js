// synqmap service worker — network-first for HTML, cache-first for assets.
const VERSION = 'v1';
const STATIC_CACHE = `synqmap-static-${VERSION}`;
const HTML_CACHE = `synqmap-html-${VERSION}`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => ![STATIC_CACHE, HTML_CACHE].includes(n)).map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first, fall back to cache, then offline shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(HTML_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(HTML_CACHE);
        const cached = await cache.match(req);
        return cached || cache.match('/') || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Static assets: cache-first.
  if (/\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })());
  }
});
