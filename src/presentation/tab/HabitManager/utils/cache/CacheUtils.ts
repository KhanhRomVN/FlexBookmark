import { CacheManager } from './CacheManager';

export class CacheUtils {
    private static cacheManager = CacheManager.getInstance();

    static async getCacheWithFallback<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        let data = await this.cacheManager.getCache<T>(key);

        if (data === null) {
            console.log(`Cache miss for ${key}, executing fallback...`);
            data = await fallbackFn();
            await this.cacheManager.setCache(key, data, ttl);
        } else {
            console.log(`Cache hit for ${key}`);
        }

        return data;
    }

    static async setMultipleCache(entries: Array<{
        key: string;
        data: any;
        ttl: number;
    }>): Promise<void> {
        await Promise.all(
            entries.map(({ key, data, ttl }) =>
                this.cacheManager.setCache(key, data, ttl)
            )
        );
    }

    static async getMultipleCache(keys: string[]): Promise<{ [key: string]: any }> {
        const results: { [key: string]: any } = {};

        await Promise.all(
            keys.map(async (key) => {
                const data = await this.cacheManager.getCache(key);
                if (data !== null) {
                    results[key] = data;
                }
            })
        );

        return results;
    }
}