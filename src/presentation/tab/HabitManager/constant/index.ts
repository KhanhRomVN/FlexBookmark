/**
 * 🎯 APPLICATION CONSTANTS - MAIN EXPORT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 📦 Central export for all application constants
 * ├── 🎯 Re-export từ các module constants khác
 * ├── 🔧 Type exports và utility types
 * └── 🛠️ Common constant utilities
 */

// Re-export từ các module constants
export * from './auth.constants';
export * from './habit.constants';
export * from './app.constants';

// ========== COMMON UTILITY CONSTANTS ==========

/**
 * 📅 Date và time constants
 */
export const DATE_CONSTANTS = {
    MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
    MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
    MILLISECONDS_PER_MINUTE: 60 * 1000,
    DAYS_PER_WEEK: 7,
    DAYS_PER_MONTH: 30, // Approximation
    MONTHS_PER_YEAR: 12
} as const;

/**
 * 🔢 Number formatting constants
 */
export const NUMBER_FORMAT = {
    DECIMAL_SEPARATOR: '.',
    THOUSANDS_SEPARATOR: ',',
    CURRENCY_SYMBOL: '$',
    PERCENTAGE_SYMBOL: '%'
} as const;

/**
 * 🌐 Browser và environment constants
 */
export const ENVIRONMENT = {
    IS_BROWSER: typeof window !== 'undefined',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_TEST: process.env.NODE_ENV === 'test',
    SUPPORTS_LOCAL_STORAGE: typeof localStorage !== 'undefined',
    SUPPORTS_SESSION_STORAGE: typeof sessionStorage !== 'undefined',
    SUPPORTS_INDEXED_DB: typeof indexedDB !== 'undefined'
} as const;

/**
 * 🎯 Common status constants
 */
export const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];

/**
 * 📊 Common filter và sort options
 */
export const FILTER_OPTIONS = {
    ALL: 'all',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    TODAY: 'today',
    THIS_WEEK: 'this_week',
    THIS_MONTH: 'this_month'
} as const;

export const SORT_OPTIONS = {
    NAME: 'name',
    DATE: 'date',
    PRIORITY: 'priority',
    STATUS: 'status',
    CATEGORY: 'category'
} as const;

export const SORT_DIRECTION = {
    ASC: 'asc',
    DESC: 'desc'
} as const;

// ========== TYPE GUARDS ==========

/**
 * 🔍 Type guard để kiểm tra giá trị có trong object values không
 */
export function isValueInObject<T extends object>(value: any, obj: T): value is T[keyof T] {
    return Object.values(obj).includes(value);
}

/**
 * 🔍 Type guard để kiểm tra key có trong object keys không
 */
export function isKeyInObject<T extends object>(key: any, obj: T): key is keyof T {
    return Object.keys(obj).includes(key);
}

// ========== UTILITY FUNCTIONS ==========

/**
 * 📋 Lấy tất cả values từ constant object
 */
export function getConstantValues<T extends object>(obj: T): Array<T[keyof T]> {
    return Object.values(obj);
}

/**
 * 📋 Lấy tất cả keys từ constant object
 */
export function getConstantKeys<T extends object>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

/**
 * 🔄 Convert constant object thành options array cho select components
 */
export function constantToOptions<T extends object>(
    obj: T,
    labelMapper: (key: keyof T, value: T[keyof T]) => string = (_, value) => String(value)
): Array<{ value: T[keyof T]; label: string }> {
    return Object.entries(obj).map(([key, value]) => ({
        value: value as T[keyof T],
        label: labelMapper(key as keyof T, value as T[keyof T])
    }));
}

// ========== DEFAULT EXPORT ==========

/**
 * 📦 Default export với tất cả constants
 */
const CONSTANTS = {
    // Auth constants
    ...require('./auth.constants'),
    // Habit constants
    ...require('./habit.constants'),
    // App constants
    ...require('./app.constants'),
    // Common constants
    DATE_CONSTANTS,
    NUMBER_FORMAT,
    ENVIRONMENT,
    STATUS,
    FILTER_OPTIONS,
    SORT_OPTIONS,
    SORT_DIRECTION
};

export default CONSTANTS;