// ============================================
// MED GARAGE — Service Worker
// Network-First Strategy
// Version: 3.0
// ============================================

const CACHE_NAME = 'med-garage-v3.0';

const CACHE_URLS = [
  './',
  './index.html',
  './dashboard.html',
  './settings.html',
  './stock.html',
  './invoices.html',
  './finance.html',
  './gallery-reviews.html',
  './manifest.json'
];

// ============================================
// INSTALL — تثبيت Service Worker جديد
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing...');
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

// ============================================
// ACTIVATE — تفعيل وحذف الكاش القديم
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
// الشبكة أولاً، الكاش احتياطياً
// ============================================
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // تجاهل الطلبات غير GET
  if (req.method !== 'GET') return;

  // تجاهل الطلبات الخارجية (Firebase, ibb.co, Google Fonts, ...)
  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  if (url.origin !== self.location.origin) {
    return; // يخدمها المتصفح عادي
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        // نجح الاتصال → حدث الكاش بالنسخة الجديدة
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // فشل الاتصال → ارجع من الكاش
        return caches.match(req).then((cached) => {
          if (cached) {
            console.log('📦 [SW] From cache (offline):', req.url);
            return cached;
          }

          // إذا كان طلب صفحة ولم يوجد في الكاش → ارجع index.html
          if (req.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// ============================================
// MESSAGE — استقبال أوامر من الصفحات
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('⚡ [SW] skipWaiting requested');
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
// SYNC — مزامنة خلفية (اختياري، للمستقبل)
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);
  // يمكن استخدامها لاحقاً لمزامنة الحجوزات مع Firebase
});

console.log('✅ [SW] Service Worker loaded — MED GARAGE v3.0');