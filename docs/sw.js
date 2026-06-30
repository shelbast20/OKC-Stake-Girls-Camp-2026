const CACHE_NAME = 'walk-with-me-assets-v3';
const APP_SHELL = [
  new URL('./', self.location.href).href,
  new URL('./index.html', self.location.href).href,
  new URL('./offline.html', self.location.href).href,
  new URL('./css/styles.css', self.location.href).href,
  new URL('./js/app.js', self.location.href).href,
  new URL('./manifest.json', self.location.href).href,
  new URL('./icons/icon-192.png', self.location.href).href,
  new URL('./icons/icon-512.png', self.location.href).href,
  new URL('./assets/audio/station-1.mp3', self.location.href).href,
  new URL('./assets/audio/station-2.mp3', self.location.href).href,
  new URL('./assets/audio/station-3.mp3', self.location.href).href,
  new URL('./assets/audio/station-4.mp3', self.location.href).href,
  new URL('./assets/audio/station-5.mp3', self.location.href).href,
  new URL('./assets/audio/station-6.mp3', self.location.href).href,
  new URL('./assets/audio/station-7.mp3', self.location.href).href,
  new URL('./assets/audio/station-8.mp3', self.location.href).href,
  new URL('./assets/audio/station-9.mp3', self.location.href).href
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match(new URL('./index.html', self.location.href).href);
          }
          return caches.match(new URL('./offline.html', self.location.href).href);
        });
    })
  );
});
