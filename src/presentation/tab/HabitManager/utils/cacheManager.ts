export interface CachedData<T> {
    data: T;
    timestamp: number;
    ttl: number;
    version?: string; // For cache invalidation on app updates
}

export class CacheManager {
    private static instance: CacheManager;
    private readonly APP_VERSION = '1.0.0'; // Update this when breaking changes occur

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    // Set cache with TTL and versioning
    async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
        const cacheData: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            version: this.APP_VERSION
        };

        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: cacheData }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    // Get cache with automatic expiration and version checking
    async getCache<T>(key: string): Promise<T | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    console.warn('Cache read error:', chrome.runtime.lastError);
                    resolve(null);
                    return;
                }

                const cached = result[key] as CachedData<T> | undefined;

                if (!cached) {
                    resolve(null);
                    return;
                }

                // Check version compatibility
                if (cached.version && cached.version !== this.APP_VERSION) {
                    console.log(`Cache version mismatch for ${key}, clearing...`);
                    this.removeCache(key);
                    resolve(null);
                    return;
                }

                // Check expiration
                const isExpired = Date.now() - cached.timestamp > cached.ttl;
                if (isExpired) {
                    console.log(`Cache expired for ${key}, clearing...`);
                    this.removeCache(key);
                    resolve(null);
                    return;
                }

                resolve(cached.data);
            });
        });
    }

    // Remove specific cache entry
    async removeCache(key: string): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], () => resolve());
        });
    }

    // Clear all cache entries
    async clearAllCache(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => resolve());
        });
    }

    // Get cache statistics
    async getCacheStats(): Promise<{
        totalItems: number;
        totalSize: number; // Approximate size in bytes
        items: Array<{ key: string; timestamp: number; ttl: number; expired: boolean }>;
    }> {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                const items: Array<{ key: string; timestamp: number; ttl: number; expired: boolean }> = [];
                let totalSize = 0;

                Object.entries(result).forEach(([key, value]) => {
                    if (typeof value === 'object' && value && 'timestamp' in value && 'ttl' in value) {
                        const cached = value as CachedData<any>;
                        const isExpired = Date.now() - cached.timestamp > cached.ttl;

                        items.push({
                            key,
                            timestamp: cached.timestamp,
                            ttl: cached.ttl,
                            expired: isExpired
                        });

                        // Rough size estimation
                        totalSize += JSON.stringify(value).length * 2; // UTF-16 encoding
                    }
                });

                resolve({
                    totalItems: items.length,
                    totalSize,
                    items
                });
            });
        });
    }

    // Clean expired cache entries
    async cleanExpiredCache(): Promise<number> {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                const keysToRemove: string[] = [];

                Object.entries(result).forEach(([key, value]) => {
                    if (typeof value === 'object' && value && 'timestamp' in value && 'ttl' in value) {
                        const cached = value as CachedData<any>;
                        const isExpired = Date.now() - cached.timestamp > cached.ttl;
                        const isVersionMismatch = cached.version && cached.version !== this.APP_VERSION;

                        if (isExpired || isVersionMismatch) {
                            keysToRemove.push(key);
                        }
                    }
                });

                if (keysToRemove.length > 0) {
                    chrome.storage.local.remove(keysToRemove, () => {
                        console.log(`Cleaned ${keysToRemove.length} expired cache entries`);
                        resolve(keysToRemove.length);
                    });
                } else {
                    resolve(0);
                }
            });
        });
    }

    // Preload critical data
    async preloadCache(keys: string[]): Promise<{ [key: string]: any }> {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
                const preloadedData: { [key: string]: any } = {};

                keys.forEach(key => {
                    const cached = result[key] as CachedData<any> | undefined;

                    if (cached &&
                        (!cached.version || cached.version === this.APP_VERSION) &&
                        (Date.now() - cached.timestamp <= cached.ttl)) {
                        preloadedData[key] = cached.data;
                    }
                });

                resolve(preloadedData);
            });
        });
    }
}

// Cache keys enum for consistency
export const CACHE_KEYS = {
    // Habit data
    HABITS: 'habits_cache',
    HABITS_METADATA: 'habits_metadata_cache',

    // Authentication & permissions
    PERMISSIONS: 'permissions_cache',
    AUTH_VERIFIED: 'auth_verified_timestamp',
    USER_PROFILE: 'user_profile_cache',

    // Drive integration
    SHEET_ID: 'current_sheet_id',
    FOLDER_STRUCTURE: 'folder_structure_cache',

    // Sync management
    LAST_SYNC: 'last_sync_timestamp',
    SYNC_QUEUE: 'sync_queue_cache',

    // Performance data
    LOAD_TIMES: 'load_times_cache',
    ERROR_LOG: 'error_log_cache'
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    HABITS: 5 * 60 * 1000,          // 5 minutes
    PERMISSIONS: 15 * 60 * 1000,     // 15 minutes
    AUTH: 30 * 60 * 1000,            // 30 minutes
    FOLDER_STRUCTURE: 60 * 60 * 1000, // 1 hour
    USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
    ERROR_LOG: 7 * 24 * 60 * 60 * 1000 // 7 days
} as const;

// Utility functions for common cache operations
export const CacheUtils = {
    // Quick check if cached data exists and is valid
    async isValidCache(key: string): Promise<boolean> {
        const cacheManager = CacheManager.getInstance();
        const data = await cacheManager.getCache(key);
        return data !== null;
    },

    // Get multiple cache entries at once
    async getMultipleCache(keys: string[]): Promise<{ [key: string]: any }> {
        const cacheManager = CacheManager.getInstance();
        const results: { [key: string]: any } = {};

        await Promise.all(
            keys.map(async (key) => {
                const data = await cacheManager.getCache(key);
                if (data !== null) {
                    results[key] = data;
                }
            })
        );

        return results;
    },

    // Set multiple cache entries at once
    async setMultipleCache(entries: Array<{ key: string; data: any; ttl: number }>): Promise<void> {
        const cacheManager = CacheManager.getInstance();

        await Promise.all(
            entries.map(({ key, data, ttl }) =>
                cacheManager.setCache(key, data, ttl)
            )
        );
    },

    // Get cache with fallback function
    async getCacheWithFallback<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        const cacheManager = CacheManager.getInstance();

        // Try cache first
        let data = await cacheManager.getCache<T>(key);

        if (data === null) {
            // Cache miss, execute fallback
            console.log(`Cache miss for ${key}, executing fallback...`);
            data = await fallbackFn();

            // Cache the result
            await cacheManager.setCache(key, data, ttl);
        } else {
            console.log(`Cache hit for ${key}`);
        }

        return data;
    }
};

export default CacheManager;