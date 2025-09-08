import { Habit, HabitFormData } from '../types/types';

export const generateId = () => `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createHabit = (formData: HabitFormData): Habit => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Create dailyCounts with proper null/0/skip_day_month values based on current date and month
    const dailyCounts = Array(31).fill(null).map((_, index) => {
        const dayNumber = index + 1;

        // For days that don't exist in this month (e.g., day 31 in September)
        if (dayNumber > daysInMonth) {
            return "skip_day_month";
        }
        // For past days (before today) - set as null (no data available)
        else if (dayNumber < currentDay) {
            return null;
        }
        // For today and future days in this month - set as empty string (no value yet)
        else {
            return "";
        }
    });

    return {
        id: generateId(),
        ...formData,
        tags: formData.tags || [],
        subtasks: formData.subtasks || [],
        isArchived: false,
        createdAt: today,
        updatedAt: today,
        currentStreak: 0,
        longestStreak: 0,
        completedToday: false,
        dailyCounts,
        emoji: formData.emoji || "📝"
    };
};

export const calculateStreak = (habit: Habit, completed: boolean): Habit => {
    const today = new Date();
    const todayIndex = today.getDate() - 1; // 0-based index (0-30 for days 1-31)
    const lastCompleted = habit.updatedAt;

    // Update daily count based on completed action
    const currentCount = habit.dailyCounts[todayIndex] || 0;
    const newCount = completed ?
        Math.min(
            currentCount + 1,
            habit.habitType === 'good' ? (habit.goal || 1) : Infinity
        ) :
        Math.max(currentCount - 1, 0);

    // Update dailyCounts array
    const newDailyCounts = [...habit.dailyCounts];
    newDailyCounts[todayIndex] = newCount;

    // Calculate if habit is completed based on count vs goal/limit
    const isCompleted = habit.habitType === 'good' ?
        newCount >= (habit.goal || 1) :
        newCount <= (habit.limit || 0);

    // Reset streak if not completed today and last completion was not today or yesterday
    const shouldReset = !isCompleted &&
        lastCompleted.getDate() !== today.getDate() &&
        lastCompleted.getDate() !== today.getDate() - 1;

    let currentStreak = habit.currentStreak;

    if (isCompleted) {
        // Increment streak if completed today (but only once per day)
        currentStreak = lastCompleted.getDate() === today.getDate() ?
            habit.currentStreak : habit.currentStreak + 1;
    } else if (shouldReset) {
        currentStreak = 0;
    }

    return {
        ...habit,
        dailyCounts: newDailyCounts,
        completedToday: isCompleted,
        currentStreak,
        longestStreak: Math.max(habit.longestStreak, currentStreak),
        updatedAt: new Date(),
    };
};