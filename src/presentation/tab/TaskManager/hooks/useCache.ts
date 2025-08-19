const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export class AdvancedCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private maxSize = 100;

    set(key: string, data: T, ttl: number = CACHE_TTL): void {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Move to end for LRU
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
}