// ============================================
// Key Cache Module
// Caches derived keys to improve performance
// ============================================

class KeyCache {
    constructor(defaultTTL = 300000) { // 5 minutos padrão
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        this.cleanupInterval = null;
        this.startCleanup();
    }

    /**
     * Generate cache key from parameters
     * @param {string} password - Password or identifier
     * @param {Uint8Array|string} salt - Salt value
     * @returns {string} Cache key
     */
    generateCacheKey(password, salt) {
        const saltStr = salt instanceof Uint8Array
            ? Array.from(salt).join(',')
            : salt;

        // Use hash of password + salt as key (don't store password directly)
        return `${this.simpleHash(password)}_${this.simpleHash(saltStr)}`;
    }

    /**
     * Simple hash function for cache keys
     * @param {string} str - String to hash
     * @returns {string} Hash
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Set a key in cache
     * @param {string} cacheKey - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(cacheKey, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;

        this.cache.set(cacheKey, {
            value,
            expiresAt,
            createdAt: Date.now(),
            hits: 0
        });
    }

    /**
     * Get a key from cache
     * @param {string} cacheKey - Cache key
     * @returns {any|null} Cached value or null if expired/not found
     */
    get(cacheKey) {
        const item = this.cache.get(cacheKey);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiresAt) {
            this.cache.delete(cacheKey);
            return null;
        }

        // Increment hit counter
        item.hits++;

        return item.value;
    }

    /**
     * Check if key exists and is valid
     * @param {string} cacheKey - Cache key
     * @returns {boolean} True if exists and valid
     */
    has(cacheKey) {
        return this.get(cacheKey) !== null;
    }

    /**
     * Delete a specific key
     * @param {string} cacheKey - Cache key
     */
    delete(cacheKey) {
        this.cache.delete(cacheKey);
    }

    /**
     * Clear all cached keys
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        let totalHits = 0;
        let validEntries = 0;
        const now = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (now <= item.expiresAt) {
                validEntries++;
                totalHits += item.hits;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries: this.cache.size - validEntries,
            totalHits,
            averageHits: validEntries > 0 ? (totalHits / validEntries).toFixed(2) : 0
        };
    }

    /**
     * Remove expired entries
     * @returns {number} Number of entries removed
     */
    cleanup() {
        const now = Date.now();
        let removed = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`🧹 Key cache cleanup: removed ${removed} expired entries`);
        }

        return removed;
    }

    /**
     * Start automatic cleanup
     */
    startCleanup() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    /**
     * Stop automatic cleanup
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get time until expiration for a key
     * @param {string} cacheKey - Cache key
     * @returns {number|null} Milliseconds until expiration or null
     */
    getTimeToExpire(cacheKey) {
        const item = this.cache.get(cacheKey);
        if (!item) return null;

        const remaining = item.expiresAt - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Extend TTL for a key
     * @param {string} cacheKey - Cache key
     * @param {number} additionalTime - Additional time in milliseconds
     * @returns {boolean} Success
     */
    extend(cacheKey, additionalTime) {
        const item = this.cache.get(cacheKey);
        if (!item) return false;

        item.expiresAt += additionalTime;
        return true;
    }
}

/**
 * Cached Key Derivation
 * Wrapper around e2eeCrypto with caching
 */
class CachedCrypto {
    constructor() {
        this.keyCache = new KeyCache(300000); // 5 minutos
    }

    /**
     * Derive key from password with caching
     * @param {string} password - Password
     * @param {Uint8Array} salt - Salt
     * @returns {Promise<CryptoKey>} Derived key
     */
    async deriveKeyFromPassword(password, salt) {
        const cacheKey = this.keyCache.generateCacheKey(password, salt);

        // Check cache first
        const cached = this.keyCache.get(cacheKey);
        if (cached) {
            console.log('✅ Key retrieved from cache');
            return cached;
        }

        // Derive key (expensive operation)
        console.log('🔄 Deriving key (not in cache)...');
        const key = await e2eeCrypto.deriveKeyFromPassword(password, salt);

        // Cache the result
        this.keyCache.set(cacheKey, key);

        return key;
    }

    /**
     * Clear key cache (e.g., on logout)
     */
    clearCache() {
        this.keyCache.clear();
        console.log('🧹 Key cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.keyCache.getStats();
    }
}

// Export singleton instance
const cachedCrypto = new CachedCrypto();
