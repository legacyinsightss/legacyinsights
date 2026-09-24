/**
 * Service Worker: Offline Cache & Performance Accelerator
 * Legacy Insights / Footprint Enterprise POS & ERP
 */

const CACHE_NAME = 'footprint-pos-v4';
const STATIC_ASSETS = [
    '/logo.png',
    '/currency.js',
    '/user-session.js',
    '/instant-nav.js',
    '/telemetry-guard.js',
    '/offline-queue.js',
    '/pos',
    '/pos-register',
    '/dashboard'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('SW pre-cache warning:', err);
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);

    // Skip API endpoints
    if (url.pathname.startsWith('/api/')) return;

    // Allow cross-origin requests (fonts, CDNs) to be handled natively by the browser
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                return new Response('Network unavailable', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});
