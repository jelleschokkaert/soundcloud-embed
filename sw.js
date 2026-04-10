const CACHE_NAME = 'music-player-v1';
const SHELL_URLS = [
    '/',
    '/index.html'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Network-first for HTML, cache-first for static assets
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(() => caches.match('/index.html'))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(r => r || fetch(e.request))
        );
    }
});
