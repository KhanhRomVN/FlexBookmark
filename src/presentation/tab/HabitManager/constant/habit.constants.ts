/**
 * 🎯 HABIT TRACKING CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🎯 Habit types, categories, và difficulty levels
 * ├── 📊 Tracking và streak calculation settings
 * ├── 🎨 UI và display constants
 * ├── 📝 Form validation rules
 * └── 🔧 Utility constants
 */

// ========== HABIT TYPES AND CATEGORIES ==========

export const HABIT_TYPES = {
    GOOD: 'good',
    BAD: 'bad'
} as const;

export const DIFFICULTY_LEVELS = {
    VERY_EASY: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    VERY_HARD: 5
} as const;

export const HABIT_CATEGORIES = {
    HEALTH: 'health',
    FITNESS: 'fitness',
    PRODUCTIVITY: 'productivity',
    MINDFULNESS: 'mindfulness',
    LEARNING: 'learning',
    SOCIAL: 'social',
    FINANCE: 'finance',
    CREATIVITY: 'creativity',
    OTHER: 'other'
} as const;

// ========== TRACKING AND STREAK SETTINGS ==========

export const TRACKING_SETTINGS = {
    MAX_DAILY_TRACKING_DAYS: 31,
    DEFAULT_GOOD_HABIT_GOAL: 1,
    DEFAULT_BAD_HABIT_LIMIT: 1,
    MIN_HABIT_NAME_LENGTH: 1,
    MAX_HABIT_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_TAGS_PER_HABIT: 10,
    MAX_SUBTASKS_PER_HABIT: 5
} as const;

export const STREAK_SETTINGS = {
    MIN_CONSECUTIVE_DAYS: 1,
    LONG_STREAK_THRESHOLD: 7,
    VERY_LONG_STREAK_THRESHOLD: 30,
    RESET_STREAK_AFTER_MISS: true
} as const;

// ========== UI AND DISPLAY CONSTANTS ==========

export const UI_CONSTANTS = {
    DEFAULT_COLOR: '#3b82f6',
    COLOR_PALETTE: [
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#10b981', // Green
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#f97316', // Orange
        '#6366f1'  // Indigo
    ],
    DEFAULT_TIME_FORMAT: 'HH:mm',
    DATE_FORMAT: 'YYYY-MM-DD',
    DISPLAY_DATE_FORMAT: 'MMM D, YYYY',
    SHORT_DATE_FORMAT: 'MMM D'
} as const;

export const HABIT_CATEGORY_ICONS = {
    [HABIT_CATEGORIES.HEALTH]: '❤️',
    [HABIT_CATEGORIES.FITNESS]: '💪',
    [HABIT_CATEGORIES.PRODUCTIVITY]: '📊',
    [HABIT_CATEGORIES.MINDFULNESS]: '🧘',
    [HABIT_CATEGORIES.LEARNING]: '📚',
    [HABIT_CATEGORIES.SOCIAL]: '👥',
    [HABIT_CATEGORIES.FINANCE]: '💰',
    [HABIT_CATEGORIES.CREATIVITY]: '🎨',
    [HABIT_CATEGORIES.OTHER]: '📝'
} as const;

export const HABIT_TYPE_ICONS = {
    [HABIT_TYPES.GOOD]: '✅',
    [HABIT_TYPES.BAD]: '❌'
} as const;

// ========== FORM VALIDATION RULES ==========

export const VALIDATION_RULES = {
    HABIT_NAME: {
        REQUIRED: true,
        MIN_LENGTH: TRACKING_SETTINGS.MIN_HABIT_NAME_LENGTH,
        MAX_LENGTH: TRACKING_SETTINGS.MAX_HABIT_NAME_LENGTH,
        PATTERN: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        PATTERN_MESSAGE: 'Name can only contain letters, numbers, spaces, and basic punctuation'
    },
    DESCRIPTION: {
        MAX_LENGTH: TRACKING_SETTINGS.MAX_DESCRIPTION_LENGTH
    },
    GOAL: {
        MIN: 1,
        MAX: 100,
        REQUIRED_FOR_GOOD_HABITS: true
    },
    LIMIT: {
        MIN: 0,
        MAX: 100,
        REQUIRED_FOR_BAD_HABITS: true
    },
    DIFFICULTY: {
        MIN: DIFFICULTY_LEVELS.VERY_EASY,
        MAX: DIFFICULTY_LEVELS.VERY_HARD,
        DEFAULT: DIFFICULTY_LEVELS.MEDIUM
    }
} as const;

// ========== NOTIFICATION AND ALERT SETTINGS ==========

export const NOTIFICATION_SETTINGS = {
    STREAK_REMINDER_HOUR: 20, // 8 PM
    DAILY_REMINDER_ENABLED: true,
    STREAK_ACHIEVEMENT_ENABLED: true,
    GOAL_COMPLETION_ENABLED: true,
    DEFAULT_NOTIFICATION_DELAY: 3000 // 3 seconds
} as const;

// ========== LOCAL STORAGE KEYS ==========

export const STORAGE_KEYS = {
    HABITS_CACHE: 'habits_cache',
    USER_PREFERENCES: 'user_preferences',
    LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
    AUTH_STATE: 'auth_state',
    SELECTED_DATE: 'selected_date',
    ACTIVE_FILTERS: 'active_filters'
} as const;

// ========== PERFORMANCE AND OPTIMIZATION ==========

export const PERFORMANCE_SETTINGS = {
    DEBOUNCE_DELAY: 300,
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_CONCURRENT_REQUESTS: 5,
    BATCH_OPERATION_SIZE: 10
} as const;

// ========== ERROR MESSAGES ==========

export const HABIT_ERRORS = {
    CREATE_FAILED: 'Failed to create habit',
    UPDATE_FAILED: 'Failed to update habit',
    DELETE_FAILED: 'Failed to delete habit',
    NOT_FOUND: 'Habit not found',
    VALIDATION_FAILED: 'Habit validation failed',
    SYNC_FAILED: 'Failed to sync habits',
    DUPLICATE_NAME: 'Habit with this name already exists',
    INVALID_DATE: 'Invalid date provided',
    TRACKING_FAILED: 'Failed to update daily tracking'
} as const;

// ========== SUCCESS MESSAGES ==========

export const SUCCESS_MESSAGES = {
    HABIT_CREATED: 'Habit created successfully',
    HABIT_UPDATED: 'Habit updated successfully',
    HABIT_DELETED: 'Habit deleted successfully',
    TRACKING_UPDATED: 'Daily tracking updated',
    STREAK_ACHIEVED: 'New streak achieved!',
    GOAL_COMPLETED: 'Daily goal completed!',
    SYNC_COMPLETED: 'Sync completed successfully'
} as const;

// ========== EXPORT TYPES ==========

export type HabitType = typeof HABIT_TYPES[keyof typeof HABIT_TYPES];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];
export type HabitCategory = typeof HABIT_CATEGORIES[keyof typeof HABIT_CATEGORIES];

export default {
    HABIT_TYPES,
    DIFFICULTY_LEVELS,
    HABIT_CATEGORIES,
    TRACKING_SETTINGS,
    STREAK_SETTINGS,
    UI_CONSTANTS,
    HABIT_CATEGORY_ICONS,
    HABIT_TYPE_ICONS,
    VALIDATION_RULES,
    NOTIFICATION_SETTINGS,
    STORAGE_KEYS,
    PERFORMANCE_SETTINGS,
    HABIT_ERRORS,
    SUCCESS_MESSAGES
};