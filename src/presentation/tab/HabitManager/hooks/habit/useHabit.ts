// src/presentation/tab/HabitManager/hooks/habit/useHabit.ts

import { useState, useCallback, useRef } from 'react';
import { HabitUtils } from '../../utils/habit/HabitUtils';
import { HabitOperations } from './HabitOperations';
import type { Habit } from '../../types/habit';
import type {
    DriveSetupResult,
    SyncResult,
    UseHabitDependencies,
    UseHabitReturn
} from '../../types/drive';

export const useHabit = ({
    isAuthReady,
    getAuthStatus,
    diagnoseAuthError,
    attemptAutoRecovery
}: UseHabitDependencies): UseHabitReturn => {
    // ========== STATE ==========
    const [habitUtils, setHabitUtils] = useState<HabitUtils | null>(null);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Refs for preventing duplicate operations
    const setupPromiseRef = useRef<Promise<DriveSetupResult> | null>(null);
    const syncPromiseRef = useRef<Promise<SyncResult> | null>(null);

    // ========== INITIALIZE HABIT OPERATIONS ==========
    const habitOperations = HabitOperations({
        habitUtils,
        currentSheetId,
        habits,
        setHabits,
        setLoading,
        setError,
        isAuthReady,
        getAuthStatus,
        diagnoseAuthError,
        attemptAutoRecovery
    });

    // ========== UTILITIES ==========
    // Enhanced error handler with auth diagnosis
    const handleError = useCallback(async (error: any, operation: string): Promise<boolean> => {
        console.error(`Error in ${operation}:`, error);

        // Check if it's an auth-related error
        const isAuthError = error?.message?.includes('401') ||
            error?.message?.includes('403') ||
            error?.message?.includes('invalid_grant') ||
            error?.status === 401 ||
            error?.status === 403;

        if (isAuthError) {
            // Diagnose auth error
            const diagnostic = await diagnoseAuthError(error);

            if (!diagnostic.isHealthy) {
                const criticalIssues = diagnostic.issues.filter((i: { severity: string; }) => i.severity === 'critical');

                if (criticalIssues.length > 0) {
                    // Try auto-recovery for recoverable issues
                    const autoRecovered = await attemptAutoRecovery(diagnostic);

                    if (!autoRecovered) {
                        const errorMsg = `${operation} failed: ${diagnostic.recommendations.join(', ')}`;
                        setError(errorMsg);
                        return false;
                    }

                    // If auto-recovered, return true to indicate caller should retry
                    return true;
                }
            }
        }

        // Not auth-related error or non-critical
        const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
        setError(errorMessage);
        return false;
    }, [diagnoseAuthError, attemptAutoRecovery]);

    // ========== INITIALIZATION ==========

    // Initialize HabitUtils when auth token is available
    const initializeHabitUtils = useCallback(async (accessToken: string): Promise<HabitUtils | null> => {
        try {
            console.log('Initializing HabitUtils...');
            const utils = new HabitUtils(accessToken);
            setHabitUtils(utils);
            return utils;
        } catch (error) {
            console.error('Failed to initialize HabitUtils:', error);
            await handleError(error, 'Initialize HabitUtils');
            return null;
        }
    }, [handleError]);

    // ========== DRIVE SETUP FUNCTIONS ==========

    // Setup Google Drive folder structure and sheet file
    const setupDriveStructure = useCallback(async (forceNew: boolean = false): Promise<DriveSetupResult> => {
        if (setupPromiseRef.current && !forceNew) {
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

        const authStatus = getAuthStatus();
        if (!authStatus.hasToken) {
            return {
                success: false,
                sheetId: null,
                needsInitialSetup: false,
                error: 'No access token available'
            };
        }

        const setupPromise = (async (): Promise<DriveSetupResult> => {
            try {
                setLoading(true);
                setError(null);

                // Initialize habit utils if needed
                let utils = habitUtils;
                if (!utils) {
                    utils = await initializeHabitUtils(authStatus.user.accessToken);
                    if (!utils) {
                        throw new Error('Failed to initialize habit utils');
                    }
                }

                console.log('Setting up drive structure...');

                // Ensure folder and sheet exist
                const sheetFile = await utils.ensureSheetExists();
                setCurrentSheetId(sheetFile.id);

                console.log('Drive structure setup completed:', sheetFile.id);

                return {
                    success: true,
                    sheetId: sheetFile.id,
                    needsInitialSetup: true
                };

            } catch (error) {
                console.error('Drive setup failed:', error);

                const shouldRetry = await handleError(error, 'Setup Drive Structure');
                if (shouldRetry) {
                    // Retry once after auth recovery
                    try {
                        const utils = await initializeHabitUtils(getAuthStatus().user.accessToken);
                        if (utils) {
                            const sheetFile = await utils.ensureSheetExists();
                            setCurrentSheetId(sheetFile.id);

                            return {
                                success: true,
                                sheetId: sheetFile.id,
                                needsInitialSetup: true
                            };
                        }
                    } catch (retryError) {
                        console.error('Retry after auth recovery failed:', retryError);
                    }
                }

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

        setupPromiseRef.current = setupPromise;
        return setupPromise;
    }, [isAuthReady, getAuthStatus, habitUtils, initializeHabitUtils, handleError]);

    // ========== SYNC FUNCTIONS ==========

    // Sync habits from Google Sheets
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

        const syncPromise = (async (): Promise<SyncResult> => {
            try {
                setSyncInProgress(true);
                setError(null);

                console.log('Starting habit sync...');

                // Read habits from Google Sheets
                const sheetHabits = await habitUtils!.readAllHabits(currentSheetId!);

                // Compare with current habits and calculate changes
                const currentHabitIds = new Set(habits.map(h => h.id));
                const sheetHabitIds = new Set(sheetHabits.map(h => h.id));

                const added = sheetHabits.filter(h => !currentHabitIds.has(h.id)).length;
                const deleted = habits.filter(h => !sheetHabitIds.has(h.id)).length;
                const updated = sheetHabits.filter(h => {
                    const current = habits.find(ch => ch.id === h.id);
                    return current && JSON.stringify(current) !== JSON.stringify(h);
                }).length;

                // Update local state
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
                console.error('Habit sync failed:', error);

                const shouldRetry = await handleError(error, 'Sync Habits');
                return {
                    success: false,
                    habitsCount: habits.length,
                    lastSync: Date.now(),
                    changes: { added: 0, updated: 0, deleted: 0 },
                    error: error instanceof Error ? error.message : 'Sync failed',
                    needsAuth: shouldRetry
                };
            } finally {
                setSyncInProgress(false);
                syncPromiseRef.current = null;
            }
        })();

        syncPromiseRef.current = syncPromise;
        return syncPromise;
    }, [habitUtils, currentSheetId, habits, setupDriveStructure, handleError]);

    // ========== RETURN INTERFACE ==========

    return {
        // ===== STATE =====
        habitUtils,
        currentSheetId,
        habits,
        loading,
        error,
        syncInProgress,

        // ===== SETUP =====
        initializeHabitUtils,
        setupDriveStructure,

        // ===== CRUD OPERATIONS (from HabitOperations) =====
        createHabit: habitOperations.createHabit,
        updateHabit: habitOperations.updateHabit,
        deleteHabit: habitOperations.deleteHabit,
        archiveHabit: habitOperations.archiveHabit,
        updateDailyHabit: habitOperations.updateDailyHabit,

        // ===== SYNC OPERATIONS =====
        syncHabits,

        // ===== BATCH OPERATIONS (from HabitOperations) =====
        batchArchiveHabits: habitOperations.batchArchiveHabits,
        batchDeleteHabits: habitOperations.batchDeleteHabits,

        // ===== UTILITIES =====
        setError,
        setLoading,
        setHabits,

        // ===== COMPUTED =====
        isReady: !!habitUtils && !!currentSheetId && !loading,
        habitCount: habits.length,
        activeHabits: habits.filter(h => !h.isArchived),
        archivedHabits: habits.filter(h => h.isArchived)
    };
};