import { Habit, HabitFormData } from '../types/types';

export const generateId = () => `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createHabit = (formData: HabitFormData): Habit => ({
    id: generateId(),
    ...formData,
    tags: [],
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentStreak: 0,
    longestStreak: 0,
    completedToday: false,
});

export const calculateStreak = (habit: Habit, completed: boolean): Habit => {
    const today = new Date();
    const lastCompleted = habit.updatedAt;

    // Reset streak if not completed today and last completion was yesterday
    const shouldReset = !completed &&
        lastCompleted.getDate() !== today.getDate() &&
        lastCompleted.getDate() !== today.getDate() - 1;

    let currentStreak = habit.currentStreak;
    if (completed) {
        // Increment streak if completed today
        currentStreak = lastCompleted.getDate() === today.getDate() ?
            habit.currentStreak : habit.currentStreak + 1;
    } else if (shouldReset) {
        currentStreak = 0;
    }

    return {
        ...habit,
        completedToday: completed,
        currentStreak,
        longestStreak: Math.max(habit.longestStreak, currentStreak),
        updatedAt: new Date(),
    };
};