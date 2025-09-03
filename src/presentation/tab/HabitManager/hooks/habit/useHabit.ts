// src/presentation/tab/HabitManager/hooks/habit/useHabit.ts

import { useState, useCallback, useRef } from 'react';
import { HabitUtils } from '../../utils/habit/HabitUtils';
import type {
    Habit,
    HabitFormData,
    DriveSetupResult,
    HabitBatchOperationResult,
    CreateHabitResult,
    UpdateHabitResult,
    DeleteHabitResult,
    TrackHabitResult
} from '../../types';
import { HabitType } from '../../types';

export interface UseHabitDependencies {
    getAuthStatus: () => any;
}

export const useHabit = ({ getAuthStatus }: UseHabitDependencies) => {
    const [habitUtils, setHabitUtils] = useState<HabitUtils | null>(null);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncInProgress, setSyncInProgress] = useState(false);

    const setupPromiseRef = useRef<Promise<DriveSetupResult> | null>(null);
    const syncPromiseRef = useRef<Promise<any> | null>(null);

    const generateHabitId = (): string => {
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleError = useCallback((error: any, operation: string) => {
        console.error(`❌ Error in ${operation}:`, error);
        const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
        setError(errorMessage);
        return false;
    }, []);

    const initializeHabitUtils = useCallback(async (): Promise<HabitUtils | null> => {
        try {
            const authStatus = getAuthStatus();
            if (!authStatus.hasToken) {
                return null;
            }

            console.log('🚀 Initializing HabitUtils...');
            const utils = new HabitUtils(authStatus.user.accessToken);
            setHabitUtils(utils);
            return utils;
        } catch (error) {
            handleError(error, 'Initialize HabitUtils');
            return null;
        }
    }, [getAuthStatus, handleError]);

    const setupDriveStructure = useCallback(async (): Promise<DriveSetupResult> => {
        if (setupPromiseRef.current) {
            return setupPromiseRef.current;
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

                console.log('📁 Setting up drive structure...');
                const sheetFile = await utils.ensureSheetExists();
                setCurrentSheetId(sheetFile.id);

                return {
                    success: true,
                    sheetId: sheetFile.id,
                    needsInitialSetup: true,
                    timestamp: Date.now()
                };

            } catch (error) {
                handleError(error, 'Setup Drive Structure');
                return {
                    success: false,
                    sheetId: undefined,
                    needsInitialSetup: false,
                    error: error instanceof Error ? error.message : 'Setup failed',
                    timestamp: Date.now()
                };
            } finally {
                setLoading(false);
                setupPromiseRef.current = null;
            }
        })();

        return setupPromiseRef.current;
    }, [habitUtils, initializeHabitUtils, handleError]);

    const syncHabits = useCallback(async (forceRefresh: boolean = false): Promise<any> => {
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
                    needsAuth: true,
                    timestamp: Date.now()
                };
            }
        }

        syncPromiseRef.current = (async (): Promise<any> => {
            try {
                setSyncInProgress(true);
                setError(null);

                console.log('🔄 Starting habit sync...');
                const sheetHabits = await habitUtils!.readAllHabits(currentSheetId!);

                const currentHabitIds = new Set(habits.map(h => h.id));
                const sheetHabitIds = new Set(sheetHabits.map(h => h.id));

                const added = sheetHabits.filter(h => !currentHabitIds.has(h.id)).length;
                const deleted = habits.filter(h => !sheetHabitIds.has(h.id)).length;
                const updated = sheetHabits.filter(h => {
                    const current = habits.find(ch => ch.id === h.id);
                    return current && JSON.stringify(current) !== JSON.stringify(h);
                }).length;

                setHabits(sheetHabits);

                const result = {
                    success: true,
                    habitsCount: sheetHabits.length,
                    lastSync: Date.now(),
                    changes: { added, updated, deleted },
                    timestamp: Date.now()
                };

                console.log('✅ Habit sync completed:', result);
                return result;

            } catch (error) {
                handleError(error, 'Sync Habits');
                return {
                    success: false,
                    habitsCount: habits.length,
                    lastSync: Date.now(),
                    changes: { added: 0, updated: 0, deleted: 0 },
                    error: error instanceof Error ? error.message : 'Sync failed',
                    needsAuth: true,
                    timestamp: Date.now()
                };
            } finally {
                setSyncInProgress(false);
                syncPromiseRef.current = null;
            }
        })();

        return syncPromiseRef.current;
    }, [habitUtils, currentSheetId, habits, setupDriveStructure, handleError]);

    const createHabit = useCallback(async (formData: HabitFormData): Promise<CreateHabitResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now(),
            };
        }

        const timestamp = Date.now();
        const newHabit: Habit = formData.habitType === HabitType.GOOD ? {
            id: generateHabitId(),
            name: formData.name,
            description: formData.description || '',
            habitType: HabitType.GOOD,
            difficultyLevel: formData.difficultyLevel,
            category: formData.category,
            colorCode: formData.colorCode || '#3b82f6',
            tags: formData.tags || [],
            isArchived: false,
            createdDate: new Date(),
            updatedDate: new Date(),
            goal: formData.goal || 1,
            isQuantifiable: formData.isQuantifiable || false,
            unit: formData.unit || '',
            currentStreak: 0,
            longestStreak: 0
        } : {
            id: generateHabitId(),
            name: formData.name,
            description: formData.description || '',
            habitType: HabitType.BAD,
            difficultyLevel: formData.difficultyLevel,
            category: formData.category,
            colorCode: formData.colorCode || '#3b82f6',
            tags: formData.tags || [],
            isArchived: false,
            createdDate: new Date(),
            updatedDate: new Date(),
            limit: formData.limit || 1,
            currentStreak: 0,
            longestStreak: 0
        };

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => [...prev, newHabit]);
            await habitUtils.writeHabit(currentSheetId, newHabit);

            console.log('✅ Habit created successfully:', newHabit.id);
            return {
                success: true,
                data: newHabit,
                timestamp,
                needsAuth: false,
            };

        } catch (error) {
            setHabits(prev => prev.filter(h => h.id !== newHabit.id));
            handleError(error, 'Create Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Create habit failed',
                needsAuth: true,
                timestamp,
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, handleError]);

    const updateHabit = useCallback(async (updatedHabit: Habit): Promise<UpdateHabitResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now(),
            };
        }

        const originalHabit = habits.find(h => h.id === updatedHabit.id);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found',
                needsAuth: false,
                timestamp: Date.now(),
            };
        }

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
            const habitIndex = habits.findIndex(h => h.id === updatedHabit.id);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log('✅ Habit updated successfully:', updatedHabit.id);
            return {
                success: true,
                data: updatedHabit,
                needsAuth: false,
                timestamp: Date.now(),
            };

        } catch (error) {
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? originalHabit : h));
            handleError(error, 'Update Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update habit failed',
                needsAuth: true,
                timestamp: Date.now(),
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    const deleteHabit = useCallback(async (habitId: string): Promise<DeleteHabitResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                habitId,
                timestamp: Date.now(),
            };
        }

        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) {
            return {
                success: false,
                error: 'Habit not found',
                needsAuth: false,
                habitId,
                timestamp: Date.now(),
            };
        }

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => prev.filter(h => h.id !== habitId));
            await habitUtils.deleteHabit(currentSheetId, habitId);

            console.log('✅ Habit deleted successfully:', habitId);
            return {
                success: true,
                habitId,
                needsAuth: false,
                timestamp: Date.now(),
            };

        } catch (error) {
            setHabits(prev => [...prev, habitToDelete]);
            handleError(error, 'Delete Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete habit failed',
                needsAuth: true,
                habitId,
                timestamp: Date.now(),
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    const updateDailyHabit = useCallback(async (
        habitId: string,
        day: number,
        value: number
    ): Promise<TrackHabitResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                habitId,
                date: new Date(),
                value,
                newStreak: 0,
                timestamp: Date.now(),
            };
        }

        if (day < 1 || day > 31) {
            return {
                success: false,
                error: 'Day must be between 1 and 31',
                needsAuth: false,
                habitId,
                date: new Date(),
                value,
                newStreak: 0,
                timestamp: Date.now(),
            };
        }

        try {
            setError(null);
            const updatedHabit = await habitUtils.updateDailyHabit(currentSheetId, habitId, day, value);

            if (updatedHabit) {
                setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            }

            console.log('✅ Daily habit tracking updated successfully');
            return {
                success: true,
                habitId,
                date: new Date(),
                value,
                newStreak: updatedHabit?.currentStreak || 0,
                needsAuth: false,
                timestamp: Date.now(),
            };

        } catch (error) {
            handleError(error, 'Update Daily Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update daily tracking failed',
                needsAuth: true,
                habitId,
                date: new Date(),
                value,
                newStreak: 0,
                timestamp: Date.now(),
            };
        }
    }, [habitUtils, currentSheetId, handleError]);

    const archiveHabit = useCallback(async (habitId: string, archive: boolean): Promise<UpdateHabitResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now(),
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found',
                needsAuth: false,
                timestamp: Date.now(),
            };
        }

        try {
            setLoading(true);
            setError(null);

            const updatedHabit = { ...originalHabit, isArchived: archive, updatedDate: new Date() };
            setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log(`✅ Habit ${archive ? 'archived' : 'unarchived'} successfully:`, habitId);
            return {
                success: true,
                data: updatedHabit,
                needsAuth: false,
                timestamp: Date.now(),
            };

        } catch (error) {
            setHabits(prev => prev.map(h => h.id === habitId ? originalHabit : h));
            handleError(error, `${archive ? 'Archive' : 'Unarchive'} Habit`);
            return {
                success: false,
                error: error instanceof Error ? error.message : `${archive ? 'Archive' : 'Unarchive'} failed`,
                needsAuth: true,
                timestamp: Date.now(),
            };
        } finally {
            setLoading(false);
        }
    }, [habitUtils, currentSheetId, habits, handleError]);

    const batchArchiveHabits = useCallback(async (
        habitIds: string[],
        archive: boolean
    ): Promise<HabitBatchOperationResult> => {
        const timestamp = Date.now();
        const results = await Promise.allSettled(
            habitIds.map(id => archiveHabit(id, archive))
        );

        let successful = 0;
        let failed = 0;
        const errors: Array<{ habitId: string; error: string }> = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            const habitId = habitIds[index];
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value?.error || 'Unknown error';
                errors.push({ habitId, error });

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return {
            success: successful > 0 || failed === 0,
            successful,
            failed,
            errors,
            needsAuth,
            timestamp
        };
    }, [archiveHabit]);

    const batchDeleteHabits = useCallback(async (habitIds: string[]): Promise<HabitBatchOperationResult> => {
        const timestamp = Date.now();
        const results = await Promise.allSettled(
            habitIds.map(id => deleteHabit(id))
        );

        let successful = 0;
        let failed = 0;
        const errors: Array<{ habitId: string; error: string }> = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            const habitId = habitIds[index];
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value?.error || 'Unknown error';
                errors.push({ habitId, error });

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return {
            success: successful > 0 || failed === 0,
            successful,
            failed,
            errors,
            needsAuth,
            timestamp
        };
    }, [deleteHabit]);

    return {
        habitUtils,
        currentSheetId,
        habits,
        loading,
        error,
        syncInProgress,
        initializeHabitUtils,
        setupDriveStructure,
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        updateDailyHabit,
        syncHabits,
        batchArchiveHabits,
        batchDeleteHabits,
        setError,
        setLoading,
        setHabits,
        isReady: !!habitUtils && !!currentSheetId && !loading,
        habitCount: habits.length,
        activeHabits: habits.filter(h => !h.isArchived),
        archivedHabits: habits.filter(h => h.isArchived)
    };
};

export default useHabit;