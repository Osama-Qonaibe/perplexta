// Version 1.0.3 - Resilient Routing & Navigation Bypass
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear all caches on activation to prevent stale asset issues during build transitions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Bypass all navigation requests (F5 / deep-link refreshes)
  // This ensures the server always handles the initial HTML delivery,
  // providing fresh CSP nonces and server-side SEO metadata.
  if (event.request.mode === 'navigate') {
    return;
  }

  // 2. Bypass API calls and Uploads - never cache these in SW
  if (event.request.url.includes('/api/') || event.request.url.includes('/uploads/')) {
    return;
  }

  // 3. Let the browser handle video/audio streaming and Range requests natively
  if (
    event.request.headers.has('range') ||
    event.request.destination === 'video' ||
    event.request.destination === 'audio'
  ) {
    return;
  }

  // 4. Workaround for Chromium 'only-if-cached' bug
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }

  // 5. Safe pass-through for other assets (JS, CSS, Images)
  // We avoid aggressive SW caching for now to ensure professional consistency across refreshes.
  event.respondWith(
    fetch(event.request).catch((err) => {
      console.warn('[SW] Fetch failed, returning network error state:', err);
      return new Response('Network Error', { status: 408, statusText: 'Network Error' });
    })
  );
});

// 5. Service Worker Background Sync Strategy
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


