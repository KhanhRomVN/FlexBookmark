import type { Habit } from '../../types/habit';
import { CacheConstants, type CachedHabit, type CacheStats } from '../../types/cache';
import { CacheManager } from './CacheManager';

export class HabitCacheUtils {
    private static cacheManager = CacheManager.getInstance();

    /**
     * Store habit in cache with metadata
     */
    static async storeHabit(habit: Habit, ttl: number = CacheConstants.DEFAULT_TTL): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habit.id);
        const now = Date.now();
        const currentDate = new Date();

        const cachedHabit: CachedHabit = {
            ...habit,
            _cacheMetadata: {
                createdAt: now,
                expiresAt: now + ttl,
                version: CacheConstants.CACHE_VERSION,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            }
        };

        try {
            await chrome.storage.local.set({ [key]: cachedHabit });
        } catch (error) {
            console.error('Failed to store habit in cache:', error);
            throw new Error(`Failed to cache habit ${habit.id}: ${error}`);
        }
    }

    /**
     * Retrieve habit from cache
     */
    static async getHabit(habitId: string, month?: number, year?: number): Promise<CachedHabit | null> {
        const key = this.cacheManager.generateHabitKey(habitId, month, year);

        try {
            const result = await chrome.storage.local.get([key]);
            const cachedHabit = result[key] as CachedHabit;

            if (!cachedHabit) return null;

            // Check if expired
            if (this.cacheManager.isExpired(cachedHabit._cacheMetadata)) {
                await this.removeHabit(habitId, month, year);
                return null;
            }

            return cachedHabit;
        } catch (error) {
            console.error('Failed to retrieve habit from cache:', error);
            return null;
        }
    }

    /**
     * Store multiple habits in batch
     */
    static async storeHabits(habits: Habit[], ttl: number = CacheConstants.DEFAULT_TTL): Promise<void> {
        const batchData: { [key: string]: CachedHabit } = {};
        const now = Date.now();
        const currentDate = new Date();

        habits.forEach(habit => {
            const key = this.cacheManager.generateHabitKey(habit.id);
            batchData[key] = {
                ...habit,
                _cacheMetadata: {
                    createdAt: now,
                    expiresAt: now + ttl,
                    version: CacheConstants.CACHE_VERSION,
                    month: currentDate.getMonth() + 1,
                    year: currentDate.getFullYear()
                }
            };
        });

        try {
            await chrome.storage.local.set(batchData);
        } catch (error) {
            console.error('Failed to store habits batch:', error);
            throw new Error(`Failed to cache ${habits.length} habits: ${error}`);
        }
    }

    /**
     * Get all habits for a specific month/year
     */
    static async getHabitsForMonth(month?: number, year?: number): Promise<CachedHabit[]> {
        const currentDate = new Date();
        const targetMonth = month ?? currentDate.getMonth() + 1;
        const targetYear = year ?? currentDate.getFullYear();

        try {
            const allData = await chrome.storage.local.get(null);
            const habits: CachedHabit[] = [];
            const expiredKeys: string[] = [];

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                const parsed = this.cacheManager.parseHabitKey(key);
                if (!parsed || parsed.month !== targetMonth || parsed.year !== targetYear) continue;

                const cachedHabit = value as CachedHabit;
                if (!cachedHabit._cacheMetadata) continue;

                if (this.cacheManager.isExpired(cachedHabit._cacheMetadata)) {
                    expiredKeys.push(key);
                    continue;
                }

                habits.push(cachedHabit);
            }

            // Clean up expired entries
            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return habits.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Failed to get habits for month:', error);
            return [];
        }
    }

    /**
     * Get all cached habits
     */
    static async getAllHabits(): Promise<CachedHabit[]> {
        try {
            const allData = await chrome.storage.local.get(null);
            const habits: CachedHabit[] = [];
            const expiredKeys: string[] = [];

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                const cachedHabit = value as CachedHabit;
                if (!cachedHabit._cacheMetadata) continue;

                if (this.cacheManager.isExpired(cachedHabit._cacheMetadata)) {
                    expiredKeys.push(key);
                    continue;
                }

                habits.push(cachedHabit);
            }

            // Clean up expired entries
            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return habits;
        } catch (error) {
            console.error('Failed to get all habits:', error);
            return [];
        }
    }

    /**
     * Remove habit from cache
     */
    static async removeHabit(habitId: string, month?: number, year?: number): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habitId, month, year);
        await this.cacheManager.removeCache(key);
    }

    /**
     * Remove multiple habits
     */
    static async removeHabits(habitIds: string[], month?: number, year?: number): Promise<void> {
        const keys = habitIds.map(id => this.cacheManager.generateHabitKey(id, month, year));

        try {
            await chrome.storage.local.remove(keys);
        } catch (error) {
            console.error('Failed to remove habits from cache:', error);
        }
    }

    /**
     * Clear all habit cache
     */
    static async clearAllHabits(): Promise<void> {
        try {
            const allData = await chrome.storage.local.get(null);
            const habitKeys = Object.keys(allData).filter(key =>
                key.startsWith(CacheConstants.HABIT_KEY_PREFIX)
            );

            if (habitKeys.length > 0) {
                await chrome.storage.local.remove(habitKeys);
            }

            // Clear metadata
            await chrome.storage.local.remove([CacheConstants.METADATA_KEY]);
        } catch (error) {
            console.error('Failed to clear habit cache:', error);
        }
    }

    /**
     * Update habit without changing cache metadata
     */
    static async updateHabit(habit: Habit): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habit.id);

        try {
            // Get existing cache entry
            const result = await chrome.storage.local.get([key]);
            const existing = result[key] as CachedHabit;

            if (!existing || !existing._cacheMetadata) {
                // If no existing entry, store as new
                await this.storeHabit(habit);
                return;
            }

            // Update habit data while preserving metadata
            const updated: CachedHabit = {
                ...habit,
                _cacheMetadata: existing._cacheMetadata
            };

            await chrome.storage.local.set({ [key]: updated });
        } catch (error) {
            console.error('Failed to update habit in cache:', error);
            throw new Error(`Failed to update cached habit ${habit.id}: ${error}`);
        }
    }

    /**
     * Get cache statistics
     */
    static async getCacheStats(): Promise<CacheStats> {
        try {
            const allData = await chrome.storage.local.get(null);
            let totalEntries = 0;
            let expiredEntries = 0;
            let totalSize = 0;
            let oldestEntry: number | null = null;
            let newestEntry: number | null = null;

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                totalEntries++;
                totalSize += JSON.stringify(value).length;

                const cachedHabit = value as CachedHabit;
                if (cachedHabit._cacheMetadata) {
                    const createdAt = cachedHabit._cacheMetadata.createdAt;

                    if (this.cacheManager.isExpired(cachedHabit._cacheMetadata)) {
                        expiredEntries++;
                    }

                    if (oldestEntry === null || createdAt < oldestEntry) {
                        oldestEntry = createdAt;
                    }

                    if (newestEntry === null || createdAt > newestEntry) {
                        newestEntry = createdAt;
                    }
                }
            }

            return {
                totalEntries,
                totalSize,
                expiredEntries,
                oldestEntry,
                newestEntry
            };
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return {
                totalEntries: 0,
                totalSize: 0,
                expiredEntries: 0,
                oldestEntry: null,
                newestEntry: null
            };
        }
    }

    /**
     * Clean up expired entries
     */
    static async cleanupExpired(): Promise<number> {
        try {
            const allData = await chrome.storage.local.get(null);
            const expiredKeys: string[] = [];

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                const cachedHabit = value as CachedHabit;
                if (cachedHabit._cacheMetadata && this.cacheManager.isExpired(cachedHabit._cacheMetadata)) {
                    expiredKeys.push(key);
                }
            }

            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return expiredKeys.length;
        } catch (error) {
            console.error('Failed to cleanup expired cache:', error);
            return 0;
        }
    }

    /**
     * Check if cache size is approaching limit
     */
    static async isCacheFull(): Promise<boolean> {
        const stats = await this.getCacheStats();
        return stats.totalSize >= CacheConstants.MAX_CACHE_SIZE;
    }

    /**
     * Set multiple cache entries
     */
    static async setMultipleCache<T>(entries: Array<{ key: string; data: T; ttl: number }>): Promise<void> {
        const cacheManager = this.cacheManager;

        for (const entry of entries) {
            await cacheManager.setCache(entry.key, entry.data, entry.ttl);
        }
    }

    /**
     * Get multiple cache entries
     */
    static async getMultipleCache<T>(keys: string[]): Promise<Array<T | null>> {
        const cacheManager = this.cacheManager;
        const results: Array<T | null> = [];

        for (const key of keys) {
            const result = await cacheManager.getCache<T>(key);
            results.push(result);
        }

        return results;
    }

    /**
     * Get cached data with fallback function
     */
    static async getCacheWithFallback<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        const cacheManager = this.cacheManager;

        // Try to get from cache first
        const cached = await cacheManager.getCache<T>(key);
        if (cached !== null) {
            return cached;
        }

        // If not in cache, call fallback function
        const data = await fallbackFn();

        // Store the result in cache for next time
        await cacheManager.setCache(key, data, ttl);

        return data;
    }
}

export { CachedHabit, CacheStats };
