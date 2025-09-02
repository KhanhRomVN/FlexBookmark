// src/presentation/tab/HabitManager/hooks/useHabitData.ts
// Simplified version to prevent circular dependencies and infinite loops

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./auth/useAuth";
import { useHabitCache } from "./cache/useHabitCache";
import { useHabit } from "./habit/useHabit";

export interface SystemStatus {
    canProceed: boolean;
    needsAuth: boolean;
    needsReauth: boolean;
    needsPermissions: boolean;
    needsSetup: boolean;
    isInitializing: boolean;
    authReady: boolean;
}

export interface HabitOperationResult {
    success: boolean;
    error?: string;
    needsAuth?: boolean;
    needsPermissions?: boolean;
    data?: any;
}

export const useHabitData = () => {
    // ========== STATE MANAGEMENT ==========
    const [initialized, setInitialized] = useState(false);
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        canProceed: false,
        needsAuth: false,
        needsReauth: false,
        needsPermissions: false,
        needsSetup: false,
        isInitializing: true,
        authReady: false
    });

    // Prevent multiple initialization attempts
    const initPromiseRef = useRef<Promise<void> | null>(null);
    const hasInitialized = useRef(false);

    // ========== HOOK INTEGRATION ==========
    const {
        authState,
        isAuthReady,
        handleLogin,
        handleLogout,
        handleForceReauth,
        handleValidateAuth,
        getAuthStatus,
        permissions,
        diagnoseAuthIssues,
        attemptAutoRecovery
    } = useAuth();

    const { storeHabit, getAllHabits, updateHabit: updateCachedHabit } = useHabitCache();

    const {
        habits,
        loading: habitLoading,
        error: habitError,
        syncInProgress,
        setupDriveStructure,
        createHabit: createHabitOperation,
        updateHabit: updateHabitOperation,
        deleteHabit: deleteHabitOperation,
        archiveHabit: archiveHabitOperation,
        updateDailyHabit: updateDailyHabitOperation,
        syncHabits,
        setHabits: setHabitState
    } = useHabit({
        isAuthReady,
        getAuthStatus
    });

    // ========== INITIALIZATION ==========
    const initializeSystem = useCallback(async () => {
        if (hasInitialized.current || initPromiseRef.current) {
            return initPromiseRef.current;
        }

        // Only initialize if we have basic authentication
        if (!authState.isAuthenticated || !authState.user?.accessToken) {
            return;
        }

        console.log('Starting system initialization...');
        hasInitialized.current = true;

        initPromiseRef.current = (async () => {
            try {
                setSystemStatus(prev => ({ ...prev, isInitializing: true }));

                // Wait for auth validation if in progress
                if (authState.loading) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Load cached habits first
                try {
                    const cachedHabits = await getAllHabits();
                    if (cachedHabits.length > 0) {
                        setHabitState(cachedHabits);
                        console.log(`Loaded ${cachedHabits.length} habits from cache`);
                    }
                } catch (cacheError) {
                    console.warn('Failed to load cached habits:', cacheError);
                }

                // Setup drive structure
                try {
                    const setupResult = await setupDriveStructure();
                    if (setupResult.success) {
                        console.log('Drive structure setup completed');
                    } else {
                        console.warn('Drive setup warning:', setupResult.error);
                    }
                } catch (setupError) {
                    console.warn('Drive setup error:', setupError);
                }

                // Initial sync
                try {
                    const syncResult = await syncHabits(true);
                    if (syncResult.success) {
                        console.log(`Initial sync completed: ${syncResult.habitsCount} habits`);
                    } else {
                        console.warn('Initial sync warning:', syncResult.error);
                    }
                } catch (syncError) {
                    console.warn('Initial sync error:', syncError);
                }

                // Mark as initialized
                setInitialized(true);
                console.log('System initialization completed');

            } catch (error) {
                console.error('System initialization failed:', error);
                // Still mark as initialized to prevent getting stuck
                setInitialized(true);
            } finally {
                setSystemStatus(prev => ({ ...prev, isInitializing: false }));
                initPromiseRef.current = null;
            }
        })();

        return initPromiseRef.current;
    }, [
        authState.isAuthenticated,
        authState.user?.accessToken,
        authState.loading,
        getAllHabits,
        setHabitState,
        setupDriveStructure,
        syncHabits
    ]);

    // ========== HABIT OPERATIONS ==========
    const handleCreateHabit = useCallback(async (formData: any): Promise<HabitOperationResult> => {
        try {
            const result = await createHabitOperation(formData);

            if (result.success && result.data) {
                try {
                    await storeHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to cache new habit:', cacheError);
                }
                return { success: true, data: result.data };
            }

            return {
                success: false,
                error: result.error || 'Failed to create habit',
                needsAuth: result.needsAuth
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Create habit failed';
            console.error('Create habit operation failed:', error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: true
            };
        }
    }, [createHabitOperation, storeHabit]);

    const handleUpdateHabit = useCallback(async (habit: any): Promise<HabitOperationResult> => {
        try {
            const result = await updateHabitOperation(habit);

            if (result.success && result.data) {
                try {
                    await updateCachedHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to update cached habit:', cacheError);
                }
                return { success: true, data: result.data };
            }

            return {
                success: false,
                error: result.error || 'Failed to update habit',
                needsAuth: result.needsAuth
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Update habit failed';
            console.error('Update habit operation failed:', error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: true
            };
        }
    }, [updateHabitOperation, updateCachedHabit]);

    const handleDeleteHabit = useCallback(async (habitId: string): Promise<HabitOperationResult> => {
        try {
            const result = await deleteHabitOperation(habitId);

            return {
                success: result.success,
                error: result.error,
                needsAuth: result.needsAuth
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Delete habit failed';
            console.error('Delete habit operation failed:', error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: true
            };
        }
    }, [deleteHabitOperation]);

    const handleArchiveHabit = useCallback(async (habitId: string, archive: boolean): Promise<HabitOperationResult> => {
        try {
            const result = await archiveHabitOperation(habitId, archive);

            if (result.success && result.data) {
                try {
                    await updateCachedHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to update cached habit after archive:', cacheError);
                }
                return { success: true, data: result.data };
            }

            return {
                success: false,
                error: result.error || 'Failed to archive habit',
                needsAuth: result.needsAuth
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Archive habit failed';
            console.error('Archive habit operation failed:', error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: true
            };
        }
    }, [archiveHabitOperation, updateCachedHabit]);

    const handleUpdateDailyHabit = useCallback(async (habitId: string, day: number, value: number): Promise<HabitOperationResult> => {
        try {
            const result = await updateDailyHabitOperation(habitId, day, value);

            if (result.success && result.data) {
                try {
                    await updateCachedHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to update cached habit after daily update:', cacheError);
                }
                return { success: true, data: result.data };
            }

            return {
                success: false,
                error: result.error || 'Failed to update daily habit',
                needsAuth: result.needsAuth
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Update daily habit failed';
            console.error('Update daily habit operation failed:', error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: true
            };
        }
    }, [updateDailyHabitOperation, updateCachedHabit]);

    // ========== COMPUTED VALUES ==========
    const getTodayStats = useCallback(() => {
        const today = new Date();
        const day = today.getDate();

        return habits.reduce((stats, habit) => {
            const value = habit.dailyTracking?.[day - 1];
            const isCompleted = value !== null && value !== undefined && value > 0;

            if (isCompleted) {
                stats.completed++;
                if (habit.habitType === 'good') {
                    stats.goodCompleted++;
                } else if (habit.habitType === 'bad') {
                    stats.badCompleted++;
                }
            }

            stats.total++;
            return stats;
        }, {
            total: 0,
            completed: 0,
            goodCompleted: 0,
            badCompleted: 0,
            completionRate: habits.length > 0 ? 0 : 0
        });
    }, [habits]);

    const syncInBackground = useCallback(async (): Promise<void> => {
        if (!initialized || !isAuthReady() || syncInProgress) {
            return;
        }

        try {
            console.log('Starting background sync...');
            const result = await syncHabits(false);

            if (result.success) {
                console.log(`Background sync completed: ${result.habitsCount || 0} habits synced`);
            } else {
                console.warn('Background sync failed:', result.error);
            }
        } catch (error) {
            console.warn('Background sync encountered an error:', error);
        }
    }, [initialized, isAuthReady, syncInProgress, syncHabits]);

    // ========== EFFECTS ==========

    // Update system status based on auth state
    useEffect(() => {
        const newStatus: SystemStatus = {
            canProceed: authState.canProceed && initialized,
            needsAuth: !authState.isAuthenticated,
            needsReauth: authState.validationStatus.needsReauth,
            needsPermissions: !permissions.allRequired,
            needsSetup: !initialized,
            isInitializing: !initialized && authState.isAuthenticated,
            authReady: isAuthReady()
        };

        setSystemStatus(newStatus);
    }, [
        authState.canProceed,
        authState.isAuthenticated,
        authState.validationStatus.needsReauth,
        permissions.allRequired,
        initialized,
        isAuthReady
    ]);

    // Initialize when auth is ready
    useEffect(() => {
        if (authState.isAuthenticated && !initialized && !hasInitialized.current) {
            initializeSystem();
        }
    }, [authState.isAuthenticated, initialized, initializeSystem]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hasInitialized.current = false;
            initPromiseRef.current = null;
        };
    }, []);

    // ========== RETURN INTERFACE ==========
    return {
        // State
        authState,
        habits,
        loading: habitLoading || authState.loading,
        error: habitError || authState.error,
        initialized,
        systemStatus,
        syncInProgress,
        permissions,

        // Status
        isAuthReady: isAuthReady(),
        canProceed: systemStatus.canProceed,
        needsAuth: systemStatus.needsAuth,
        needsReauth: systemStatus.needsReauth,
        needsPermissions: systemStatus.needsPermissions,
        needsSetup: systemStatus.needsSetup,

        // Auth actions
        handleLogin,
        handleLogout,
        handleForceReauth,
        handleValidateAuth,

        // Habit operations
        handleCreateHabit,
        handleUpdateHabit,
        handleDeleteHabit,
        handleArchiveHabit,
        handleUpdateDailyHabit,

        // Utility functions
        syncInBackground,
        getTodayStats,
        getAuthStatus,
        diagnoseAuthIssues,
        attemptAutoRecovery
    };
};

export default useHabitData;