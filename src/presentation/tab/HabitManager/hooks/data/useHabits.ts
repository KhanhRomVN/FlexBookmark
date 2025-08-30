import { useState, useCallback, useMemo, useRef } from 'react';
import { useCache } from '../core/useCache';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache/CacheKeys';
import type { Habit, HabitType, HabitCategory } from '../../types/habit';

interface TodayStats {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    currentStreaks: number;
    longestStreak: number;
    goodHabitsCompleted: number;
    badHabitsControlled: number;
}

interface OptimisticUpdate {
    habitId: string;
    originalHabit: Habit;
    timestamp: number;
}

export const useHabits = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track optimistic updates for rollback capability
    const optimisticUpdatesRef = useRef<Map<string, OptimisticUpdate>>(new Map());

    const { getCache, setCache } = useCache();

    // Load habits from cache
    const loadCachedHabits = useCallback(async (): Promise<Habit[]> => {
        try {
            const cachedHabits = await getCache<Habit[]>(CACHE_KEYS.HABITS);

            if (cachedHabits && Array.isArray(cachedHabits)) {
                console.log(`Loaded ${cachedHabits.length} habits from cache`);
                setHabits(cachedHabits);
                return cachedHabits;
            }

            console.log('No cached habits found');
            return [];
        } catch (error) {
            console.warn('Failed to load cached habits:', error);
            return [];
        }
    }, [getCache]);

    // Update habits and cache
    const updateHabitsCache = useCallback(async (newHabits: Habit[]): Promise<void> => {
        try {
            // Validate habits data
            const validHabits = newHabits.filter(habit =>
                habit &&
                typeof habit.id === 'string' &&
                habit.id.length > 0 &&
                typeof habit.name === 'string' &&
                habit.name.length > 0
            );

            if (validHabits.length !== newHabits.length) {
                console.warn(`Filtered out ${newHabits.length - validHabits.length} invalid habits`);
            }

            // Sort habits by creation date (newest first)
            const sortedHabits = validHabits.sort((a, b) =>
                new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
            );

            // Update state
            setHabits(sortedHabits);

            // Update cache
            await setCache(CACHE_KEYS.HABITS, sortedHabits, CACHE_TTL.HABITS);

            // Update metadata cache
            const metadata = {
                totalCount: sortedHabits.length,
                activeCount: sortedHabits.filter(h => !h.isArchived).length,
                archivedCount: sortedHabits.filter(h => h.isArchived).length,
                lastUpdated: Date.now()
            };

            await setCache(CACHE_KEYS.HABITS_METADATA, metadata, CACHE_TTL.HABITS);

            console.log(`Updated habits cache with ${sortedHabits.length} habits`);
        } catch (error) {
            console.error('Failed to update habits cache:', error);
            setError('Failed to update habits cache');
        }
    }, [setCache]);

    // Optimistic update for immediate UI feedback
    const optimisticUpdate = useCallback((habitId: string, updater: (habit: Habit) => Habit): void => {
        setHabits(prevHabits => {
            const habitIndex = prevHabits.findIndex(h => h.id === habitId);
            if (habitIndex === -1) {
                console.warn(`Habit ${habitId} not found for optimistic update`);
                return prevHabits;
            }

            const originalHabit = prevHabits[habitIndex];
            const updatedHabit = updater(originalHabit);

            // Store the original for potential rollback
            optimisticUpdatesRef.current.set(habitId, {
                habitId,
                originalHabit,
                timestamp: Date.now()
            });

            // Create new array with updated habit
            const newHabits = [...prevHabits];
            newHabits[habitIndex] = updatedHabit;

            return newHabits;
        });
    }, []);

    // Revert optimistic update on error
    const revertOptimisticUpdate = useCallback((habitId: string): void => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(habitId);

        if (!optimisticUpdate) {
            console.warn(`No optimistic update found for habit ${habitId}`);
            return;
        }

        setHabits(prevHabits => {
            const habitIndex = prevHabits.findIndex(h => h.id === habitId);
            if (habitIndex === -1) {
                return prevHabits;
            }

            // Restore original habit
            const newHabits = [...prevHabits];
            newHabits[habitIndex] = optimisticUpdate.originalHabit;

            // Remove from optimistic updates map
            optimisticUpdatesRef.current.delete(habitId);

            return newHabits;
        });

        console.log(`Reverted optimistic update for habit ${habitId}`);
    }, []);

    // Clean up old optimistic updates (older than 5 minutes)
    const cleanupOptimisticUpdates = useCallback((): void => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        for (const [habitId, update] of optimisticUpdatesRef.current.entries()) {
            if (update.timestamp < fiveMinutesAgo) {
                optimisticUpdatesRef.current.delete(habitId);
            }
        }
    }, []);

    // Get active (non-archived) habits
    const getActiveHabits = useCallback((): Habit[] => {
        return habits.filter(habit => !habit.isArchived);
    }, [habits]);

    // Get archived habits
    const getArchivedHabits = useCallback((): Habit[] => {
        return habits.filter(habit => habit.isArchived);
    }, [habits]);

    // Get habits by category
    const getHabitsByCategory = useCallback((category: HabitCategory): Habit[] => {
        return habits.filter(habit => habit.category === category);
    }, [habits]);

    // Get habits by type
    const getHabitsByType = useCallback((type: HabitType): Habit[] => {
        return habits.filter(habit => habit.habitType === type);
    }, [habits]);

    // Get habit by ID
    const getHabitById = useCallback((id: string): Habit | null => {
        return habits.find(habit => habit.id === id) || null;
    }, [habits]);

    // Calculate today's stats
    const getTodayStats = useCallback((): TodayStats => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const dayIndex = dayOfMonth - 1;

        const activeHabits = getActiveHabits();

        let completedHabits = 0;
        let goodHabitsCompleted = 0;
        let badHabitsControlled = 0;
        let totalCurrentStreaks = 0;
        let maxLongestStreak = 0;

        activeHabits.forEach(habit => {
            const todayValue = habit.dailyTracking[dayIndex];
            let isCompleted = false;

            if (todayValue !== null && todayValue !== undefined) {
                if (habit.habitType === 'good') {
                    isCompleted = habit.goal ? todayValue >= habit.goal : todayValue > 0;
                    if (isCompleted) goodHabitsCompleted++;
                } else {
                    isCompleted = habit.limit ? todayValue <= habit.limit : todayValue === 0;
                    if (isCompleted) badHabitsControlled++;
                }
            }

            if (isCompleted) {
                completedHabits++;
            }

            totalCurrentStreaks += habit.currentStreak;
            maxLongestStreak = Math.max(maxLongestStreak, habit.longestStreak);
        });

        const completionRate = activeHabits.length > 0 ? (completedHabits / activeHabits.length) * 100 : 0;

        return {
            totalHabits: activeHabits.length,
            completedHabits,
            completionRate: Math.round(completionRate),
            currentStreaks: totalCurrentStreaks,
            longestStreak: maxLongestStreak,
            goodHabitsCompleted,
            badHabitsControlled
        };
    }, [getActiveHabits]);

    // Get habit completion status for a specific date
    const isHabitCompletedForDate = useCallback((habit: Habit, date: Date): boolean => {
        const dayOfMonth = date.getDate();
        const dayIndex = dayOfMonth - 1;

        if (dayIndex < 0 || dayIndex >= habit.dailyTracking.length) {
            return false;
        }

        const value = habit.dailyTracking[dayIndex];

        if (value === null || value === undefined) {
            return false;
        }

        if (habit.habitType === 'good') {
            return habit.goal ? value >= habit.goal : value > 0;
        } else {
            return habit.limit ? value <= habit.limit : value === 0;
        }
    }, []);

    // Get habit progress for current month
    const getHabitMonthProgress = useCallback((habitId: string) => {
        const habit = getHabitById(habitId);
        if (!habit) return null;

        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();

        let completedDays = 0;
        const progressData: { day: number; completed: boolean; value: number | null }[] = [];

        for (let day = 1; day <= Math.min(currentDay, daysInMonth); day++) {
            const dayIndex = day - 1;
            const value = habit.dailyTracking[dayIndex];
            const completed = value !== null && (
                habit.habitType === 'good'
                    ? (habit.goal ? value >= habit.goal : value > 0)
                    : (habit.limit ? value <= habit.limit : value === 0)
            );

            if (completed) completedDays++;

            progressData.push({
                day,
                completed,
                value
            });
        }

        const completionRate = currentDay > 0 ? (completedDays / currentDay) * 100 : 0;

        return {
            habitId,
            completedDays,
            totalDays: currentDay,
            completionRate: Math.round(completionRate),
            progressData,
            currentStreak: habit.currentStreak,
            longestStreak: habit.longestStreak
        };
    }, [getHabitById]);

    // Search habits
    const searchHabits = useCallback((query: string): Habit[] => {
        if (!query.trim()) return habits;

        const lowercaseQuery = query.toLowerCase();

        return habits.filter(habit =>
            habit.name.toLowerCase().includes(lowercaseQuery) ||
            habit.description?.toLowerCase().includes(lowercaseQuery) ||
            habit.category.toLowerCase().includes(lowercaseQuery) ||
            habit.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }, [habits]);

    // Filter habits
    const filterHabits = useCallback((filters: {
        type?: HabitType | 'all';
        category?: HabitCategory | 'all';
        archived?: boolean;
        completed?: boolean; // For today
        difficulty?: number[];
    }): Habit[] => {
        let filtered = habits;

        // Filter by archived status
        if (filters.archived !== undefined) {
            filtered = filtered.filter(habit => habit.isArchived === filters.archived);
        }

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(habit => habit.habitType === filters.type);
        }

        // Filter by category
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(habit => habit.category === filters.category);
        }

        // Filter by completion status (today)
        if (filters.completed !== undefined) {
            const today = new Date();
            filtered = filtered.filter(habit =>
                isHabitCompletedForDate(habit, today) === filters.completed
            );
        }

        // Filter by difficulty levels
        if (filters.difficulty && filters.difficulty.length > 0) {
            filtered = filtered.filter(habit =>
                filters.difficulty!.includes(habit.difficultyLevel)
            );
        }

        return filtered;
    }, [habits, isHabitCompletedForDate]);

    // Computed values using useMemo for performance
    const habitStats = useMemo(() => {
        const activeHabits = habits.filter(h => !h.isArchived);
        const archivedHabits = habits.filter(h => h.isArchived);

        const categories = habits.reduce((acc, habit) => {
            acc[habit.category] = (acc[habit.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const types = habits.reduce((acc, habit) => {
            acc[habit.habitType] = (acc[habit.habitType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: habits.length,
            active: activeHabits.length,
            archived: archivedHabits.length,
            byCategory: categories,
            byType: types
        };
    }, [habits]);

    return {
        // State
        habits,
        loading,
        error,
        habitStats,

        // Setters
        setLoading,
        setError,

        // Cache operations
        loadCachedHabits,
        updateHabitsCache,

        // Optimistic updates
        optimisticUpdate,
        revertOptimisticUpdate,
        cleanupOptimisticUpdates,

        // Getters
        getActiveHabits,
        getArchivedHabits,
        getHabitsByCategory,
        getHabitsByType,
        getHabitById,

        // Analytics
        getTodayStats,
        getHabitMonthProgress,
        isHabitCompletedForDate,

        // Filtering and search
        searchHabits,
        filterHabits
    };
};