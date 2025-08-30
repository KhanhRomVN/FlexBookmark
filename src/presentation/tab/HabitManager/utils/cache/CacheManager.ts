export interface CachedData<T> {
    data: T;
    timestamp: number;
    ttl: number;
    version?: string;
}

export class CacheManager {
    private static instance: CacheManager;
    private readonly APP_VERSION = '1.0.0';

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

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

                if (this.isExpired(cached) || this.isVersionMismatch(cached)) {
                    this.removeCache(key);
                    resolve(null);
                    return;
                }

                resolve(cached.data);
            });
        });
    }

    async removeCache(key: string): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], () => resolve());
        });
    }

    async clearAllCache(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => resolve());
        });
    }

    private isExpired<T>(cached: CachedData<T>): boolean {
        return Date.now() - cached.timestamp > cached.ttl;
    }

    private isVersionMismatch<T>(cached: CachedData<T>): boolean {
        return cached.version !== this.APP_VERSION;
    }
}