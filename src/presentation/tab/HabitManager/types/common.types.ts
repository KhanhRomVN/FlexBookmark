/**
 * 🎯 COMMON TYPES & UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🔧 Shared types và utilities dùng across multiple modules
 * ├── 🏗️ Base interfaces và type guards
 * ├── 🎯 Common enums và constants
 * └── 🛠️ Utility types và helpers
 */

// ========== BASE TYPES ==========

/**
 * 📊 Basic operation result
 */
export interface CommonOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    timestamp: number;
}

/**
 * 📈 Pagination parameters
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * 📊 Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// ========== ENUMS ==========

/**
 * 🎯 Habit type
 */
export enum HabitType {
    GOOD = 'good',
    BAD = 'bad'
}

/**
 * ⚡ Difficulty level
 */
export enum DifficultyLevel {
    VERY_EASY = 1,
    EASY = 2,
    MEDIUM = 3,
    HARD = 4,
    VERY_HARD = 5
}

/**
 * 📂 Habit category
 */
export enum HabitCategory {
    HEALTH = 'health',
    FITNESS = 'fitness',
    PRODUCTIVITY = 'productivity',
    MINDFULNESS = 'mindfulness',
    LEARNING = 'learning',
    SOCIAL = 'social',
    FINANCE = 'finance',
    CREATIVITY = 'creativity',
    OTHER = 'other'
}

/**
 * 🔄 Common sync status
 */
export enum CommonSyncStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CONFLICT = 'conflict'
}

/**
 * 📊 Validation status
 */
export enum ValidationStatus {
    VALID = 'valid',
    INVALID = 'invalid',
    EXPIRED = 'expired',
    PENDING = 'pending'
}

// ========== UTILITY TYPES ==========

/**
 * 🔄 Make certain properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 🔄 Make certain properties required
 */
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
    [P in K]-?: T[P];
};

/**
 * 🔄 Make certain properties nullable
 */
export type Nullable<T, K extends keyof T> = Omit<T, K> & {
    [P in K]: T[P] | null;
};

/**
 * 🎯 API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    metadata?: {
        timestamp: number;
        version: string;
        requestId: string;
    };
}

/**
 * 🐛 API error structure
 */
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    stack?: string;
}

// ========== TYPE GUARDS ==========

/**
 * ✅ Check if value is CommonOperationResult
 */
export const isCommonOperationResult = (value: any): value is CommonOperationResult => {
    return value && typeof value === 'object' &&
        'success' in value &&
        'timestamp' in value;
};

/**
 * ✅ Check if value is ApiResponse
 */
export const isApiResponse = (value: any): value is ApiResponse => {
    return value && typeof value === 'object' &&
        'success' in value &&
        value.metadata &&
        typeof value.metadata.timestamp === 'number';
};

/**
 * ✅ Check if value is ApiError
 */
export const isApiError = (value: any): value is ApiError => {
    return value && typeof value === 'object' &&
        'code' in value &&
        'message' in value;
};

// ========== EVENT TYPES ==========

/**
 * 📡 Base event structure
 */
export interface BaseEvent {
    type: string;
    timestamp: number;
    source: string;
    correlationId?: string;
}

/**
 * 🔄 Sync event
 */
export interface CommonSyncEvent extends BaseEvent {
    type: 'sync_started' | 'sync_completed' | 'sync_failed';
    status: CommonSyncStatus;
    itemsCount?: number;
    error?: ApiError;
}

/**
 * 🔐 Auth event
 */
export interface CommonAuthEvent extends BaseEvent {
    type: 'auth_state_changed' | 'token_refreshed' | 'permissions_updated';
    userId?: string;
    scopes?: string[];
}

/**
 * 📊 Analytics event
 */
export interface AnalyticsEvent extends BaseEvent {
    type: 'habit_created' | 'habit_updated' | 'habit_deleted' | 'habit_tracked';
    habitId?: string;
    category?: HabitCategory;
    metadata?: Record<string, any>;
}

// ========== CONFIGURATION TYPES ==========

/**
 * ⚙️ App configuration
 */
export interface AppConfig {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: {
        offlineMode: boolean;
        analytics: boolean;
        crashReporting: boolean;
        automaticBackups: boolean;
    };
    limits: {
        maxHabits: number;
        maxDailyTracking: number;
        maxArchiveDays: number;
        cacheSize: number;
    };
}

/**
 * ⚙️ User preferences
 */
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
        dailyReminder: boolean;
        weeklySummary: boolean;
        streakAlerts: boolean;
    };
    privacy: {
        analytics: boolean;
        crashReports: boolean;
        autoBackup: boolean;
    };
    display: {
        showArchived: boolean;
        compactView: boolean;
        colorCoding: boolean;
    };
}