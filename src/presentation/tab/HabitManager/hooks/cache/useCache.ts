/**
 * 🗄️ CACHE MANAGEMENT HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 💾 Quản lý cache tổng quát cho ứng dụng
 * ├── 🔄 Cung cấp fallback mechanism cho data fetching
 * ├── 🧹 Hỗ trợ clear cache và quản lý bộ nhớ
 * ├── 📊 Hỗ trợ multi-cache operations
 * └── 🎯 Tích hợp với hệ thống cache manager chung
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Basic Cache Operations     → set, get, clear cache
 * ├── Fallback Mechanism        → get với fallback function
 * ├── Multi-Cache Support      → set/get multiple items
 * └── Cache Management         → clear và quản lý cache
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── setCache()               → Lưu data vào cache với TTL
 * ├── getCache()              → Lấy data từ cache
 * ├── getCacheWithFallback()  → Lấy cache với fallback function
 * ├── clearCache()            → Xóa toàn bộ cache
 * ├── setMultipleCache()      → Lưu nhiều items cùng lúc
 * └── getMultipleCache()      → Lấy nhiều items cùng lúc
 */

import { useCallback, useMemo } from 'react';
import { CacheManager } from '../../utils/cache/CacheManager';
import { HabitCacheUtils } from '../../utils/cache/HabitCacheUtils';

/**
 * 🎯 CUSTOM HOOK: useCache
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📖 MÔ TẢ:
 * Hook cung cấp các hàm quản lý cache tổng quát cho ứng dụng, tích hợp với
 * CacheManager và HabitCacheUtils để đảm bảo tính nhất quán trong cache management.
 * 
 * 🎯 USE CASES:
 * - Cache bất kỳ dữ liệu nào không phải habit-specific
 * - Fallback mechanism cho data fetching
 * - Multi-item cache operations
 * - Cache cleanup và management
 * 
 * 💡 BEST PRACTICES:
 * - Sử dụng cho dữ liệu không thay đổi thường xuyên
 * - Đặt TTL phù hợp với loại dữ liệu
 * - Sử dụng fallback mechanism để đảm bảo data availability
 */
export const useCache = () => {
    // 🏭 SINGLETON CACHE MANAGER INSTANCE
    const cacheManager = CacheManager.getInstance();

    /**
     * 💾 Lưu data vào cache với TTL
     * @param key - Cache key
     * @param data - Data cần cache
     * @param ttl - Time-to-live (milliseconds)
     * @returns Promise<void>
     */
    const setCache = useCallback(async <T>(
        key: string,
        data: T,
        ttl: number
    ): Promise<void> => {
        return cacheManager.setCache(key, data, ttl);
    }, [cacheManager]);

    /**
     * 📤 Lấy data từ cache
     * @param key - Cache key
     * @returns Promise<T | null> Data hoặc null nếu không tồn tại/expired
     */
    const getCache = useCallback(async <T>(key: string): Promise<T | null> => {
        return cacheManager.getCache<T>(key);
    }, [cacheManager]);

    /**
     * 🔄 Lấy cache với fallback function
     * - Thử lấy từ cache trước
     * - Nếu cache miss, gọi fallback function và cache kết quả
     * @param key - Cache key
     * @param fallbackFn - Fallback function để fetch data
     * @param ttl - Time-to-live cho cache mới
     * @returns Promise<T> Data từ cache hoặc fallback
     */
    const getCacheWithFallback = useCallback(async <T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> => {
        return HabitCacheUtils.getCacheWithFallback(key, fallbackFn, ttl);
    }, []);

    /**
     * 🧹 Xóa toàn bộ cache
     * @returns Promise<void>
     */
    const clearCache = useCallback(async (): Promise<void> => {
        return cacheManager.clearAllCache();
    }, [cacheManager]);

    // 🎯 RETURN MEMOIZED HOOK API
    return useMemo(() => ({
        setCache,
        getCache,
        getCacheWithFallback,
        clearCache,
        setMultipleCache: HabitCacheUtils.setMultipleCache,
        getMultipleCache: HabitCacheUtils.getMultipleCache
    }), [setCache, getCache, getCacheWithFallback, clearCache]);
};