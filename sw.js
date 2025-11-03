const CACHE_NAME = 'daily-transactions-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/vite.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate new service worker immediately
  );
});

self.addEventListener('fetch', event => {
  // Use a Network First, falling back to Cache strategy for navigation requests.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the network request is successful, clone it, cache it, and return it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network request fails (e.g., offline), serve the cached page.
          return caches.match(event.request.url) || caches.match('/');
        })
    );
    return;
  }

  // Use a Cache First, falling back to Network strategy for other requests (assets).
  event.respondWith(
    caches.match(event.request).then(response => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }

      // Otherwise, fetch from the network.
      return fetch(event.request).then(networkResponse => {
        // Cache responses from our origin and the CDN.
        if (
          networkResponse.type === 'basic' ||
          event.request.url.startsWith('https://aistudiocdn.com')
        ) {
          // If the fetch is successful, clone it, cache it, and return it.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});