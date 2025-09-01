import { useCallback, useMemo } from 'react';
import { HabitCacheUtils } from '../../utils/cache/HabitCacheUtils';
import type { Habit } from '../../types/habit';
import type { CachedHabit, CacheStats } from '../../utils/cache/HabitCacheUtils';

export const useHabitCache = () => {
    const storeHabit = useCallback(async (habit: Habit, ttl?: number): Promise<void> => {
        return HabitCacheUtils.storeHabit(habit, ttl);
    }, []);

    const getHabit = useCallback(async (
        habitId: string,
        month?: number,
        year?: number
    ): Promise<CachedHabit | null> => {
        return HabitCacheUtils.getHabit(habitId, month, year);
    }, []);

    const storeHabits = useCallback(async (habits: Habit[], ttl?: number): Promise<void> => {
        return HabitCacheUtils.storeHabits(habits, ttl);
    }, []);

    const getHabitsForMonth = useCallback(async (
        month?: number,
        year?: number
    ): Promise<CachedHabit[]> => {
        return HabitCacheUtils.getHabitsForMonth(month, year);
    }, []);

    const getAllHabits = useCallback(async (): Promise<CachedHabit[]> => {
        return HabitCacheUtils.getAllHabits();
    }, []);

    const removeHabit = useCallback(async (
        habitId: string,
        month?: number,
        year?: number
    ): Promise<void> => {
        return HabitCacheUtils.removeHabit(habitId, month, year);
    }, []);

    const removeHabits = useCallback(async (
        habitIds: string[],
        month?: number,
        year?: number
    ): Promise<void> => {
        return HabitCacheUtils.removeHabits(habitIds, month, year);
    }, []);

    const updateHabit = useCallback(async (habit: Habit): Promise<void> => {
        return HabitCacheUtils.updateHabit(habit);
    }, []);

    const clearAllHabits = useCallback(async (): Promise<void> => {
        return HabitCacheUtils.clearAllHabits();
    }, []);

    const getCacheStats = useCallback(async (): Promise<CacheStats> => {
        return HabitCacheUtils.getCacheStats();
    }, []);

    const cleanupExpired = useCallback(async (): Promise<number> => {
        return HabitCacheUtils.cleanupExpired();
    }, []);

    const isCacheFull = useCallback(async (): Promise<boolean> => {
        return HabitCacheUtils.isCacheFull();
    }, []);

    return useMemo(() => ({
        storeHabit,
        getHabit,
        storeHabits,
        getHabitsForMonth,
        getAllHabits,
        removeHabit,
        removeHabits,
        updateHabit,
        clearAllHabits,
        getCacheStats,
        cleanupExpired,
        isCacheFull
    }), [
        storeHabit,
        getHabit,
        storeHabits,
        getHabitsForMonth,
        getAllHabits,
        removeHabit,
        removeHabits,
        updateHabit,
        clearAllHabits,
        getCacheStats,
        cleanupExpired,
        isCacheFull
    ]);
};