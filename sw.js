const CACHE_NAME = 'med-garage-v1';
const assetsToCache = [
  './index.html',
  'https://i.ibb.co/WNLpSFtT/file-0000000075dc8246b5406b4631a67ae8.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
