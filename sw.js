// ============================================
// MED GARAGE — Service Worker
// Network-First Strategy
// Version: 3.3  ← ⚠️ ارفع الرقم عند كل تحديث
// ============================================

const CACHE_NAME = 'med-garage-v3.3';

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
  './icon-maskable.png'   // ✅ مضاف
];

// ✅ مصادر خارجية مسموح تخزينها (اختياري)
const CDN_WHITELIST = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing v3.3...');

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
  // ⚠️ أزلنا self.skipWaiting() لتجنب مقاطعة العمل الجاري
});

// ============================================
// ACTIVATE
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔧 [SW] Activating...');

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

// ============================================
// FETCH — Network-First
// ============================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // ✅ استثناء CDN الموثوق
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

          // ✅ رد احتياطي دائم
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});

// ============================================
// MESSAGE
// ============================================
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

// ============================================
// SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
});

console.log('✅ [SW] Service Worker loaded — MED GARAGE v3.3');