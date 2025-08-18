const CACHE_TTL = 5 * 60 * 1000;

export class AdvancedCache<T> {
    has(_cacheKey: string) {
        throw new Error("Method not implemented.");
    }
    private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

    set(key: string, data: T, ttl: number = CACHE_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }
}
