// MAXUP Service Worker — Cache & Offline
const CACHE_NAME = 'maxup-v24-primera-vista';
// OJO: si un asset de esta lista no existe (404), addAll falla y NO se cachea nada.
// mantenimiento.webp se descarga solo si el mantenimiento se activa.
const ASSETS = [
  './',
  './index.html',
  './privacidad.html',
  './styles.css?v=20260918-filtro-precio',
  './app.js?v=20260930-primera-vista',
  './logo.png',
  './logo-transparent.png',
  './favicon.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap'
];

// Install: cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: los archivos versionados salen del cache de inmediato y se actualizan
// en segundo plano. El HTML sigue usando red primero para recibir cambios.
self.addEventListener('fetch', e => {
  // Skip non-GET and API calls
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('googletagmanager')) return;

  const url = new URL(e.request.url);
  const esEstaticoVersionado = url.origin === self.location.origin &&
    (/\.(?:js|css|png|jpg|jpeg|webp|svg|woff2?)$/i.test(url.pathname));

  if (esEstaticoVersionado) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const actualizacion = fetch(e.request).then(res => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || actualizacion;
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(res => {
      if (res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
