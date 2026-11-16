const CACHE_VERSION = 'al-azhar-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypassCache(url) {
  const host = url.hostname;
  if (
    host.includes('firestore.googleapis.com') ||
    host.includes('identitytoolkit.googleapis.com') ||
    host.includes('securetoken.googleapis.com') ||
    host.includes('firebaseinstallations.googleapis.com') ||
    host.includes('accounts.google.com')
  ) {
    return true;
  }
  if (host === 'www.googleapis.com' && url.pathname.startsWith('/drive')) {
    return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) return;

  // 1. Hashed Vite static assets & images: Cache-First, NEVER cache HTML fallback responses
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          const cachedType = cached.headers.get('content-type') || '';
          if (!cachedType.includes('text/html')) {
            return cached;
          }
          caches.open(CACHE_VERSION).then((cache) => cache.delete(request));
        }
        return fetch(request).then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (response && response.ok && !contentType.includes('text/html')) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Google Fonts stylesheets and font files: Stale-While-Revalidate
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // 3. App shell / HTML navigation: Always fetch fresh from network (no-store) so deploys never serve stale chunk hashes
  if (
    request.mode === 'navigate' ||
    (url.origin === self.location.origin &&
      (url.pathname === '/' || url.pathname === '/index.html'))
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (response && response.ok && contentType.includes('text/html')) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
  }
});
