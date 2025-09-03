// src/presentation/tab/HabitManager/constant/cache.constants.ts

/**
 * 🗄️ CACHE MANAGEMENT CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🎯 Cache storage keys và configuration
 * ├── ⏰ Time-to-live (TTL) settings
 * ├── 📊 Cache size limits và quotas
 * ├── 🔧 Cache strategy constants
 * └── 🛠️ Utility constants
 */

import type { CacheMetadata, CacheStats } from '../types';

// ========== CACHE STORAGE KEYS ==========

export const CACHE_KEYS = {
    HABITS: {
        PREFIX: 'habit_',
        ALL: 'habits_all',
        BY_MONTH: (month: number, year: number) => `habits_${month}_${year}`,
        BY_ID: (id: string) => `habit_${id}`
    },
    AUTH: {
        TOKEN: 'auth_token',
        USER: 'auth_user',
        STATE: 'auth_state',
        PERMISSIONS: 'auth_permissions'
    },
    UI: {
        PREFERENCES: 'ui_preferences',
        SETTINGS: 'ui_settings',
        LAYOUT: 'ui_layout',
        THEME: 'ui_theme'
    },
    SYSTEM: {
        LAST_SYNC: 'system_last_sync',
        OFFLINE_DATA: 'system_offline_data',
        ERROR_QUEUE: 'system_error_queue'
    }
} as const;

// ========== TIME-TO-LIVE SETTINGS ==========

export const CACHE_TTL = {
    // ⏰ Short-lived cache (minutes)
    SHORT: {
        VALIDATION: 1 * 60 * 1000,     // 1 minute
        SESSION: 5 * 60 * 1000,        // 5 minutes
        UI_STATE: 10 * 60 * 1000,      // 10 minutes
        NETWORK_REQUESTS: 2 * 60 * 1000 // 2 minutes
    },
    // ⏰ Medium-lived cache (hours)
    MEDIUM: {
        HABITS: 2 * 60 * 60 * 1000,    // 2 hours
        USER_DATA: 4 * 60 * 60 * 1000, // 4 hours
        PERMISSIONS: 6 * 60 * 60 * 1000, // 6 hours
        CONFIG: 8 * 60 * 60 * 1000     // 8 hours
    },
    // ⏰ Long-lived cache (days)
    LONG: {
        APP_SETTINGS: 24 * 60 * 60 * 1000,     // 24 hours
        THEME_PREFERENCES: 7 * 24 * 60 * 60 * 1000, // 7 days
        OFFLINE_DATA: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    // ⏰ Very long-lived cache (persistent)
    PERSISTENT: {
        USER_PREFERENCES: 0, // Never expire
        APP_CONFIG: 0,
        LICENSE: 0
    }
} as const;

// ========== CACHE SIZE LIMITS ==========

export const CACHE_LIMITS = {
    // 📊 Storage quotas
    MAX_TOTAL_SIZE: 5 * 1024 * 1024, // 5MB total cache
    MAX_ITEM_SIZE: 100 * 1024,       // 100KB per item
    MAX_ITEMS: 1000,                 // 1000 total items
    // 📊 Per-category limits
    HABITS: {
        MAX_ITEMS: 500,
        MAX_SIZE: 2 * 1024 * 1024,   // 2MB for habits
        MAX_PER_MONTH: 100            // 100 habits per month
    },
    AUTH: {
        MAX_ITEMS: 50,
        MAX_SIZE: 500 * 1024          // 500KB for auth
    },
    UI: {
        MAX_ITEMS: 100,
        MAX_SIZE: 1 * 1024 * 1024     // 1MB for UI
    }
} as const;

// ========== CACHE STRATEGY CONSTANTS ==========

export const CACHE_STRATEGY = {
    // 🎯 Cache control strategies
    NETWORK_FIRST: 'network-first',
    CACHE_FIRST: 'cache-first',
    CACHE_ONLY: 'cache-only',
    NETWORK_ONLY: 'network-only',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    // 🔄 Refresh strategies
    BACKGROUND_SYNC: 'background-sync',
    MANUAL_REFRESH: 'manual-refresh',
    LAZY_LOAD: 'lazy-load',
    // 🗑️ Eviction strategies
    LRU: 'lru', // Least Recently Used
    LFU: 'lfu', // Least Frequently Used
    FIFO: 'fifo' // First In First Out
} as const;

// ========== CACHE ERROR CODES ==========

export const CACHE_ERRORS = {
    QUOTA_EXCEEDED: 'cache_quota_exceeded',
    ITEM_TOO_LARGE: 'cache_item_too_large',
    STORAGE_UNAVAILABLE: 'cache_storage_unavailable',
    ITEM_NOT_FOUND: 'cache_item_not_found',
    INVALID_DATA: 'cache_invalid_data',
    SERIALIZATION_FAILED: 'cache_serialization_failed',
    DESERIALIZATION_FAILED: 'cache_deserialization_failed'
} as const;

export const CACHE_ERROR_MESSAGES = {
    [CACHE_ERRORS.QUOTA_EXCEEDED]: 'Cache storage quota exceeded',
    [CACHE_ERRORS.ITEM_TOO_LARGE]: 'Cache item exceeds size limit',
    [CACHE_ERRORS.STORAGE_UNAVAILABLE]: 'Cache storage is not available',
    [CACHE_ERRORS.ITEM_NOT_FOUND]: 'Cache item not found',
    [CACHE_ERRORS.INVALID_DATA]: 'Invalid cache data format',
    [CACHE_ERRORS.SERIALIZATION_FAILED]: 'Failed to serialize data for caching',
    [CACHE_ERRORS.DESERIALIZATION_FAILED]: 'Failed to deserialize cached data'
} as const;

// ========== CACHE METADATA DEFAULTS ==========

export const DEFAULT_CACHE_METADATA: CacheMetadata = {
    createdAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL.MEDIUM.HABITS,
    version: '1.0.0',
    size: 1
} as const;

export const DEFAULT_CACHE_STATS: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    namespaceStats: {},
    hitRate: 0,
    missRate: 0,
    oldestEntry: null,
    newestEntry: null,
    expiredEntries: 0
} as const;

// ========== CACHE PERFORMANCE SETTINGS ==========

export const CACHE_PERFORMANCE = {
    CLEANUP_INTERVAL: 30 * 60 * 1000, // 30 minutes
    BATCH_SIZE: 50,
    MAX_CLEANUP_TIME: 5000, // 5 seconds max for cleanup
    DEFERRED_WRITE_DELAY: 1000, // 1 second delay for batched writes
    MEMORY_CACHE_SIZE: 100 // Number of items to keep in memory cache
} as const;

// ========== EXPORT TYPES ==========

export type CacheStrategy = typeof CACHE_STRATEGY[keyof typeof CACHE_STRATEGY];
export type CacheError = typeof CACHE_ERRORS[keyof typeof CACHE_ERRORS];
export type TTLCategory = keyof typeof CACHE_TTL;

export default {
    CACHE_KEYS,
    CACHE_TTL,
    CACHE_LIMITS,
    CACHE_STRATEGY,
    CACHE_ERRORS,
    CACHE_ERROR_MESSAGES,
    DEFAULT_CACHE_METADATA,
    DEFAULT_CACHE_STATS,
    CACHE_PERFORMANCE
};