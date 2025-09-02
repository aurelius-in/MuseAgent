const CACHE_NAME = 'museagent-cache-v12';
const ASSETS = [
  './index.html',
  './styles.css',
  './theme.css',
  './animations.css',
  './app.js',
  './charts.js',
  './pagination.js',
  './offline.js',
  './heatmap.js',
  './icons.svg',
  './mock_data.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Network-first for mock_data.json to pick up library updates, fallback to cache
    if (url.pathname.endsWith('/mock_data.json')) {
      e.respondWith(
        fetch(new Request(e.request, { cache: 'reload' })).then(r => {
          const copy = r.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return r;
        }).catch(() => caches.match(e.request))
      );
      return;
    }
    // Default: cache-first, then network
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return r;
      }).catch(() => caches.match('./index.html')))
    );
  }
});


