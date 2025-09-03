/**
 * 🗄️ CACHE TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 💾 Cache storage types
 * ├── 📊 Cache metadata types
 * ├── 🎯 Cache operation types
 * ├── 📈 Cache statistics types
 * └── 🔧 Configuration types
 */

import { Habit, HabitWithTracking } from './habit.types';
import { AuthUser, TokenInfo } from './auth.types';

// ========== CACHE METADATA TYPES ==========

/**
 * 📋 Cache metadata
 */
export interface CacheMetadata {
    createdAt: number;
    expiresAt: number;
    version: string;
    size: number;
    checksum?: string;
}

/**
 * 📊 Cache entry
 */
export interface CacheEntry<T = any> {
    data: T;
    metadata: CacheMetadata;
}

// ========== CACHE KEY TYPES ==========

/**
 * 🔑 Cache key patterns
 */
export enum CacheKeyPattern {
    HABIT = 'habit_{id}',
    HABIT_MONTH = 'habit_{id}_{month}_{year}',
    HABITS_LIST = 'habits_{timestamp}',
    USER = 'user_{id}',
    TOKEN = 'token_{userId}',
    SETTINGS = 'settings_{userId}'
}

/**
 * 📂 Cache namespace
 */
export enum CacheNamespace {
    HABITS = 'habits',
    AUTH = 'auth',
    SETTINGS = 'settings',
    TEMP = 'temp'
}

// ========== CACHE DATA TYPES ==========

/**
 * 💾 Cached habit
 */
export type CachedHabit = Habit & {
    _cache: CacheMetadata;
};

/**
 * 💾 Cached habit with tracking
 */
export type CachedHabitWithTracking = HabitWithTracking & {
    _cache: CacheMetadata;
};

/**
 * 💾 Cached user
 */
export type CachedUser = AuthUser & {
    _cache: CacheMetadata;
};

/**
 * 💾 Cached token
 */
export type CachedToken = TokenInfo & {
    _cache: CacheMetadata;
};

// ========== CACHE OPERATION TYPES ==========

/**
 * 📋 Base operation result
 */
export interface CacheOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    timestamp: number;
    fromCache: boolean;
    cacheAge?: number;
    expiresIn?: number;
}

/**
 * 📦 Batch cache operation
 */
export interface BatchCacheOperation {
    key: string;
    operation: 'set' | 'get' | 'delete' | 'update';
    data?: any;
    ttl?: number;
}

/**
 * 📦 Batch cache result
 */
export interface BatchCacheResult {
    successful: number;
    failed: number;
    results: Array<{
        key: string;
        success: boolean;
        error?: string;
    }>;
}

// ========== CACHE STATISTICS TYPES ==========

/**
 * 📊 Cache statistics
 */
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    namespaceStats: {
        [namespace: string]: {
            entries: number;
            size: number;
            hitRate: number;
        };
    };
    hitRate: number;
    missRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
    expiredEntries: number;
}

/**
 * 📊 Cache performance metrics
 */
export interface CacheMetrics {
    averageReadTime: number;
    averageWriteTime: number;
    totalReads: number;
    totalWrites: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
    memoryUsage: number;
}

// ========== CACHE CONFIGURATION TYPES ==========

/**
 * ⚙️ Cache configuration
 */
export interface CacheConfig {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
    persist: boolean;
    compression: boolean;
    encryption: boolean;
    namespaceConfig: {
        [namespace: string]: {
            ttl: number;
            maxSize: number;
            priority: 'low' | 'medium' | 'high';
        };
    };
}

/**
 * ⚙️ Cache cleanup options
 */
export interface CacheCleanupOptions {
    maxAge?: number;
    namespace?: CacheNamespace;
    pattern?: string;
    dryRun?: boolean;
}

// ========== CACHE EVENT TYPES ==========

/**
 * 📡 Cache hit event
 */
export interface CacheHitEvent {
    type: 'cache_hit';
    key: string;
    namespace: CacheNamespace;
    age: number;
    timestamp: number;
}

/**
 * 📡 Cache miss event
 */
export interface CacheMissEvent {
    type: 'cache_miss';
    key: string;
    namespace: CacheNamespace;
    timestamp: number;
}

/**
 * 📡 Cache write event
 */
export interface CacheWriteEvent {
    type: 'cache_write';
    key: string;
    namespace: CacheNamespace;
    size: number;
    timestamp: number;
}

/**
 * 📡 Cache eviction event
 */
export interface CacheEvictionEvent {
    type: 'cache_eviction';
    key: string;
    namespace: CacheNamespace;
    reason: 'size' | 'age' | 'manual';
    timestamp: number;
}

// ========== TYPE GUARDS ==========

/**
 * ✅ Check if value is CacheMetadata
 */
export const isCacheMetadata = (value: any): value is CacheMetadata => {
    return value &&
        typeof value === 'object' &&
        'createdAt' in value &&
        'expiresAt' in value &&
        'version' in value;
};

/**
 * ✅ Check if value is CachedHabit
 */
export const isCachedHabit = (value: any): value is CachedHabit => {
    return value &&
        typeof value === 'object' &&
        'id' in value &&
        '_cache' in value &&
        isCacheMetadata(value._cache);
};

/**
 * ✅ Check if value is CacheStats
 */
export const isCacheStats = (value: any): value is CacheStats => {
    return value &&
        typeof value === 'object' &&
        'totalEntries' in value &&
        'totalSize' in value &&
        'hitRate' in value;
};