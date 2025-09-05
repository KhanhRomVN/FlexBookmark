// src/presentation/tab/HabitManager/utils/cacheUtils.ts
import { Habit } from '../types/types';

const CACHE_KEY = 'habits_cache';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export const cacheHabits = async (habits: Habit[]): Promise<void> => {
    const cacheData = {
        data: habits,
        timestamp: Date.now()
    };

    return new Promise((resolve) => {
        chrome.storage.local.set({
            [CACHE_KEY]: cacheData
        }, () => resolve());
    });
};

export const getCachedHabits = async (): Promise<Habit[] | null> => {
    return new Promise((resolve) => {
        chrome.storage.local.get([CACHE_KEY], (result) => {
            if (!result[CACHE_KEY] || !result[CACHE_KEY].data) {
                resolve(null);
                return;
            }

            const { data, timestamp } = result[CACHE_KEY];
            const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

            if (isExpired) {
                resolve(null);
            } else {
                // Convert string dates back to Date objects
                const habits = data.map((habit: any) => ({
                    ...habit,
                    createdAt: new Date(habit.createdAt),
                    updatedAt: new Date(habit.updatedAt)
                }));
                resolve(habits);
            }
        });
    });
};