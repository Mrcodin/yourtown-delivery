/**
 * Service Worker for Hometown Delivery
 * Provides offline support and intelligent caching
 * Version: 1.0.4
 */

const CACHE_VERSION = 'hometown-v1.0.4';
const CACHE_NAMES = {
    static: `${CACHE_VERSION}-static`,
    dynamic: `${CACHE_VERSION}-dynamic`,
    images: `${CACHE_VERSION}-images`,
    api: `${CACHE_VERSION}-api`,
};

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/shop.html',
    '/cart.html',
    '/track.html',
    '/about.html',
    '/styles.css',
    '/main.js',
    '/api.js',
    '/config.js',
    '/loading.js',
    '/loading.css',
    '/toast.js',
    '/toast.css',
    '/lazy-load.js',
    '/lazy-load.css',
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/shop.css',
    '/css/responsive.css',
    '/js/error-tracking.js',
    '/js/products.js',
    '/js/cart.js',
    '/js/shop.js',
    '/js/ui-helpers.js',
];

// Max cache sizes
const MAX_CACHE_SIZE = {
    dynamic: 50,
    images: 100,
    api: 30,
};

// Cache duration (in seconds)
const CACHE_DURATION = {
    static: 604800, // 7 days
    dynamic: 86400, // 1 day
    images: 2592000, // 30 days
    api: 300, // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches
            .open(CACHE_NAMES.static)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            return (
                                name.startsWith('hometown-') &&
                                !Object.values(CACHE_NAMES).includes(name)
                            );
                        })
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions and non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // API requests - network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
        return;
    }

    // Images - cache first, network fallback
    if (request.destination === 'image') {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
        return;
    }

    // Static assets - cache first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
        return;
    }

    // Dynamic content - stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.dynamic));
});

// Cache first strategy (best for static assets and images)
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Check if cache is still fresh
        const cacheTime = await getCacheTime(request, cacheName);
        const duration =
            CACHE_DURATION[Object.keys(CACHE_NAMES).find(key => CACHE_NAMES[key] === cacheName)] ||
            86400;

        if (Date.now() - cacheTime < duration * 1000) {
            return cachedResponse;
        }
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            await setCacheTime(request, cacheName);
            await limitCacheSize(cacheName, MAX_CACHE_SIZE[cacheName.split('-')[2]]);
        }

        return networkResponse;
    } catch (error) {
        // Return cached version if available
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
        }

        throw error;
    }
}

// Network first strategy (best for API calls)
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            await setCacheTime(request, cacheName);
            await limitCacheSize(cacheName, MAX_CACHE_SIZE.api);
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving API from cache (offline)');
            return cachedResponse;
        }

        throw error;
    }
}

// Stale while revalidate (best for dynamic content)
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
                setCacheTime(request, cacheName);
                limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic);
            }
            return networkResponse;
        })
        .catch(() => {
            // Fetch failed, rely on cache
            return cachedResponse;
        });

    // Return cached version immediately, update in background
    return cachedResponse || fetchPromise;
}

// Helper: Check if path is static asset
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.svg'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
        // Delete oldest entries
        const deleteCount = keys.length - maxSize;
        for (let i = 0; i < deleteCount; i++) {
            await cache.delete(keys[i]);
        }
    }
}

// Helper: Set cache timestamp
async function setCacheTime(request, cacheName) {
    const timeCache = await caches.open(`${cacheName}-time`);
    const response = new Response(Date.now().toString());
    await timeCache.put(request, response);
}

// Helper: Get cache timestamp
async function getCacheTime(request, cacheName) {
    const timeCache = await caches.open(`${cacheName}-time`);
    const response = await timeCache.match(request);

    if (response) {
        const text = await response.text();
        return parseInt(text, 10);
    }

    return 0;
}

// Listen for messages from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(CACHE_NAMES.dynamic).then(cache => cache.addAll(urls));
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
});

console.log('[SW] Service worker loaded');
