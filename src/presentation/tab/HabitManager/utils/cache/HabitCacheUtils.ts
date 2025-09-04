/**
 * 🗂️ HABIT CACHE UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🎯 Habit-specific cache operations
 * ├── 📅 Quản lý cache theo tháng/năm
 * ├── 🔄 Batch operations cho multiple habits
 * ├── 📊 Cache statistics và cleanup
 * ├── 🧪 Fallback mechanisms và error handling
 * └── 🔍 Advanced query và filtering
 */

import type { Habit } from '../../types';
import { CacheConstants, type CachedHabit, type CacheStats } from '../../types';
import { CacheManager } from './CacheManager';

// 🏭 MAIN CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class HabitCacheUtils {
    // 🔧 DEPENDENCY INJECTION
    private static cacheManager = CacheManager.getInstance();

    // 📊 CACHE STATISTICS
    private static cleanupCount = 0;
    private static lastCleanup = 0;
    private static readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // ⏰ 30 phút

    // 🎯 CACHE CONSTANTS
    private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
    private static readonly MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB

    // 🎯 HABIT-SPECIFIC METHODS

    /**
     * 💾 Lưu habit vào cache với metadata
     * @param habit - Habit object cần cache
     * @param ttl - Time-to-live in milliseconds
     * @returns {Promise<void>}
     */
    static async storeHabit(habit: Habit, ttl: number = this.DEFAULT_TTL): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habit.id);
        const now = Date.now();

        const cachedHabit: CachedHabit = {
            ...habit,
            _cache: {
                createdAt: now,
                expiresAt: now + ttl,
                version: CacheConstants.CACHE_VERSION
            }
        };

        try {
            await chrome.storage.local.set({ [key]: cachedHabit });
        } catch (error) {
            console.error('❌ Failed to store habit in cache:', error);
            throw new Error(`Failed to cache habit ${habit.id}: ${error}`);
        }
    }

    /**
     * 📤 Lấy habit từ cache
     * @param habitId - ID của habit cần lấy
     * @param month - Tháng (optional)
     * @param year - Năm (optional)
     * @returns {Promise<CachedHabit | null>} Cached habit hoặc null
     */
    static async getHabit(habitId: string, month?: number, year?: number): Promise<CachedHabit | null> {
        const key = this.cacheManager.generateHabitKey(habitId, month, year);

        try {
            const result = await chrome.storage.local.get([key]);
            const cachedHabit = result[key] as CachedHabit;

            if (!cachedHabit) return null;

            // ⏰ Check if expired
            if (this.cacheManager.isExpired(cachedHabit._cache)) {
                await this.removeHabit(habitId, month, year);
                return null;
            }

            return cachedHabit;
        } catch (error) {
            console.error('❌ Failed to retrieve habit from cache:', error);
            return null;
        }
    }

    /**
     * 📦 Lưu multiple habits trong batch
     * @param habits - Array of habits
     * @param ttl - Time-to-live in milliseconds
     * @returns {Promise<void>}
     */
    static async storeHabits(habits: Habit[], ttl: number = this.DEFAULT_TTL): Promise<void> {
        const batchData: { [key: string]: CachedHabit } = {};
        const now = Date.now();

        habits.forEach(habit => {
            const key = this.cacheManager.generateHabitKey(habit.id);
            batchData[key] = {
                ...habit,
                _cache: {
                    createdAt: now,
                    expiresAt: now + ttl,
                    version: CacheConstants.CACHE_VERSION
                }
            };
        });

        try {
            await chrome.storage.local.set(batchData);
        } catch (error) {
            console.error('❌ Failed to store habits batch:', error);
            throw new Error(`Failed to cache ${habits.length} habits: ${error}`);
        }
    }

    // 📅 TEMPORAL QUERIES

    /**
     * 📅 Lấy tất cả habits cho specific month/year
     * @param month - Tháng (1-12)
     * @param year - Năm
     * @returns {Promise<CachedHabit[]>} Array of cached habits
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
                if (!cachedHabit._cache) continue;

                if (this.cacheManager.isExpired(cachedHabit._cache)) {
                    expiredKeys.push(key);
                    continue;
                }

                habits.push(cachedHabit);
            }

            // 🧹 Clean up expired entries
            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return habits.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('❌ Failed to get habits for month:', error);
            return [];
        }
    }

    /**
     * 🌟 Lấy tất cả cached habits
     * @returns {Promise<CachedHabit[]>} Array of all cached habits
     */
    static async getAllHabits(): Promise<CachedHabit[]> {
        try {
            const allData = await chrome.storage.local.get(null);
            const habits: CachedHabit[] = [];
            const expiredKeys: string[] = [];

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                const cachedHabit = value as CachedHabit;
                if (!cachedHabit._cache) continue;

                if (this.cacheManager.isExpired(cachedHabit._cache)) {
                    expiredKeys.push(key);
                    continue;
                }

                habits.push(cachedHabit);
            }

            // 🧹 Clean up expired entries
            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return habits;
        } catch (error) {
            console.error('❌ Failed to get all habits:', error);
            return [];
        }
    }

    // 🗑️ REMOVAL OPERATIONS

    /**
     * 🗑️ Xóa habit khỏi cache
     * @param habitId - ID của habit cần xóa
     * @param month - Tháng (optional)
     * @param year - Năm (optional)
     * @returns {Promise<void>}
     */
    static async removeHabit(habitId: string, month?: number, year?: number): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habitId, month, year);
        await this.cacheManager.removeCache(key);
    }

    /**
     * 🗑️ Xóa multiple habits
     * @param habitIds - Array of habit IDs
     * @param month - Tháng (optional)
     * @param year - Năm (optional)
     * @returns {Promise<void>}
     */
    static async removeHabits(habitIds: string[], month?: number, year?: number): Promise<void> {
        const keys = habitIds.map(id => this.cacheManager.generateHabitKey(id, month, year));

        try {
            await chrome.storage.local.remove(keys);
        } catch (error) {
            console.error('❌ Failed to remove habits from cache:', error);
        }
    }

    /**
     * 🧹 Xóa toàn bộ habit cache
     * @returns {Promise<void>}
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

            // 🧹 Clear metadata
            await chrome.storage.local.remove([CacheConstants.METADATA_KEY]);
        } catch (error) {
            console.error('❌ Failed to clear habit cache:', error);
        }
    }

    // 🔄 UPDATE OPERATIONS

    /**
     * 🔄 Update habit mà giữ nguyên cache metadata
     * @param habit - Updated habit object
     * @returns {Promise<void>}
     */
    static async updateHabit(habit: Habit): Promise<void> {
        const key = this.cacheManager.generateHabitKey(habit.id);

        try {
            // 📤 Get existing cache entry
            const result = await chrome.storage.local.get([key]);
            const existing = result[key] as CachedHabit;

            if (!existing || !existing._cache) {
                // 💾 Nếu không có entry cũ, store như mới
                await this.storeHabit(habit);
                return;
            }

            // 🔄 Update habit data while preserving metadata
            const updated: CachedHabit = {
                ...habit,
                _cache: existing._cache
            };

            await chrome.storage.local.set({ [key]: updated });
        } catch (error) {
            console.error('❌ Failed to update habit in cache:', error);
            throw new Error(`Failed to update cached habit ${habit.id}: ${error}`);
        }
    }

    // 📊 CACHE MAINTENANCE

    /**
     * 📊 Lấy cache statistics
     * @returns {Promise<Partial<CacheStats>>} Cache statistics object
     */
    static async getCacheStats(): Promise<Partial<CacheStats>> {
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
                if (cachedHabit._cache) {
                    const createdAt = cachedHabit._cache.createdAt;

                    if (this.cacheManager.isExpired(cachedHabit._cache)) {
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
            console.error('❌ Failed to get cache stats:', error);
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
     * 🧹 Clean up expired entries
     * @returns {Promise<number>} Số lượng entries đã xóa
     */
    static async cleanupExpired(): Promise<number> {
        const now = Date.now();

        // ⏰ Rate limiting cho cleanup
        if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
            return 0;
        }

        this.lastCleanup = now;

        try {
            const allData = await chrome.storage.local.get(null);
            const expiredKeys: string[] = [];

            for (const [key, value] of Object.entries(allData)) {
                if (!key.startsWith(CacheConstants.HABIT_KEY_PREFIX)) continue;

                const cachedHabit = value as CachedHabit;
                if (cachedHabit._cache && this.cacheManager.isExpired(cachedHabit._cache)) {
                    expiredKeys.push(key);
                }
            }

            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
                this.cleanupCount += expiredKeys.length;
            }

            console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
            return expiredKeys.length;

        } catch (error) {
            console.error('❌ Failed to cleanup expired cache:', error);
            return 0;
        }
    }

    /**
     * 📏 Kiểm tra cache size có approaching limit không
     * @returns {Promise<boolean>} True nếu cache gần đầy
     */
    static async isCacheFull(): Promise<boolean> {
        const stats = await this.getCacheStats();
        return stats.totalSize !== undefined && stats.totalSize >= this.MAX_CACHE_SIZE;
    }

    // 🔄 ADVANCED CACHE PATTERNS

    /**
     * 📦 Set multiple cache entries
     * @param entries - Array of cache entries
     * @returns {Promise<void>}
     */
    static async setMultipleCache<T>(entries: Array<{ key: string; data: T; ttl: number }>): Promise<void> {
        for (const entry of entries) {
            await this.cacheManager.setCache(entry.key, entry.data, entry.ttl);
        }
    }

    /**
     * 📦 Get multiple cache entries
     * @param keys - Array of cache keys
     * @returns {Promise<Array<T | null>>} Array of cached data
     */
    static async getMultipleCache<T>(keys: string[]): Promise<Array<T | null>> {
        const results: Array<T | null> = [];

        for (const key of keys) {
            const result = await this.cacheManager.getCache<T>(key);
            results.push(result);
        }

        return results;
    }

    /**
     * 🔄 Get cached data với fallback function
     * @param key - Cache key
     * @param fallbackFn - Fallback function nếu cache miss
     * @param ttl - Time-to-live for new cache entries
     * @returns {Promise<T>} Cached data hoặc fallback result
     */
    static async getCacheWithFallback<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        // 📤 Try to get from cache first
        const cached = await this.cacheManager.getCache<T>(key);
        if (cached !== null) {
            return cached;
        }

        // 📞 If not in cache, call fallback function
        const data = await fallbackFn();

        // 💾 Store the result in cache for next time
        await this.cacheManager.setCache(key, data, ttl);

        return data;
    }

    // 🔧 UTILITY METHODS

    /**
     * 📊 Lấy cleanup statistics
     * @returns {Object} Cleanup statistics
     */
    static getCleanupStats(): { totalCleaned: number; lastCleanup: number } {
        return {
            totalCleaned: this.cleanupCount,
            lastCleanup: this.lastCleanup
        };
    }

    /**
     * 🔄 Reset cleanup statistics
     */
    static resetCleanupStats(): void {
        this.cleanupCount = 0;
        this.lastCleanup = 0;
    }

    /**
     * 🧪 Kiểm tra cache health
     * @returns {Promise<boolean>} True nếu cache hoạt động tốt
     */
    static async checkHealth(): Promise<boolean> {
        try {
            // 🧪 Test basic storage operations
            const testKey = 'health_check_' + Date.now();
            const testData = { timestamp: Date.now(), test: true };

            await this.cacheManager.setCache(testKey, testData, 60000);
            const retrieved = await this.cacheManager.getCache<typeof testData>(testKey);
            await this.cacheManager.removeCache(testKey);

            return retrieved !== null && retrieved.timestamp === testData.timestamp;
        } catch (error) {
            console.error('❌ Cache health check failed:', error);
            return false;
        }
    }
}

export { CachedHabit, CacheStats };