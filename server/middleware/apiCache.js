/**
 * In-Memory API Response Cache
 * Reduces database queries by caching GET request responses
 */

// Simple in-memory cache implementation
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    set(key, value, ttl = 300) {
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Store value
        this.cache.set(key, value);

        // Set expiration timer
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttl * 1000);

        this.timers.set(key, timer);
    }

    get(key) {
        return this.cache.get(key);
    }

    has(key) {
        return this.cache.has(key);
    }

    delete(key) {
        this.cache.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    clear() {
        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.cache.clear();
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    size() {
        return this.cache.size;
    }

    getStats() {
        return {
            keys: this.cache.size,
            hits: this.hits || 0,
            misses: this.misses || 0,
            hitRate: this.hits ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%' : '0%'
        };
    }
}

// Create cache instance
const cache = new SimpleCache();

// Track hits/misses
cache.hits = 0;
cache.misses = 0;

/**
 * API response caching middleware
 * @param {Number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 * @returns {Function} Express middleware
 */
const apiResponseCache = (duration = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching for authenticated user-specific requests
        // (unless specifically marked as cacheable)
        if (req.headers.authorization && !req.query.cacheable) {
            return next();
        }

        // Create cache key from URL and query params
        const key = `api:${req.originalUrl || req.url}`;
        
        // Check if response is in cache
        if (cache.has(key)) {
            const cachedResponse = cache.get(key);
            console.log(`✅ Cache HIT: ${key}`);
            cache.hits++;
            res.set('X-Cache', 'HIT');
            return res.json(cachedResponse);
        }

        console.log(`❌ Cache MISS: ${key}`);
        cache.misses++;
        res.set('X-Cache', 'MISS');

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (body) => {
            // Cache successful responses only
            if (body && body.success !== false && res.statusCode === 200) {
                cache.set(key, body, duration);
                console.log(`💾 Cached: ${key} (TTL: ${duration}s)`);
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Clear cache for a specific pattern
 * @param {String} pattern - Pattern to match keys (regex string or substring)
 * @returns {Number} Number of keys deleted
 */
const clearCachePattern = (pattern) => {
    const keys = cache.keys();
    let deleted = 0;
    
    const regex = new RegExp(pattern);
    keys.forEach(key => {
        if (regex.test(key)) {
            cache.delete(key);
            deleted++;
        }
    });
    
    console.log(`🗑️  Cleared ${deleted} cache entries matching: ${pattern}`);
    return deleted;
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
    cache.clear();
    console.log('🗑️  Cleared all API response cache');
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
    return cache.getStats();
};

/**
 * Middleware to clear cache on data mutations
 * Use after POST, PUT, DELETE operations
 */
const clearCacheOnMutation = (patterns) => {
    return (req, res, next) => {
        // Store original methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        const clearAfterSend = () => {
            // Clear cache if operation was successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                if (Array.isArray(patterns)) {
                    patterns.forEach(pattern => clearCachePattern(pattern));
                } else if (typeof patterns === 'string') {
                    clearCachePattern(patterns);
                }
            }
        };

        res.json = (body) => {
            clearAfterSend();
            return originalJson(body);
        };

        res.send = (body) => {
            clearAfterSend();
            return originalSend(body);
        };

        next();
    };
};

module.exports = {
    apiResponseCache,
    clearCachePattern,
    clearAllCache,
    getCacheStats,
    clearCacheOnMutation
};
