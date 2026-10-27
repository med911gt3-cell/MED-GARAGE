const CACHE_NAME = 'med-garage-v2.0';
const urlsToCache = [
  'index.html',
  'stock.html',
  'invoices.html',
  'finance.html',
  'gallery-reviews.html',
  'admin.html',
  'manifest.json'
];

// تثبيت الـ Service Worker الجديد ومسح الكاش القديم فوراً
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// تفعيل الإصدار الجديد وحذف أي كاش قديم عالق
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الملفات المحدثة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
