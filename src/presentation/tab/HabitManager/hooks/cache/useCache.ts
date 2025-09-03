// src/presentation/tab/HabitManager/hooks/cache/useCache.ts

import { useCallback, useMemo } from 'react';
import { CacheManager } from '../../utils/cache/CacheManager';
import { HabitCacheUtils } from '../../utils/cache/HabitCacheUtils';

export const useCache = () => {
    const cacheManager = CacheManager.getInstance();

    const setCache = useCallback(async <T>(
        key: string,
        data: T,
        ttl: number
    ): Promise<void> => {
        return cacheManager.setCache(key, data, ttl);
    }, [cacheManager]);

    const getCache = useCallback(async <T>(key: string): Promise<T | null> => {
        return cacheManager.getCache<T>(key);
    }, [cacheManager]);

    const getCacheWithFallback = useCallback(async <T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> => {
        return HabitCacheUtils.getCacheWithFallback(key, fallbackFn, ttl);
    }, []);

    const clearCache = useCallback(async (): Promise<void> => {
        return cacheManager.clearAllCache();
    }, [cacheManager]);

    return useMemo(() => ({
        setCache,
        getCache,
        getCacheWithFallback,
        clearCache,
        setMultipleCache: HabitCacheUtils.setMultipleCache,
        getMultipleCache: HabitCacheUtils.getMultipleCache
    }), [setCache, getCache, getCacheWithFallback, clearCache]);
};