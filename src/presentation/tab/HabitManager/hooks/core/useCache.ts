import { useCallback, useMemo } from 'react';
import { CacheManager } from '../../utils/cache/CacheManager';
import { CacheUtils } from '../../utils/cache/CacheUtils';

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
        return CacheUtils.getCacheWithFallback(key, fallbackFn, ttl);
    }, []);

    const clearCache = useCallback(async (): Promise<void> => {
        return cacheManager.clearAllCache();
    }, [cacheManager]);

    return useMemo(() => ({
        setCache,
        getCache,
        getCacheWithFallback,
        clearCache,
        setMultipleCache: CacheUtils.setMultipleCache,
        getMultipleCache: CacheUtils.getMultipleCache
    }), [setCache, getCache, getCacheWithFallback, clearCache]);
};