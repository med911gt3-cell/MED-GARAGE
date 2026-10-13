const CACHE_NAME = 'med-garage-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://i.ibb.co/WNLpSFtT/file-0000000075dc8246b5406b4631a67ae8.png'
];

// التثبيت التلقائي والتخزين الفوري لكل الملفات في الخلفية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// تفعيل السيرفيس ووركر وحذف النسخ القديمة إن وجدت
self.activateHandler = self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.claim = self.clients.claim();
});

// جلب الملفات من الكاش مباشرة لضمان السرعة الخارقة والعمل بدون إنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا الملف مخزن رجعه مباشرة، وإذا لا اطلبه من الشبكة
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // تحقق إذا الرد صحيح قبل تخزينه ديناميكياً
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(() => {
          // في حال انقطع الإنترنت تماماً ولم يتم العثور على الملف
          return caches.match('./index.html');
        });
      })
  );
});
