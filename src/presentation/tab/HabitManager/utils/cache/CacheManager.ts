
import { CacheConstants, type CacheMetadata } from '../../types/cache';

export class CacheManager {
    private static instance: CacheManager;

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    private constructor() { }

    /**
     * Generate cache key for a habit
     */
    generateHabitKey(habitId: string, month?: number, year?: number): string {
        const currentDate = new Date();
        const targetMonth = month ?? currentDate.getMonth() + 1;
        const targetYear = year ?? currentDate.getFullYear();

        return `${CacheConstants.HABIT_KEY_PREFIX}${targetMonth.toString().padStart(2, '0')}_${targetYear}_${habitId}`;
    }

    /**
     * Parse habit key to extract metadata
     */
    parseHabitKey(key: string): { habitId: string; month: number; year: number } | null {
        const pattern = /^habit_(\d{2})_(\d{4})_(.+)$/;
        const match = key.match(pattern);

        if (!match) return null;

        return {
            month: parseInt(match[1]),
            year: parseInt(match[2]),
            habitId: match[3]
        };
    }

    /**
     * Set cache with TTL
     */
    async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
        const now = Date.now();
        const cacheData = {
            data,
            metadata: {
                createdAt: now,
                expiresAt: now + ttl,
                version: CacheConstants.CACHE_VERSION
            }
        };

        try {
            await chrome.storage.local.set({ [key]: cacheData });
        } catch (error) {
            console.error(`Failed to set cache for key ${key}:`, error);
            throw new Error(`Cache set failed: ${error}`);
        }
    }

    /**
     * Get cache data
     */
    async getCache<T>(key: string): Promise<T | null> {
        try {
            const result = await chrome.storage.local.get([key]);
            const cacheData = result[key];

            if (!cacheData || !cacheData.metadata) return null;

            // Check if expired
            if (Date.now() >= cacheData.metadata.expiresAt) {
                await this.removeCache(key);
                return null;
            }

            return cacheData.data as T;
        } catch (error) {
            console.error(`Failed to get cache for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove cache entry
     */
    async removeCache(key: string): Promise<void> {
        try {
            await chrome.storage.local.remove([key]);
        } catch (error) {
            console.error(`Failed to remove cache for key ${key}:`, error);
        }
    }

    /**
     * Clear all cache
     */
    async clearAllCache(): Promise<void> {
        try {
            await chrome.storage.local.clear();
        } catch (error) {
            console.error('Failed to clear all cache:', error);
        }
    }

    /**
     * Check if cache entry is expired
     */
    isExpired(metadata: CacheMetadata): boolean {
        return Date.now() >= metadata.expiresAt;
    }

    /**
     * Update cache metadata tracking
     */
    private async updateCacheMetadata(key: string, metadata: CacheMetadata): Promise<void> {
        try {
            const result = await chrome.storage.local.get([CacheConstants.METADATA_KEY]);
            const existingMetadata = result[CacheConstants.METADATA_KEY] || {};

            existingMetadata[key] = metadata;
            await chrome.storage.local.set({ [CacheConstants.METADATA_KEY]: existingMetadata });
        } catch (error) {
            console.warn('Failed to update cache metadata:', error);
        }
    }

    /**
     * Remove cache metadata tracking
     */
    private async removeCacheMetadata(key: string): Promise<void> {
        try {
            const result = await chrome.storage.local.get([CacheConstants.METADATA_KEY]);
            const existingMetadata = result[CacheConstants.METADATA_KEY] || {};

            delete existingMetadata[key];
            await chrome.storage.local.set({ [CacheConstants.METADATA_KEY]: existingMetadata });
        } catch (error) {
            console.warn('Failed to remove cache metadata:', error);
        }
    }
}