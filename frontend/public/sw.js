const cacheName = 'gastoclaro-static-v4';
const staticFiles = new Set([
  '/gastoclaro-hero.webp',
  '/chanchito/vacio.webp',
  '/chanchito/error.webp',
  '/chanchito/cargando.webp',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll([...staticFiles])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('gastoclaro-static-') && key !== cacheName)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const illustration = /^\/(chanchito|metas|categorias|tarjetas|iconos)\/[a-z-]+\.webp$/.test(
    url.pathname,
  );
  const builtAsset = /^\/assets\/[^/]+\.(js|css)$/.test(url.pathname);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.search ||
    request.headers.has('Authorization') ||
    (!staticFiles.has(url.pathname) && !builtAsset && !illustration)
  )
    return;

  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      const type = response.headers.get('Content-Type') || '';
      if (response.ok && !response.redirected && !type.includes('text/html')) {
        await cache.put(request, response.clone());
      }
      return response;
    }),
  );
});
