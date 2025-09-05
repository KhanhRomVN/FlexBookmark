import { Habit, HabitFormData } from '../types/types';

export const generateId = () => `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createHabit = (formData: HabitFormData): Habit => ({
    id: generateId(),
    ...formData,
    tags: formData.tags || [],
    subtasks: formData.subtasks || [],
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentStreak: 0,
    longestStreak: 0,
    completedToday: false,
    dailyCounts: Array(31).fill(0),
    emoji: formData.emoji || "📝"
});

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