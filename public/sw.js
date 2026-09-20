// Perplexta Platform PWA Service Worker (v2.3.0)
const CACHE_NAME = 'perplexta-pwa-v2.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache critical app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-blocking static asset caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old outdated versions while preserving current cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging outdated cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener to purge cache on demand
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'CLEAR_CACHE' || event.data.type === 'SKIP_WAITING')) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });
  }
});

// Fetch routing strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass API endpoints, uploads, streaming media, dev server modules, and internal endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/.well-known/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('@fs') ||
    url.pathname.endsWith('/sw.js') ||
    url.pathname.endsWith('/version.json') ||
    event.request.headers.has('range') ||
    event.request.destination === 'video' ||
    event.request.destination === 'audio'
  ) {
    return;
  }

  // 2. Navigation / HTML requests: Network-First ALWAYS. Do NOT cache dynamic URLs into SW
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200 && (url.pathname === '/' || url.pathname === '/index.html')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
          }
          return response;
        })
        .catch(async () => {
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
          return new Response('<h1>Perplexta Offline</h1><p>You are currently offline. Please check your network connection.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 3. Static assets (JS, CSS, Images, Fonts): Network-First for JS/CSS, Stale-While-Revalidate for images/fonts
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/brand/') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    ['style', 'script', 'image', 'font'].includes(event.request.destination)
  ) {
    const isCodeAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

    if (isCodeAsset) {
      // Network-First for JS & CSS to guarantee fresh code on normal page reload (F5)
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
              return networkResponse;
            }
            // If 404 (stale chunk hash), bypass cache and attempt fresh fetch or purge
            if (networkResponse.status === 404) {
              caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match(event.request);
          })
      );
      return;
    }

    // Images and fonts: Cache-First / Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default network pass-through
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chat-messages') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'SYNC_CHAT_MESSAGES',
            timestamp: Date.now()
          });
        }
      })
    );
  }
});
