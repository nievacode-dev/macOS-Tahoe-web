const CACHE_NAME = 'macos-tahoe-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './css/window.css',
  './js/main.js',
  './js/window.js',
  './icons/macbook_pro_icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
