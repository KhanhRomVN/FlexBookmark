/**
 * 🎯 HABIT-RELATED TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🏗️ Core habit data structures
 * ├── 📊 Tracking và analytics types
 * ├── 🎯 Form types và validation
 * ├── 📈 Statistics và reporting
 * └── 🔄 State management types
 */

import {
    HabitType,
    DifficultyLevel,
    HabitCategory,
    CommonOperationResult
} from './common.types';

// ========== CORE HABIT TYPES ==========

/**
 * 📝 Habit base interface
 */
export interface HabitBase {
    id: string;
    name: string;
    description?: string;
    habitType: HabitType;
    difficultyLevel: DifficultyLevel;
    category: HabitCategory;
    colorCode: string;
    tags: string[];
    isArchived: boolean;
    createdDate: Date;
    updatedDate: Date;
}

/**
 * 📊 Good habit (target to achieve)
 */
export interface GoodHabit extends HabitBase {
    habitType: HabitType.GOOD;
    goal: number;
    isQuantifiable: boolean;
    unit?: string;
    currentStreak: number;
    longestStreak: number;
}

/**
 * 🚫 Bad habit (limit to reduce)
 */
export interface BadHabit extends HabitBase {
    habitType: HabitType.BAD;
    limit: number;
    currentStreak: number;
    longestStreak: number;
}

/**
 * 🎯 Union type for all habits
 */
export type Habit = GoodHabit | BadHabit;

// ========== TRACKING TYPES ==========

/**
 * 📅 Daily tracking entry
 */
export interface DailyTracking {
    date: Date;
    value: number;
    completed: boolean;
    notes?: string;
    timestamp: number;
}

/**
 * 📊 Monthly tracking data
 */
export interface MonthlyTracking {
    month: number;
    year: number;
    habits: {
        [habitId: string]: DailyTracking[];
    };
}

/**
 * 🎯 Habit with tracking data
 */
export type HabitWithTracking = Habit & {
    tracking: {
        [monthYear: string]: DailyTracking[];
    };
    stats: HabitStats;
};

// ========== FORM TYPES ==========

/**
 * 📝 Habit form data (for create/update)
 */
export interface HabitFormData {
    name: string;
    description?: string;
    habitType: HabitType;
    difficultyLevel: DifficultyLevel;
    category: HabitCategory;
    tags: string[];
    colorCode: string;

    // Type-specific properties
    goal?: number;
    limit?: number;
    isQuantifiable?: boolean;
    unit?: string;

    // Optional metadata
    startTime?: string;
    subtasks?: string[];
    reminders?: boolean;
}

/**
 * 📝 Habit update data
 */
export interface HabitUpdateData extends Partial<HabitFormData> {
    id: string;
    isArchived?: boolean;
}

// ========== STATISTICS TYPES ==========

/**
 * 📈 Daily statistics
 */
export interface DailyStats {
    date: Date;
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    goodHabitsCompleted: number;
    badHabitsCompleted: number;
    totalTimeSpent?: number;
}

/**
 * 📈 Weekly statistics
 */
export interface WeeklyStats {
    week: number;
    year: number;
    totalCompletions: number;
    averageCompletionRate: number;
    bestDay?: DailyStats;
    streaksMaintained: number;
    streaksBroken: number;
}

/**
 * 📈 Monthly statistics
 */
export interface MonthlyStats {
    month: number;
    year: number;
    totalCompletions: number;
    averageCompletionRate: number;
    bestHabit?: string;
    consistencyScore: number;
}

/**
 * 🎯 Habit-specific statistics
 */
export interface HabitStats {
    totalCompleted: number;
    totalFailed: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    averageValue: number;
    bestDay?: Date;
    consistency: number;
    totalTimeTracked?: number;
}

/**
 * 📊 Overall statistics
 */
export interface OverallStats {
    totalHabits: number;
    activeHabits: number;
    archivedHabits: number;
    totalCompletions: number;
    overallCompletionRate: number;
    longestRunningStreak: number;
    averageConsistency: number;
    daysTracked: number;
    categories: {
        [category in HabitCategory]: number;
    };
}

// ========== STATE MANAGEMENT TYPES ==========

/**
 * 🏗️ Habit state (for UI management)
 */
export interface HabitState {
    habits: Habit[];
    loading: boolean;
    error: string | null;
    lastUpdated: number;
    selectedHabit?: Habit;
    filters: HabitFilters;
    view: 'list' | 'grid' | 'calendar';
    sortBy: 'name' | 'streak' | 'category' | 'date';
    sortOrder: 'asc' | 'desc';
}

/**
 * 🔍 Habit filters
 */
export interface HabitFilters {
    category?: HabitCategory;
    type?: HabitType;
    tags?: string[];
    archived?: boolean;
    search?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

/**
 * 📊 Tracking state
 */
export interface TrackingState {
    currentDate: Date;
    selectedDate: Date;
    tracking: MonthlyTracking;
    loading: boolean;
    syncing: boolean;
    lastSync: number;
}

// ========== OPERATION TYPES ==========

/**
 * ➕ Create habit result
 */
export interface CreateHabitResult extends CommonOperationResult {
    needsAuth: boolean | undefined;
    data?: Habit;
    needsValidation?: boolean;
}

/**
 * ✏️ Update habit result
 */
export interface UpdateHabitResult extends CommonOperationResult {
    needsAuth: boolean | undefined;
    data?: Habit;
    changes?: string[];
}

/**
 * 🗑️ Delete habit result
 */
export interface DeleteHabitResult extends CommonOperationResult {
    needsAuth: boolean | undefined;
    habitId: string;
}

/**
 * 📅 Track habit result
 */
export interface TrackHabitResult extends CommonOperationResult {
    needsAuth: boolean | undefined;
    habitId: string;
    date: Date;
    value: number;
    newStreak: number;
}

/**
 * 📦 Batch operations result
 */
export interface HabitBatchOperationResult extends CommonOperationResult {
    needsAuth: boolean | undefined;
    successful: number;
    failed: number;
    errors: Array<{
        habitId: string;
        error: string;
    }>;
}

// ========== VALIDATION TYPES ==========

/**
 * ✅ Habit validation result
 */
export interface HabitValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

/**
 * 📝 Form validation result
 */
export interface FormValidationResult {
    isValid: boolean;
    fieldErrors: {
        [field: string]: string[];
    };
    generalErrors: string[];
}

// ========== TYPE GUARDS ==========

/**
 * ✅ Check if habit is GoodHabit
 */
export const isGoodHabit = (habit: Habit): habit is GoodHabit => {
    return habit.habitType === HabitType.GOOD;
};

/**
 * ✅ Check if habit is BadHabit
 */
export const isBadHabit = (habit: Habit): habit is BadHabit => {
    return habit.habitType === HabitType.BAD;
};

/**
 * ✅ Check if value is Habit
 */
export const isHabit = (value: any): value is Habit => {
    return value &&
        typeof value === 'object' &&
        'id' in value &&
        'name' in value &&
        'habitType' in value &&
        'difficultyLevel' in value;
};

/**
 * ✅ Check if value is HabitWithTracking
 */
export const isHabitWithTracking = (value: any): value is HabitWithTracking => {
    return isHabit(value) &&
        'tracking' in value &&
        'stats' in value;
};

// ========== BATCH OPERATION TYPES ==========

/**
 * 📦 Batch operation for multiple habits
 */
export interface BatchOperation {
    type: 'create' | 'update' | 'delete';
    habitId: string;
    data?: Habit;
    rowIndex?: number;
}

/**
 * 📦 Batch operation result
 */
export interface BatchOperationResult {
    successful: number;
    failed: number;
    errors: Array<{
        habitId: string;
        error: string;
        operation: string;
    }>;
}