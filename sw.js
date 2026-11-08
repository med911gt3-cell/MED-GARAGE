// ============================================
// MED GARAGE — Service Worker
// Network-First Strategy
// Version: 4.1 (إزالة oil2.png مؤقتاً)
// ============================================

const CACHE_NAME = 'med-garage-v4.1';

const CACHE_URLS = [
  './',
  './index.html',
  './dashboard.html',
  './settings.html',
  './stock.html',
  './invoices.html',
  './finance.html',
  './gallery-reviews.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  // 🚗 ماركات السيارات
  './icon1.png', './icon2.png', './icon3.png', './icon4.png', './icon5.png',
  './icon6.png', './icon7.png', './icon8.png', './icon9.png', './icon10.png',
  // 🔧 قطع الغيار
  './piece1.png', './piece2.png', './piece3.png', './piece4.png', './piece5.png',
  './piece6.png', './piece7.png', './piece8.png', './piece9.png', './piece10.png',
  // 🛢️ الزيوت
  // TODO: './oil2.png', ← بعد تصحيح اسم iol2.png إلى oil2.png، فعّل هذا السطر
  './oil1.png', './oil3.png', './oil4.png', './oil5.png'
];

const CDN_WHITELIST = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing v4.1...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CACHE_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('⚠️ [SW] Failed to cache:', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🔧 [SW] Activating v4.1...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isWhitelisted = CDN_WHITELIST.includes(url.hostname);
  if (!isSameOrigin && !isWhitelisted) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(req).then((cached) => {
          if (cached) {
            console.log('📦 [SW] From cache (offline):', req.url);
            return cached;
          }

          if (req.destination === 'document') {
            return caches.match('./index.html');
          }

          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data && event.data.action === 'clearCache') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
      console.log('🗑️ [SW] All caches cleared');
    });
  }
});

self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
});

console.log('✅ [SW] Service Worker loaded — MED GARAGE v4.1');