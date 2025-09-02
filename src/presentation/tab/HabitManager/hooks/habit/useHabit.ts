// src/presentation/tab/HabitManager/hooks/habit/useHabit.ts
// Simplified version to prevent circular dependencies and infinite loops

import { useState, useCallback, useRef } from 'react';
import { HabitUtils } from '../../utils/habit/HabitUtils';
import type { Habit, HabitFormData } from '../../types/habit';
import type {
    DriveSetupResult,
    SyncResult,
    HabitOperationResult,
    BatchOperationResult
} from '../../types/drive';

export interface UseHabitDependencies {
    isAuthReady: () => boolean;
    getAuthStatus: () => any;
}

export const useHabit = ({ isAuthReady, getAuthStatus }: UseHabitDependencies) => {
    // ========== STATE ==========
    const [habitUtils, setHabitUtils] = useState<HabitUtils | null>(null);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Refs to prevent duplicate operations
    const setupPromiseRef = useRef<Promise<DriveSetupResult> | null>(null);
    const syncPromiseRef = useRef<Promise<SyncResult> | null>(null);

    // ========== UTILITY FUNCTIONS ==========
    const generateHabitId = (): string => {
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
        setError(errorMessage);
        return false;
    }, []);

    // ========== INITIALIZATION ==========
    const initializeHabitUtils = useCallback(async (): Promise<HabitUtils | null> => {
        try {
            const authStatus = getAuthStatus();
            if (!authStatus.hasToken) {
                return null;
            }

            console.log('Initializing HabitUtils...');
            const utils = new HabitUtils(authStatus.user.accessToken);
            setHabitUtils(utils);
            return utils;
        } catch (error) {
            handleError(error, 'Initialize HabitUtils');
            return null;
        }
    }, [getAuthStatus, handleError]);

    // ========== DRIVE SETUP ==========
    const setupDriveStructure = useCallback(async (): Promise<DriveSetupResult> => {
        if (setupPromiseRef.current) {
            return setupPromiseRef.current;
        }

        if (!isAuthReady()) {
            return {
                success: false,
                sheetId: null,
                needsInitialSetup: false,
                error: 'Authentication not ready'
            };
        }

        setupPromiseRef.current = (async (): Promise<DriveSetupResult> => {
            try {
                setLoading(true);
                setError(null);

                let utils = habitUtils;
                if (!utils) {
                    utils = await initializeHabitUtils();
                    if (!utils) {
                        throw new Error('Failed to initialize habit utils');
                    }
                }

                console.log('Setting up drive structure...');
                const sheetFile = await utils.ensureSheetExists();
                setCurrentSheetId(sheetFile.id);

                return {
                    success: true,
                    sheetId: sheetFile.id,
                    needsInitialSetup: true
                };

            } catch (error) {
                handleError(error, 'Setup Drive Structure');
                return {
                    success: false,
                    sheetId: null,
                    needsInitialSetup: false,
                    error: error instanceof Error ? error.message : 'Setup failed'
                };
            } finally {
                setLoading(false);
                setupPromiseRef.current = null;
            }
        })();

        return setupPromiseRef.current;
    }, [isAuthReady, habitUtils, initializeHabitUtils, handleError]);

    // ========== SYNC FUNCTIONS ==========
    const syncHabits = useCallback(async (forceRefresh: boolean = false): Promise<SyncResult> => {
        if (syncPromiseRef.current && !forceRefresh) {
            return syncPromiseRef.current;
        }

        if (!habitUtils || !currentSheetId) {
            const setupResult = await setupDriveStructure();
            if (!setupResult.success) {
                return {
                    success: false,
                    habitsCount: 0,
                    lastSync: Date.now(),
                    changes: { added: 0, updated: 0, deleted: 0 },
                    error: 'Drive setup failed',
                    needsAuth: true
                };
            }
        }

        syncPromiseRef.current = (async (): Promise<SyncResult> => {
            try {
                setSyncInProgress(true);
                setError(null);

                console.log('Starting habit sync...');
                const sheetHabits = await habitUtils!.readAllHabits(currentSheetId!);

                // Calculate changes
                const currentHabitIds = new Set(habits.map(h => h.id));
                const sheetHabitIds = new Set(sheetHabits.map(h => h.id));

                const added = sheetHabits.filter(h => !currentHabitIds.has(h.id)).length;
                const deleted = habits.filter(h => !sheetHabitIds.has(h.id)).length;
                const updated = sheetHabits.filter(h => {
                    const current = habits.find(ch => ch.id === h.id);
                    return current && JSON.stringify(current) !== JSON.stringify(h);
                }).length;

                setHabits(sheetHabits);

                const result: SyncResult = {
                    success: true,
                    habitsCount: sheetHabits.length,
                    lastSync: Date.now(),
                    changes: { added, updated, deleted }
                };

                console.log('Habit sync completed:', result);
                return result;

            } catch (error) {
                handleError(error, 'Sync Habits');
                return {
                    success: false,
                    habitsCount: habits.length,
                    lastSync: Date.now(),
                    changes: { added: 0, updated: 0, deleted: 0 },
                    error: error instanceof Error ? error.message : 'Sync failed',
                    needsAuth: true
                };
            } finally {
                setSyncInProgress(false);
                syncPromiseRef.current = null;
            }
        })();

        return syncPromiseRef.current;
    }, [habitUtils, currentSheetId, habits, setupDriveStructure, handleError]);

    // ========== CRUD OPERATIONS ==========
    const createHabit = useCallback(async (formData: HabitFormData): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const newHabit: Habit = {
            id: generateHabitId(),
            name: formData.name,
            description: formData.description || '',
            habitType: formData.habitType,
            difficultyLevel: formData.difficultyLevel,
            goal: formData.habitType === 'good' ? formData.goal : undefined,
            limit: formData.habitType === 'bad' ? formData.limit : undefined,
            currentStreak: 0,
            longestStreak: 0,
            dailyTracking: Array(31).fill(null),
            createdDate: new Date(),
            colorCode: formData.colorCode || '#3b82f6',
            category: formData.category,
            tags: formData.tags || [],
            isArchived: false,
            isQuantifiable: formData.isQuantifiable || false,
            unit: formData.unit || '',
            startTime: formData.startTime || '',
            subtasks: formData.subtasks || []
        };

        try {
            setLoading(true);
            setError(null);

            // Optimistic update
            setHabits(prev => [...prev, newHabit]);

            // Save to Google Sheets
            await habitUtils.writeHabit(currentSheetId, newHabit);

            console.log('Habit created successfully:', newHabit.id);
            return { success: true, data: newHabit };

        } catch (error) {
            // Revert optimistic update
            setHabits(prev => prev.filter(h => h.id !== newHabit.id));

            handleError(error, 'Create Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Create habit failed',
                needsAuth: true
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, handleError]);

    const updateHabit = useCallback(async (updatedHabit: Habit): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const originalHabit = habits.find(h => h.id === updatedHabit.id);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            // Optimistic update
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));

            // Update in Google Sheets
            const habitIndex = habits.findIndex(h => h.id === updatedHabit.id);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log('Habit updated successfully:', updatedHabit.id);
            return { success: true, data: updatedHabit };

        } catch (error) {
            // Revert optimistic update
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? originalHabit : h));

            handleError(error, 'Update Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update habit failed',
                needsAuth: true
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    const deleteHabit = useCallback(async (habitId: string): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            // Optimistic update
            setHabits(prev => prev.filter(h => h.id !== habitId));

            // Delete from Google Sheets
            await habitUtils.deleteHabit(currentSheetId, habitId);

            console.log('Habit deleted successfully:', habitId);
            return { success: true };

        } catch (error) {
            // Revert optimistic update
            setHabits(prev => [...prev, habitToDelete]);

            handleError(error, 'Delete Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete habit failed',
                needsAuth: true
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    const updateDailyHabit = useCallback(async (
        habitId: string,
        day: number,
        value: number
    ): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        if (day < 1 || day > 31) {
            return {
                success: false,
                error: 'Day must be between 1 and 31'
            };
        }

        try {
            setError(null);

            const updatedHabit = await habitUtils.updateDailyHabit(currentSheetId, habitId, day, value);

            if (updatedHabit) {
                setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            }

            console.log('Daily habit tracking updated successfully');
            return { success: true, data: updatedHabit };

        } catch (error) {
            handleError(error, 'Update Daily Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update daily tracking failed',
                needsAuth: true
            };
        }
    }, [habitUtils, currentSheetId, handleError]);

    const archiveHabit = useCallback(async (habitId: string, archive: boolean): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            const updatedHabit = { ...originalHabit, isArchived: archive };

            // Optimistic update
            setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));

            // Update in Google Sheets
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log(`Habit ${archive ? 'archived' : 'unarchived'} successfully:`, habitId);
            return { success: true, data: updatedHabit };

        } catch (error) {
            // Revert optimistic update
            setHabits(prev => prev.map(h => h.id === habitId ? originalHabit : h));

            handleError(error, `${archive ? 'Archive' : 'Unarchive'} Habit`);
            return {
                success: false,
                error: error instanceof Error ? error.message : `${archive ? 'Archive' : 'Unarchive'} failed`,
                needsAuth: true
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    // ========== BATCH OPERATIONS ==========
    const batchArchiveHabits = useCallback(async (
        habitIds: string[],
        archive: boolean
    ): Promise<BatchOperationResult> => {
        const results = await Promise.allSettled(
            habitIds.map(id => archiveHabit(id, archive))
        );

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value.error;
                errors.push(`Habit ${habitIds[index]}: ${error}`);

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return { successful, failed, errors, needsAuth };
    }, [archiveHabit]);

    const batchDeleteHabits = useCallback(async (habitIds: string[]): Promise<BatchOperationResult> => {
        const results = await Promise.allSettled(
            habitIds.map(id => deleteHabit(id))
        );

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value.error;
                errors.push(`Habit ${habitIds[index]}: ${error}`);

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return { successful, failed, errors, needsAuth };
    }, [deleteHabit]);

    // ========== RETURN INTERFACE ==========
    return {
        // State
        habitUtils,
        currentSheetId,
        habits,
        loading,
        error,
        syncInProgress,

        // Setup
        initializeHabitUtils,
        setupDriveStructure,

        // CRUD operations
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        updateDailyHabit,

        // Sync operations
        syncHabits,

        // Batch operations
        batchArchiveHabits,
        batchDeleteHabits,

        // Utilities
        setError,
        setLoading,
        setHabits,

        // Computed
        isReady: !!habitUtils && !!currentSheetId && !loading,
        habitCount: habits.length,
        activeHabits: habits.filter(h => !h.isArchived),
        archivedHabits: habits.filter(h => h.isArchived)
    };
};

export default useHabit;