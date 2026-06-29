const CACHE_NAME = 'walk-with-me-assets-v1';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './assets/audio/station-1.mp3',
  './assets/audio/station-2.mp3',
  './assets/audio/station-3.mp3',
  './assets/audio/station-4.mp3',
  './assets/audio/station-5.mp3',
  './assets/audio/station-6.mp3',
  './assets/audio/station-7.mp3',
  './assets/audio/station-8.mp3',
  './assets/audio/station-9.mp3'
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

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (request.destination === 'document' || request.destination === 'style' || request.destination === 'script' || request.destination === 'manifest' || request.destination === 'image') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  if (request.url.includes('.mp3')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
  }
});
