/**
 * Cache Control Middleware
 * Sets appropriate cache headers for different resource types
 */

// Cache durations in seconds
const CACHE_DURATIONS = {
    static: 31536000, // 1 year - Static assets with hash/version in filename
    public: 86400, // 1 day - Public resources
    private: 3600, // 1 hour - User-specific content
    api: 300, // 5 minutes - API responses
    noCache: 0, // No cache - Always fresh
};

/**
 * Static asset cache (CSS, JS, images with versioning)
 * Use max-age for immutable assets
 */
exports.staticCache = (req, res, next) => {
    res.set({
        'Cache-Control': `public, max-age=${CACHE_DURATIONS.static}, immutable`,
        Expires: new Date(Date.now() + CACHE_DURATIONS.static * 1000).toUTCString(),
    });
    next();
};

/**
 * Public resource cache (images, fonts without versioning)
 * Use shorter cache with revalidation
 */
exports.publicCache = (req, res, next) => {
    res.set({
        'Cache-Control': `public, max-age=${CACHE_DURATIONS.public}, must-revalidate`,
        Expires: new Date(Date.now() + CACHE_DURATIONS.public * 1000).toUTCString(),
    });
    next();
};

/**
 * Private content cache (user-specific data)
 */
exports.privateCache = (req, res, next) => {
    res.set({
        'Cache-Control': `private, max-age=${CACHE_DURATIONS.private}`,
        Expires: new Date(Date.now() + CACHE_DURATIONS.private * 1000).toUTCString(),
    });
    next();
};

/**
 * API response cache with ETag support
 */
exports.apiCache = (duration = CACHE_DURATIONS.api) => {
    return (req, res, next) => {
        res.set({
            'Cache-Control': `public, max-age=${duration}, must-revalidate`,
            Expires: new Date(Date.now() + duration * 1000).toUTCString(),
        });
        next();
    };
};

/**
 * No cache - Always fetch fresh
 */
exports.noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
    });
    next();
};

/**
 * Auto cache based on request path
 */
exports.autoCache = (req, res, next) => {
    const path = req.path;

    // Static assets with versioning (e.g., style.v1.css, main.abc123.js)
    if (/\.(css|js|woff2?|ttf|eot)(\?.*)?$/i.test(path) && /\.(v\d+|[a-f0-9]{6,})\./i.test(path)) {
        return exports.staticCache(req, res, next);
    }

    // Images and fonts
    if (/\.(jpe?g|png|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(path)) {
        return exports.publicCache(req, res, next);
    }

    // API responses
    if (path.startsWith('/api/')) {
        // Specific API caching rules
        if (path.includes('/products') || path.includes('/settings')) {
            return exports.apiCache(300)(req, res, next); // 5 minutes
        }
        if (path.includes('/stats') || path.includes('/dashboard')) {
            return exports.apiCache(60)(req, res, next); // 1 minute
        }
        if (path.includes('/orders') || path.includes('/customers')) {
            return exports.noCache(req, res, next); // No cache for dynamic data
        }
        return exports.apiCache()(req, res, next);
    }

    // HTML pages - no cache
    if (/\.html?$/i.test(path) || path === '/') {
        return exports.noCache(req, res, next);
    }

    next();
};

/**
 * Compression middleware for text-based responses
 */
exports.shouldCompress = (req, res) => {
    if (req.headers['x-no-compression']) {
        return false;
    }
    return true;
};

/**
 * ETa support for conditional requests
 */
exports.conditionalRequest = (req, res, next) => {
    const etag = res.getHeader('ETag');
    const ifNoneMatch = req.headers['if-none-match'];

    if (etag && ifNoneMatch === etag) {
        res.status(304).end();
        return;
    }

    const lastModified = res.getHeader('Last-Modified');
    const ifModifiedSince = req.headers['if-modified-since'];

    if (lastModified && ifModifiedSince === lastModified) {
        res.status(304).end();
        return;
    }

    next();
};
