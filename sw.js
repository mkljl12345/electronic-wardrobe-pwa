const CACHE = 'zhijian-pwa-v12';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/index-BrDmtj2V.js',
  './assets/index-Dn82YseF.css',
  './home-collage.webp',
  './home-collage-2.webp',
  './landscape-easter-egg.webp',
  './pwa-icon-192.png',
  './pwa-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(APP_SHELL.map(async path => {
    const response = await fetch(path, { cache: 'reload' });
    if (!response.ok) throw new Error(`Unable to cache ${path}`);
    await cache.put(path, response);
  }))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  const freshFirst = url.origin === location.origin &&
    (event.request.mode === 'navigate' || ['script', 'style'].includes(event.request.destination));
  if (freshFirst) {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && new URL(event.request.url).origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
