export type HabitType = 'good' | 'bad';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type HabitCategory = 'health' | 'fitness' | 'productivity' | 'mindfulness' | 'learning' | 'social' | 'finance' | 'creativity' | 'other';

export interface Habit {
    // Core Information (Columns 1-8)
    id: string;                          // Column A - Unique identifier
    name: string;                        // Column B - Habit name
    description?: string;                // Column C - Description
    habitType: HabitType;               // Column D - 'good' or 'bad'
    difficultyLevel: DifficultyLevel;   // Column E - 1-5 difficulty scale
    goal?: number;                      // Column F - Target for good habits
    limit?: number;                     // Column G - Limit for bad habits
    currentStreak: number;              // Column H - Current streak count

    // Daily Tracking (Columns 9-39) - 31 days
    dailyTracking: (number | null)[];   // Columns I-AM - Daily values (max 31 entries)

    // Additional Properties (Columns 40-50) - removed emoji and whyReason
    createdDate: Date;                  // Column AN - Creation date
    colorCode: string;                  // Column AO - Hex color code
    longestStreak: number;              // Column AP - Longest streak achieved
    category: HabitCategory;            // Column AQ - Category
    tags: string[];                     // Column AR - Tags array (JSON string in sheet)
    isArchived: boolean;                // Column AS - Archive status
    isQuantifiable: boolean;            // Column AT - Can be measured numerically
    unit?: string;                      // Column AU - Measurement unit
    startTime?: string;                 // Column AV - Daily start time (HH:MM format)
    subtasks: string[];                 // Column AW - Subtasks array (JSON string in sheet)
}

export interface HabitFormData {
    name: string;
    description?: string;
    habitType: HabitType;
    difficultyLevel: DifficultyLevel;
    goal?: number;
    limit?: number;
    category: HabitCategory;
    tags: string[];
    isQuantifiable: boolean;
    unit?: string;
    startTime?: string;
    subtasks: string[];
    colorCode: string;
}

export interface DayProgress {
    day: number;
    value: number | null;
    isCompleted: boolean;
    date: Date;
}

export interface HabitStats {
    totalCompletedDays: number;
    totalFailedDays: number;
    completionRate: number;
    averageValue: number;
    currentStreak: number;
    longestStreak: number;
    remainingDaysInMonth: number;
}

// Helper function to check if habit is completed for a specific day
export const isHabitCompletedForDay = (habit: Habit, day: number): boolean => {
    const dayIndex = day - 1;
    if (dayIndex < 0 || dayIndex >= habit.dailyTracking.length) return false;

    const value = habit.dailyTracking[dayIndex];
    if (value === null) return false;

    if (habit.habitType === 'good') {
        return habit.goal ? value >= habit.goal : value > 0;
    } else {
        return habit.limit ? value <= habit.limit : value === 0;
    }
};

// Helper function to calculate habit statistics
export const calculateHabitStats = (habit: Habit): HabitStats => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = currentDate.getDate();

    let totalCompletedDays = 0;
    let totalFailedDays = 0;
    let totalValue = 0;
    let validEntries = 0;

    // Calculate stats for days that have passed
    for (let day = 1; day <= Math.min(currentDay, daysInMonth); day++) {
        const isCompleted = isHabitCompletedForDay(habit, day);
        const dayIndex = day - 1;
        const value = habit.dailyTracking[dayIndex];

        if (value !== null) {
            validEntries++;
            totalValue += value;

            if (isCompleted) {
                totalCompletedDays++;
            } else {
                totalFailedDays++;
            }
        }
    }

    const completionRate = validEntries > 0 ? (totalCompletedDays / validEntries) * 100 : 0;
    const averageValue = validEntries > 0 ? totalValue / validEntries : 0;
    const remainingDaysInMonth = Math.max(0, daysInMonth - currentDay);

    return {
        totalCompletedDays,
        totalFailedDays,
        completionRate,
        averageValue,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        remainingDaysInMonth
    };
};

// Helper function to update streak
export const calculateStreak = (habit: Habit): { currentStreak: number; longestStreak: number } => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    let currentStreak = 0;
    let longestStreak = habit.longestStreak;
    let tempStreak = 0;

    // Calculate streaks by going through all days up to today
    for (let day = 1; day <= currentDay; day++) {
        const isCompleted = isHabitCompletedForDay(habit, day);

        if (isCompleted) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    // Current streak is the streak ending on the most recent day
    currentStreak = tempStreak;

    return { currentStreak, longestStreak };
};

export default Habit;