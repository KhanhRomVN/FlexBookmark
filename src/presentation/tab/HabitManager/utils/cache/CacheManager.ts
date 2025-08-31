import type { Habit } from '../../types/habit';

export interface CachedData<T> {
    data: T;
    timestamp: number;
    ttl: number;
    version?: string;
}

export interface MonthlyHabitCache {
    monthKey: string;
    habits: Habit[];
    lastUpdated: number;
    totalCount: number;
}

export class CacheManager {
    private static instance: CacheManager;
    private readonly STORAGE_KEY = 'flexbookmark_habits';
    private readonly CURRENT_MONTH_KEY = 'flexbookmark_current_month';

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    // Generic cache methods
    async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
        const cachedData: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            version: '1.0'
        };

        return new Promise((resolve) => {
            chrome.storage.local.set({
                [key]: JSON.stringify(cachedData)
            }, () => resolve());
        });
    }

    async getCache<T>(key: string): Promise<T | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                if (result[key]) {
                    try {
                        const cachedData: CachedData<T> = JSON.parse(result[key]);
                        const now = Date.now();

                        // Check if cache is expired
                        if (now - cachedData.timestamp > cachedData.ttl) {
                            console.log(`Cache expired for key: ${key}`);
                            // Remove expired cache
                            chrome.storage.local.remove(key);
                            resolve(null);
                        } else {
                            resolve(cachedData.data);
                        }
                    } catch (error) {
                        console.error(`Error parsing cached data for key ${key}:`, error);
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }

    async clearAllCache(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => resolve());
        });
    }

    // Get current month in YYYY-MM format
    private getCurrentMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Check if we need to cleanup previous month's data
    private async needsCleanup(): Promise<boolean> {
        const currentMonth = this.getCurrentMonth();
        const storedMonth = await this.getStoredMonth();

        return storedMonth && storedMonth !== currentMonth;
    }

    // Get stored month from storage
    private async getStoredMonth(): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.CURRENT_MONTH_KEY], (result) => {
                resolve(result[this.CURRENT_MONTH_KEY] || null);
            });
        });
    }

    // Store current month
    private async storeCurrentMonth(): Promise<void> {
        const currentMonth = this.getCurrentMonth();
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.CURRENT_MONTH_KEY]: currentMonth }, () => resolve());
        });
    }

    // Cleanup previous month's habits
    private async cleanupOldHabits(): Promise<void> {
        console.log('Cleaning up previous month habits...');
        return new Promise((resolve) => {
            chrome.storage.local.remove(this.STORAGE_KEY, () => resolve());
        });
    }

    // Store habits with month validation
    async storeHabits(habits: Habit[]): Promise<void> {
        // Check if we need to cleanup previous month's data
        if (await this.needsCleanup()) {
            await this.cleanupOldHabits();
        }

        // Store current month
        await this.storeCurrentMonth();

        // Store habits
        return new Promise((resolve) => {
            chrome.storage.local.set({
                [this.STORAGE_KEY]: JSON.stringify(habits)
            }, () => resolve());
        });
    }

    // Retrieve habits
    async getHabits(): Promise<Habit[]> {
        // Check if we need to cleanup first
        if (await this.needsCleanup()) {
            await this.cleanupOldHabits();
            return [];
        }

        return new Promise((resolve) => {
            chrome.storage.local.get([this.STORAGE_KEY], (result) => {
                if (result[this.STORAGE_KEY]) {
                    try {
                        const habits = JSON.parse(result[this.STORAGE_KEY]);
                        resolve(habits);
                    } catch (error) {
                        console.error('Error parsing cached habits:', error);
                        resolve([]);
                    }
                } else {
                    resolve([]);
                }
            });
        });
    }

    // Monthly habit cache methods (for useHabits.ts compatibility)
    async getCurrentMonthHabits(): Promise<Habit[]> {
        return this.getHabits();
    }

    async setMonthlyHabits(habits: Habit[]): Promise<void> {
        return this.storeHabits(habits);
    }

    // Data validation method (for useHabits.ts compatibility)
    validateHabitData(habits: Habit[]): { valid: Habit[]; invalid: any[] } {
        if (!Array.isArray(habits)) {
            return { valid: [], invalid: [habits] };
        }

        const valid: Habit[] = [];
        const invalid: any[] = [];

        habits.forEach(habit => {
            if (this.isValidHabit(habit)) {
                valid.push(habit);
            } else {
                invalid.push(habit);
            }
        });

        return { valid, invalid };
    }

    private isValidHabit(habit: any): habit is Habit {
        return (
            habit &&
            typeof habit === 'object' &&
            typeof habit.id === 'string' &&
            typeof habit.name === 'string' &&
            typeof habit.habitType === 'string' &&
            Array.isArray(habit.dailyTracking) &&
            typeof habit.difficultyLevel === 'number'
        );
    }

    // Clear all cached data (alias for clearAllCache)
    async clearCache(): Promise<void> {
        return this.clearAllCache();
    }
}