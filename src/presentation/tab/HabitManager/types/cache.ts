
import type { Habit } from './habit';

export interface CacheMetadata {
    createdAt: number;
    expiresAt: number;
    version: string;
    month: number;
    year: number;
}

export interface CachedHabit extends Habit {
    _cacheMetadata: CacheMetadata;
}

export interface CacheStats {
    totalEntries: number;
    totalSize: number; // Estimated bytes
    expiredEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
}

export class CacheConstants {
    static readonly CACHE_VERSION = '1.0.0';
    static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
    static readonly MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit

    // Cache key patterns
    static readonly HABIT_KEY_PREFIX = 'habit_';
    static readonly METADATA_KEY = 'cache_metadata';
    static readonly SETTINGS_KEY = 'cache_settings';
}