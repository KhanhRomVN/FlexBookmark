/**
 * 🗄️ CACHE MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🗂️ Quản lý cache storage cho HabitManager
 * ├── 🔑 Tạo và parse cache keys với metadata
 * ├── ⏱️ Quản lý TTL (Time-To-Live) và expiration
 * ├── 🧹 Tự động cleanup expired entries
 * ├── 📊 Theo dõi cache metadata và statistics
 * └── 🔧 Xử lý lỗi và retry logic
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Key Generation      → Tạo keys với pattern nhất quán
 * ├── Storage Operations  → Set/get/remove từ chrome.storage
 * ├── TTL Management      → Quản lý expiration và auto-cleanup
 * ├── Metadata Tracking   → Theo dõi cache metadata
 * └── Error Handling      → Xử lý lỗi storage
 * 
 * 🔑 KEY FORMAT:
 * ├── Habit Keys: habit_MM_YYYY_{habitId}
 * ├── Pattern: {prefix}_{month}_{year}_{identifier}
 * └── Metadata Keys: __cache_metadata__
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── generateHabitKey()      → Tạo key cho habit cache
 * ├── parseHabitKey()         → Parse key để extract metadata
 * ├── setCache()              → Lưu data với TTL
 * ├── getCache()              → Lấy data và check expiration
 * ├── removeCache()           → Xóa cache entry
 * ├── clearAllCache()         → Xóa toàn bộ cache
 * ├── isExpired()             → Kiểm tra expiration
 * ├── updateCacheMetadata()   → Cập nhật metadata tracking
 * └── removeCacheMetadata()   → Xóa metadata tracking
 */

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

import { CacheConstants, type CacheMetadata } from '../../types/cache';

// 🏭 MAIN CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class CacheManager {
    // 🔧 SINGLETON PATTERN
    // ────────────────────────────────────────────────────────────────────────────
    private static instance: CacheManager;

    // 📊 CACHE STATISTICS
    // ────────────────────────────────────────────────────────────────────────────
    private cacheHits = 0;
    private cacheMisses = 0;
    private cacheErrors = 0;
    private readonly MAX_RETRIES = 2;

    // 🏗️ SINGLETON CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🏭 Lấy instance duy nhất của CacheManager
     * @returns {CacheManager} Instance singleton
     */
    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * 🔒 Private constructor để enforce singleton
     * @private
     */
    private constructor() { }

    // 🔑 KEY MANAGEMENT METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔑 Tạo cache key cho habit
     * @param habitId - ID của habit
     * @param month - Tháng (1-12), mặc định current month
     * @param year - Năm, mặc định current year
     * @returns {string} Cache key theo format: habit_MM_YYYY_{habitId}
     */
    generateHabitKey(habitId: string, month?: number, year?: number): string {
        const currentDate = new Date();
        const targetMonth = month ?? currentDate.getMonth() + 1;
        const targetYear = year ?? currentDate.getFullYear();

        return `${CacheConstants.HABIT_KEY_PREFIX}${targetMonth.toString().padStart(2, '0')}_${targetYear}_${habitId}`;
    }

    /**
     * 🔍 Parse habit key để extract metadata
     * @param key - Cache key cần parse
     * @returns {Object | null} Object chứa habitId, month, year hoặc null nếu invalid
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

    // 💾 STORAGE OPERATIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 💾 Lưu data vào cache với TTL
     * @param key - Cache key
     * @param data - Data cần cache
     * @param ttl - Time-to-live in milliseconds
     * @returns {Promise<void>}
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

        let retries = 0;
        let lastError: Error | null = null;

        while (retries <= this.MAX_RETRIES) {
            try {
                await chrome.storage.local.set({ [key]: cacheData });

                // 📊 Update metadata tracking
                await this.updateCacheMetadata(key, cacheData.metadata);

                this.cacheHits++;
                return;
            } catch (error) {
                lastError = error as Error;
                this.cacheErrors++;
                retries++;

                if (retries <= this.MAX_RETRIES) {
                    console.warn(`⚠️ Retry ${retries}/${this.MAX_RETRIES} for setCache key ${key}`);
                    await this.delay(200 * retries); // Exponential backoff
                }
            }
        }

        console.error(`❌ Failed to set cache for key ${key} after ${this.MAX_RETRIES} retries:`, lastError);
        throw new Error(`Cache set failed: ${lastError?.message}`);
    }

    /**
     * 📤 Lấy data từ cache và check expiration
     * @param key - Cache key
     * @returns {Promise<T | null>} Cached data hoặc null nếu không tồn tại/expired
     */
    async getCache<T>(key: string): Promise<T | null> {
        try {
            const result = await chrome.storage.local.get([key]);
            const cacheData = result[key];

            if (!cacheData || !cacheData.metadata) {
                this.cacheMisses++;
                return null;
            }

            // ⏰ Check if expired
            if (Date.now() >= cacheData.metadata.expiresAt) {
                await this.removeCache(key);
                this.cacheMisses++;
                return null;
            }

            this.cacheHits++;
            return cacheData.data as T;
        } catch (error) {
            this.cacheErrors++;
            console.error(`❌ Failed to get cache for key ${key}:`, error);
            return null;
        }
    }

    /**
     * 🗑️ Xóa cache entry
     * @param key - Cache key cần xóa
     * @returns {Promise<void>}
     */
    async removeCache(key: string): Promise<void> {
        try {
            await chrome.storage.local.remove([key]);
            await this.removeCacheMetadata(key);
        } catch (error) {
            this.cacheErrors++;
            console.error(`❌ Failed to remove cache for key ${key}:`, error);
        }
    }

    /**
     * 🧹 Xóa toàn bộ cache
     * @returns {Promise<void>}
     */
    async clearAllCache(): Promise<void> {
        try {
            await chrome.storage.local.clear();
            this.cacheHits = 0;
            this.cacheMisses = 0;
            this.cacheErrors = 0;
        } catch (error) {
            this.cacheErrors++;
            console.error('❌ Failed to clear all cache:', error);
        }
    }

    // ⏰ EXPIRATION MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * ⏰ Kiểm tra cache metadata có expired không
     * @param metadata - Cache metadata
     * @returns {boolean} True nếu expired
     */
    isExpired(metadata: CacheMetadata): boolean {
        return Date.now() >= metadata.expiresAt;
    }

    // 📊 METADATA TRACKING
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 📊 Cập nhật cache metadata tracking
     * @private
     * @param key - Cache key
     * @param metadata - Cache metadata
     * @returns {Promise<void>}
     */
    private async updateCacheMetadata(key: string, metadata: CacheMetadata): Promise<void> {
        try {
            const result = await chrome.storage.local.get([CacheConstants.METADATA_KEY]);
            const existingMetadata = result[CacheConstants.METADATA_KEY] || {};

            existingMetadata[key] = metadata;
            await chrome.storage.local.set({ [CacheConstants.METADATA_KEY]: existingMetadata });
        } catch (error) {
            console.warn('⚠️ Failed to update cache metadata:', error);
        }
    }

    /**
     * 🗑️ Xóa cache metadata tracking
     * @private
     * @param key - Cache key
     * @returns {Promise<void>}
     */
    private async removeCacheMetadata(key: string): Promise<void> {
        try {
            const result = await chrome.storage.local.get([CacheConstants.METADATA_KEY]);
            const existingMetadata = result[CacheConstants.METADATA_KEY] || {};

            delete existingMetadata[key];
            await chrome.storage.local.set({ [CacheConstants.METADATA_KEY]: existingMetadata });
        } catch (error) {
            console.warn('⚠️ Failed to remove cache metadata:', error);
        }
    }

    // 🔧 UTILITY METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * ⏳ Delay helper cho retry logic
     * @private
     * @param ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 📊 Lấy cache statistics
     * @returns {Object} Cache statistics
     */
    getStats(): { hits: number; misses: number; errors: number; hitRate: number } {
        const total = this.cacheHits + this.cacheMisses;
        const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            errors: this.cacheErrors,
            hitRate: parseFloat(hitRate.toFixed(2))
        };
    }

    /**
     * 🔄 Reset cache statistics
     */
    resetStats(): void {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.cacheErrors = 0;
    }
}