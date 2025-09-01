// src/presentation/tab/HabitManager/hooks/useHabitData.ts
// Enhanced debug version with comprehensive logging

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./auth/useAuth";
import { useHabitCache } from "./cache/useHabitCache";
import { useHabit } from "./habit/useHabit";
import { AuthErrorUtils } from "../utils/auth/AuthErrorUtils";

export interface SystemStatus {
    canProceed: boolean;
    needsAuth: boolean;
    needsReauth: boolean;
    needsPermissions: boolean;
    needsSetup: boolean;
    blockingIssues: string[];
    warnings: string[];
    isInitializing: boolean;
    authReady: boolean;
}

export interface InitializationStage {
    name: string;
    description: string;
    progress: number;
    completed: boolean;
    error: string;
    startTime?: number;
    endTime?: number;
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
        blockingIssues: [],
        warnings: [],
        isInitializing: true,
        authReady: false
    });

    const [initStages, setInitStages] = useState<InitializationStage[]>([
        { name: 'auth', description: 'Initializing authentication', progress: 0, completed: false, error: '' },
        { name: 'validation', description: 'Validating credentials', progress: 0, completed: false, error: '' },
        { name: 'permissions', description: 'Checking permissions', progress: 0, completed: false, error: '' },
        { name: 'cache', description: 'Loading cached data', progress: 0, completed: false, error: '' },
        { name: 'setup', description: 'Setting up drive structure', progress: 0, completed: false, error: '' },
        { name: 'sync', description: 'Syncing habit data', progress: 0, completed: false, error: '' },
    ]);

    const initializationRef = useRef<Promise<void> | null>(null);
    const hasInitializedRef = useRef(false);
    const diagnosticCache = useRef<any>(null);
    const maintenanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        attemptAutoRecovery,
        clearAllTimers
    } = useAuth();

    const {
        storeHabit,
        getAllHabits,
        updateHabit: updateCachedHabit,
        clearCache: clearHabitCache
    } = useHabitCache();

    const {
        currentSheetId,
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
        setError: setHabitError,
        setLoading: setHabitLoading,
        setHabits: setHabitState
    } = useHabit({
        isAuthReady,
        getAuthStatus,
        diagnoseAuthError: AuthErrorUtils.diagnoseAuthError,
        attemptAutoRecovery
    });

    console.log('🔍 useHabitData: Hook integration completed', {
        authStateLoading: authState.loading,
        authStateAuthenticated: authState.isAuthenticated,
        authStateValidating: authState.isValidating,
        isAuthReadyResult: isAuthReady(),
        authValidationStatus: authState.validationStatus,
        permissions: permissions
    });

    // ========== UTILITY FUNCTIONS ==========
    const updateInitStage = useCallback((stageName: string, updates: Partial<InitializationStage>) => {
        setInitStages(prev => prev.map(stage =>
            stage.name === stageName ? {
                ...stage,
                ...updates,
                ...(updates.completed && !stage.endTime ? { endTime: Date.now() } : {}),
                ...(updates.progress && !stage.startTime ? { startTime: Date.now() } : {})
            } : stage
        ));
    }, []);

    // Fixed analyzeSystemStatus function in useHabitData.ts

    const analyzeSystemStatus = useCallback((): SystemStatus => {
        console.log('🔍 analyzeSystemStatus: Starting analysis', {
            authStateAuth: authState.isAuthenticated,
            authStateLoading: authState.loading,
            authStateValidating: authState.isValidating,
            authStateValid: authState.validationStatus.isValid,
            permissionsAllRequired: permissions.allRequired,
            permissionsChecked: permissions.checked,
            currentSheetId: currentSheetId
        });

        const authStatus = getAuthStatus();
        const blockingIssues: string[] = [];
        const warnings: string[] = [];

        // 1. Check if we're still loading/validating
        if (authState.loading || authState.isValidating) {
            console.log('⏳ analyzeSystemStatus: Still loading/validating');
            return {
                canProceed: false,
                needsAuth: false,
                needsReauth: false,
                needsPermissions: false,
                needsSetup: false,
                blockingIssues: ['Authentication in progress'],
                warnings,
                isInitializing: true,
                authReady: false
            };
        }

        // 2. Authentication analysis
        if (!authState.isAuthenticated) {
            console.log('🚫 analyzeSystemStatus: Not authenticated');
            blockingIssues.push('User not authenticated');
            return {
                canProceed: false,
                needsAuth: true,
                needsReauth: false,
                needsPermissions: false,
                needsSetup: false,
                blockingIssues,
                warnings,
                isInitializing: false,
                authReady: false
            };
        }

        // 3. Token validation analysis - FIXED: Don't check permissions here initially
        if (!authState.user?.accessToken) {
            console.log('🚫 analyzeSystemStatus: No access token');
            blockingIssues.push('No access token available');
            return {
                canProceed: false,
                needsAuth: false,
                needsReauth: true,
                needsPermissions: false,
                needsSetup: false,
                blockingIssues,
                warnings,
                isInitializing: false,
                authReady: false
            };
        }

        // 4. CRITICAL FIX: Allow auth to be "ready" even if validation hasn't completed yet
        // This breaks the circular dependency
        const hasBasicAuth = authState.isAuthenticated &&
            authState.user?.accessToken &&
            !authState.loading &&
            !authState.isValidating;

        console.log('🔍 analyzeSystemStatus: Basic auth check', {
            hasBasicAuth,
            validationStatus: authState.validationStatus
        });

        // 5. If we have basic auth but validation hasn't been attempted or completed,
        // mark as ready to allow initialization to proceed
        if (hasBasicAuth && (!authState.validationStatus.lastCheck ||
            authState.validationStatus.lastCheck === null)) {
            console.log('✅ analyzeSystemStatus: Basic auth ready, validation pending');
            return {
                canProceed: true, // Allow initialization to proceed
                needsAuth: false,
                needsReauth: false,
                needsPermissions: false,
                needsSetup: !currentSheetId,
                blockingIssues: [],
                warnings: ['Authentication validation pending'],
                isInitializing: false,
                authReady: true // This is the key fix
            };
        }

        // 6. If validation has been attempted and failed
        if (authState.validationStatus.lastCheck && !authState.validationStatus.isValid) {
            console.log('🚫 analyzeSystemStatus: Validation attempted but failed', {
                needsReauth: authState.validationStatus.needsReauth,
                hasValidToken: authState.validationStatus.hasValidToken,
                validationErrors: authState.validationStatus.errors
            });

            if (authState.validationStatus.needsReauth || !authState.validationStatus.hasValidToken) {
                blockingIssues.push('Authentication expired - re-authentication required');
                return {
                    canProceed: false,
                    needsAuth: false,
                    needsReauth: true,
                    needsPermissions: false,
                    needsSetup: false,
                    blockingIssues,
                    warnings,
                    isInitializing: false,
                    authReady: false
                };
            }
        }

        // 7. Permission analysis - but only after we've confirmed auth is valid
        if (authState.validationStatus.isValid && permissions.checked && !permissions.allRequired) {
            console.log('🚫 analyzeSystemStatus: Auth valid but missing permissions', permissions);
            const missingPerms = [];
            if (!permissions.hasDrive) missingPerms.push('Google Drive');
            if (!permissions.hasSheets) missingPerms.push('Google Sheets');

            blockingIssues.push(`Missing required permissions: ${missingPerms.join(', ')}`);
            return {
                canProceed: false,
                needsAuth: false,
                needsReauth: false,
                needsPermissions: true,
                needsSetup: false,
                blockingIssues,
                warnings,
                isInitializing: false,
                authReady: true // Auth itself is ready, just missing permissions
            };
        }

        // 8. Setup analysis
        const needsSetup = !currentSheetId;
        if (needsSetup) {
            console.log('⚠️ analyzeSystemStatus: Needs setup', { currentSheetId });
            warnings.push('Drive structure setup required');
        }

        // 9. Warning analysis
        if (authState.validationStatus.errors.length > 0) {
            warnings.push(...authState.validationStatus.errors);
        }

        if (permissions.checked && !permissions.hasCalendar) {
            warnings.push('Calendar integration not available');
        }

        // 10. Final determination
        const canProceed = blockingIssues.length === 0;
        const authReady = hasBasicAuth && (
            !authState.validationStatus.lastCheck || // validation not attempted yet
            authState.validationStatus.isValid       // or validation passed
        );

        const result = {
            canProceed,
            needsAuth: false,
            needsReauth: false,
            needsPermissions: false,
            needsSetup,
            blockingIssues,
            warnings,
            isInitializing: false,
            authReady
        };

        console.log('✅ analyzeSystemStatus: Analysis complete', result);
        return result;
    }, [
        getAuthStatus,
        permissions,
        currentSheetId,
        authState.isAuthenticated,
        authState.loading,
        authState.isValidating,
        authState.user?.accessToken,
        authState.validationStatus
    ]);

    const runDiagnostics = useCallback(async (error?: any) => {
        try {
            const diagnostic = await diagnoseAuthIssues(error);
            diagnosticCache.current = diagnostic;
            return diagnostic;
        } catch (diagError) {
            console.error('Failed to run diagnostics:', diagError);
            return null;
        }
    }, [diagnoseAuthIssues]);

    // ========== CLEANUP FUNCTIONS ==========
    const clearAllIntervals = useCallback(() => {
        if (maintenanceIntervalRef.current) {
            clearInterval(maintenanceIntervalRef.current);
            maintenanceIntervalRef.current = null;
        }
    }, []);

    const resetInitializationState = useCallback(() => {
        if (initializationRef.current) {
            initializationRef.current = null;
        }
        hasInitializedRef.current = false;
        setInitialized(false);
        diagnosticCache.current = null;
    }, []);

    // ========== INITIALIZATION ==========
    const progressiveInitialize = useCallback(async () => {
        console.log('🚀 progressiveInitialize: Starting...', {
            hasInitializationRef: !!initializationRef.current,
            hasInitialized: hasInitializedRef.current
        });

        if (initializationRef.current) {
            console.log('🔄 progressiveInitialize: Already in progress, returning existing promise');
            return initializationRef.current;
        }

        if (hasInitializedRef.current) {
            console.log('✅ progressiveInitialize: Already initialized, returning');
            return;
        }

        console.log('🏁 progressiveInitialize: Creating new initialization promise...');

        initializationRef.current = (async () => {
            try {
                console.log('📊 progressiveInitialize: Setting initializing state...');
                setSystemStatus(prev => ({ ...prev, isInitializing: true }));

                // Stage 1: Authentication
                console.log('🔐 progressiveInitialize: Stage 1 - Authentication');
                updateInitStage('auth', { progress: 10 });
                const authStatus = getAuthStatus();

                console.log('🔍 progressiveInitialize: Auth status check', {
                    isAuthenticated: authStatus.isAuthenticated,
                    isValid: authStatus.isValid,
                    hasToken: authStatus.hasToken
                });

                if (!authStatus.isAuthenticated) {
                    console.error('❌ progressiveInitialize: Authentication required');
                    throw new Error('Authentication required - user needs to sign in');
                }

                updateInitStage('auth', { progress: 100, completed: true });

                // Stage 2: Validation
                console.log('✅ progressiveInitialize: Stage 2 - Validation');
                updateInitStage('validation', { progress: 10 });

                if (!authStatus.isValid) {
                    console.log('⚠️ progressiveInitialize: Auth not valid, running diagnostics...');
                    const diagnostic = await runDiagnostics();

                    console.log('🔍 progressiveInitialize: Diagnostic result', diagnostic);

                    if (diagnostic?.canAutoRecover) {
                        console.log('🔧 progressiveInitialize: Attempting auto-recovery...');
                        const recovered = await attemptAutoRecovery(diagnostic);
                        if (!recovered) {
                            console.error('❌ progressiveInitialize: Auto-recovery failed');
                            throw new Error('Authentication validation failed and auto-recovery unsuccessful');
                        }
                        console.log('✅ progressiveInitialize: Auto-recovery successful');
                    } else {
                        console.error('❌ progressiveInitialize: Manual intervention required');
                        throw new Error('Authentication validation failed - manual intervention required');
                    }
                }

                updateInitStage('validation', { progress: 100, completed: true });

                // Stage 3: Permissions Check
                console.log('🔑 progressiveInitialize: Stage 3 - Permissions');
                updateInitStage('permissions', { progress: 10 });

                console.log('🔍 progressiveInitialize: Checking permissions', permissions);

                if (!permissions.allRequired) {
                    console.error('❌ progressiveInitialize: Required permissions not available', permissions);
                    throw new Error('Required permissions not available');
                }

                updateInitStage('permissions', { progress: 100, completed: true });

                // Stage 4: Load Cache
                console.log('💾 progressiveInitialize: Stage 4 - Cache loading');
                updateInitStage('cache', { progress: 10 });

                try {
                    const cachedHabits = await getAllHabits();
                    console.log('📦 progressiveInitialize: Cache loading result', { count: cachedHabits.length });
                    if (cachedHabits.length > 0) {
                        setHabitState(cachedHabits);
                        console.log(`✅ progressiveInitialize: Loaded ${cachedHabits.length} habits from cache`);
                    }
                } catch (cacheError) {
                    console.warn('⚠️ progressiveInitialize: Cache loading failed:', cacheError);
                    // Not critical, continue
                }

                updateInitStage('cache', { progress: 100, completed: true });

                // Stage 5: Drive Setup
                console.log('🔧 progressiveInitialize: Stage 5 - Drive setup');
                updateInitStage('setup', { progress: 10 });

                const setupResult = await setupDriveStructure();
                console.log('🔍 progressiveInitialize: Setup result', setupResult);

                if (!setupResult.success) {
                    if (setupResult.needsAuth) {
                        console.error('❌ progressiveInitialize: Drive setup failed - Auth issue');
                        throw new Error('Drive setup failed: Authentication issue');
                    }
                    console.error('❌ progressiveInitialize: Drive setup failed', setupResult.error);
                    throw new Error(setupResult.error || 'Drive structure setup failed');
                }

                updateInitStage('setup', { progress: 100, completed: true });

                // Stage 6: Initial Sync
                console.log('🔄 progressiveInitialize: Stage 6 - Initial sync');
                updateInitStage('sync', { progress: 10 });

                const syncResult = await syncHabits(true);
                console.log('🔍 progressiveInitialize: Sync result', syncResult);

                if (!syncResult.success) {
                    if (syncResult.needsAuth) {
                        console.error('❌ progressiveInitialize: Sync failed - Auth issue');
                        throw new Error('Initial sync failed: Authentication issue');
                    }
                    // Sync failure is not critical if we have cached data
                    if (habits.length === 0) {
                        console.error('❌ progressiveInitialize: Sync failed and no cached data');
                        throw new Error(syncResult.error || 'Initial sync failed and no cached data available');
                    } else {
                        console.warn('⚠️ progressiveInitialize: Sync failed but cached data available:', syncResult.error);
                    }
                } else {
                    console.log(`✅ progressiveInitialize: Initial sync completed: ${syncResult.habitsCount || 0} habits`);
                }

                updateInitStage('sync', { progress: 100, completed: true });

                // Mark as successfully initialized
                console.log('🎉 progressiveInitialize: Marking as initialized');
                setInitialized(true);
                hasInitializedRef.current = true;

                console.log('✅ progressiveInitialize: Progressive initialization completed successfully');

            } catch (error) {
                console.error('❌ progressiveInitialize: Progressive initialization failed:', error);
                const errorMessage = error instanceof Error ? error.message : 'Initialization failed';

                // Find the failed stage and mark it
                const failedStage = initStages.find(stage => !stage.completed);
                if (failedStage) {
                    console.log('🚨 progressiveInitialize: Marking failed stage:', failedStage.name);
                    updateInitStage(failedStage.name, {
                        error: errorMessage,
                        progress: 0
                    });
                }

                setHabitError(errorMessage);

                // Run diagnostics on failure
                await runDiagnostics(error);

            } finally {
                console.log('🏁 progressiveInitialize: Setting not initializing');
                setSystemStatus(prev => ({ ...prev, isInitializing: false }));
                initializationRef.current = null;
            }
        })();

        return initializationRef.current;
    }, [
        getAuthStatus,
        permissions,
        habits,
        initStages,
        getAllHabits,
        setHabitState,
        setupDriveStructure,
        syncHabits,
        updateInitStage,
        runDiagnostics,
        attemptAutoRecovery,
        setHabitError
    ]);

    // ========== HABIT OPERATIONS ==========
    const createHabitWithErrorHandling = useCallback(async (formData: any): Promise<HabitOperationResult> => {
        try {
            setHabitLoading(true);
            const result = await createHabitOperation(formData);

            if (result.success && result.data) {
                // Cache the new habit
                try {
                    await storeHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to cache new habit:', cacheError);
                    // Don't fail the operation for cache issues
                }
                return { success: true, data: result.data };
            }

            if (result.needsAuth) {
                const diagnostic = await runDiagnostics();
                return {
                    success: false,
                    error: result.error,
                    needsAuth: true,
                    needsPermissions: diagnostic?.needsUserAction && diagnostic.issues.some(i => i.type === 'insufficient_scope')
                };
            }

            return {
                success: false,
                error: result.error || 'Failed to create habit'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Create habit failed';
            console.error('Create habit operation failed:', error);

            const diagnostic = await runDiagnostics(error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: diagnostic?.issues.some(i => ['no_auth', 'invalid_token', 'token_expired'].includes(i.type)),
                needsPermissions: diagnostic?.issues.some(i => i.type === 'insufficient_scope')
            };
        } finally {
            setHabitLoading(false);
        }
    }, [createHabitOperation, storeHabit, setHabitLoading, runDiagnostics]);

    const updateHabitWithErrorHandling = useCallback(async (habit: any): Promise<HabitOperationResult> => {
        try {
            setHabitLoading(true);
            const result = await updateHabitOperation(habit);

            if (result.success && result.data) {
                try {
                    await updateCachedHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to update cached habit:', cacheError);
                }
                return { success: true, data: result.data };
            }

            if (result.needsAuth) {
                const diagnostic = await runDiagnostics();
                return {
                    success: false,
                    error: result.error,
                    needsAuth: true,
                    needsPermissions: diagnostic?.needsUserAction && diagnostic.issues.some(i => i.type === 'insufficient_scope')
                };
            }

            return {
                success: false,
                error: result.error || 'Failed to update habit'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Update habit failed';
            console.error('Update habit operation failed:', error);

            const diagnostic = await runDiagnostics(error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: diagnostic?.issues.some(i => ['no_auth', 'invalid_token', 'token_expired'].includes(i.type)),
                needsPermissions: diagnostic?.issues.some(i => i.type === 'insufficient_scope')
            };
        } finally {
            setHabitLoading(false);
        }
    }, [updateHabitOperation, updateCachedHabit, setHabitLoading, runDiagnostics]);

    const deleteHabitWithErrorHandling = useCallback(async (habitId: string): Promise<HabitOperationResult> => {
        try {
            setHabitLoading(true);
            const result = await deleteHabitOperation(habitId);

            if (result.needsAuth) {
                const diagnostic = await runDiagnostics();
                return {
                    success: false,
                    error: result.error,
                    needsAuth: true,
                    needsPermissions: diagnostic?.needsUserAction && diagnostic.issues.some(i => i.type === 'insufficient_scope')
                };
            }

            return {
                success: result.success,
                error: result.error
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Delete habit failed';
            console.error('Delete habit operation failed:', error);

            const diagnostic = await runDiagnostics(error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: diagnostic?.issues.some(i => ['no_auth', 'invalid_token', 'token_expired'].includes(i.type)),
                needsPermissions: diagnostic?.issues.some(i => i.type === 'insufficient_scope')
            };
        } finally {
            setHabitLoading(false);
        }
    }, [deleteHabitOperation, setHabitLoading, runDiagnostics]);

    const archiveHabitWithErrorHandling = useCallback(async (habitId: string, archive: boolean): Promise<HabitOperationResult> => {
        try {
            setHabitLoading(true);
            const result = await archiveHabitOperation(habitId, archive);

            if (result.success && result.data) {
                try {
                    await updateCachedHabit(result.data);
                } catch (cacheError) {
                    console.warn('Failed to update cached habit after archive:', cacheError);
                }
                return { success: true, data: result.data };
            }

            if (result.needsAuth) {
                const diagnostic = await runDiagnostics();
                return {
                    success: false,
                    error: result.error,
                    needsAuth: true,
                    needsPermissions: diagnostic?.needsUserAction && diagnostic.issues.some(i => i.type === 'insufficient_scope')
                };
            }

            return {
                success: false,
                error: result.error || 'Failed to archive habit'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Archive habit failed';
            console.error('Archive habit operation failed:', error);

            const diagnostic = await runDiagnostics(error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: diagnostic?.issues.some(i => ['no_auth', 'invalid_token', 'token_expired'].includes(i.type)),
                needsPermissions: diagnostic?.issues.some(i => i.type === 'insufficient_scope')
            };
        } finally {
            setHabitLoading(false);
        }
    }, [archiveHabitOperation, updateCachedHabit, setHabitLoading, runDiagnostics]);

    const updateDailyHabitWithErrorHandling = useCallback(async (habitId: string, day: number, value: number): Promise<HabitOperationResult> => {
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

            if (result.needsAuth) {
                const diagnostic = await runDiagnostics();
                return {
                    success: false,
                    error: result.error,
                    needsAuth: true,
                    needsPermissions: diagnostic?.needsUserAction && diagnostic.issues.some(i => i.type === 'insufficient_scope')
                };
            }

            return {
                success: false,
                error: result.error || 'Failed to update daily habit'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Update daily habit failed';
            console.error('Update daily habit operation failed:', error);

            const diagnostic = await runDiagnostics(error);

            return {
                success: false,
                error: errorMessage,
                needsAuth: diagnostic?.issues.some(i => ['no_auth', 'invalid_token', 'token_expired'].includes(i.type)),
                needsPermissions: diagnostic?.issues.some(i => i.type === 'insufficient_scope')
            };
        }
    }, [updateDailyHabitOperation, updateCachedHabit, runDiagnostics]);

    // ========== BACKGROUND OPERATIONS ==========
    const syncInBackground = useCallback(async (): Promise<void> => {
        if (!initialized || !isAuthReady() || syncInProgress) {
            return;
        }

        try {
            console.log('Starting background sync...');
            const result = await syncHabits(false);

            if (result.success) {
                console.log(`Background sync completed: ${result.habitsCount || 0} habits synced`);
            } else if (result.needsAuth) {
                console.warn('Background sync failed due to auth issues:', result.error);
                await runDiagnostics();
            } else {
                console.warn('Background sync failed:', result.error);
            }
        } catch (error) {
            console.warn('Background sync encountered an error:', error);
        }
    }, [initialized, isAuthReady, syncInProgress, syncHabits, runDiagnostics]);

    const performSystemMaintenance = useCallback(async (): Promise<void> => {
        try {
            // Clear expired caches
            if (typeof (AuthErrorUtils as any).clearExpiredCache === 'function') {
                (AuthErrorUtils as any).clearExpiredCache();
            }

            // Validate current auth status
            await handleValidateAuth();

            // Perform background sync if conditions are met
            await syncInBackground();

        } catch (error) {
            console.warn('System maintenance encountered issues:', error);
        }
    }, [handleValidateAuth, syncInBackground]);

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
            completionRate: 0
        });
    }, [habits]);

    const getInitializationProgress = useCallback(() => {
        const completedStages = initStages.filter(stage => stage.completed).length;
        const totalStages = initStages.length;
        const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

        const currentStage = initStages.find(stage => !stage.completed && stage.progress > 0);
        const failedStages = initStages.filter(stage => stage.error);

        return {
            overallProgress,
            completedStages,
            totalStages,
            currentStage: currentStage?.name,
            failedStages: failedStages.map(s => s.name),
            isComplete: completedStages === totalStages,
            hasErrors: failedStages.length > 0
        };
    }, [initStages]);

    // ========== RESET FUNCTIONS ==========
    const retryInitialization = useCallback(() => {
        resetInitializationState();
        progressiveInitialize();
    }, [resetInitializationState, progressiveInitialize]);

    const resetSystem = useCallback(async () => {
        console.log('Performing system reset...');

        // Clear all timers and intervals
        clearAllTimers();
        clearAllIntervals();

        // Reset initialization state
        resetInitializationState();

        // Reset all stages
        setInitStages(stages => stages.map(stage => ({
            ...stage,
            progress: 0,
            completed: false,
            error: '',
            startTime: undefined,
            endTime: undefined
        })));

        // Clear caches
        await clearHabitCache();

        // Restart initialization
        setTimeout(() => {
            progressiveInitialize();
        }, 1000);
    }, [clearAllTimers, clearAllIntervals, resetInitializationState, clearHabitCache, progressiveInitialize]);

    // ========== EFFECTS ==========
    useEffect(() => {
        console.log('🔄 useHabitData: Main effect triggered', {
            authStateAuth: authState.isAuthenticated,
            authStateLoading: authState.loading,
            authStateValidating: authState.isValidating,
            hasAccessToken: !!authState.user?.accessToken,
            permissionsAllRequired: permissions.allRequired,
            currentSheetId: currentSheetId,
            initialized: initialized,
            hasInitializedRef: hasInitializedRef.current
        });

        const status = analyzeSystemStatus();
        setSystemStatus(status);

        console.log('🔍 useHabitData: System status updated', status);

        // FIXED: Start initialization when we have basic auth ready, not when everything is perfect
        const shouldInitialize = status.authReady &&
            !initialized &&
            !hasInitializedRef.current &&
            !authState.loading &&
            !authState.isValidating &&
            !status.needsAuth &&
            !status.needsReauth;

        if (shouldInitialize) {
            console.log('🚀 useHabitData: Conditions met, starting initialization...');
            progressiveInitialize();
        } else {
            console.log('⏳ useHabitData: Initialization conditions not met', {
                authReady: status.authReady,
                initialized: initialized,
                hasInitialized: hasInitializedRef.current,
                loading: authState.loading,
                validating: authState.isValidating,
                needsAuth: status.needsAuth,
                needsReauth: status.needsReauth,
                shouldInitialize
            });
        }
    }, [
        authState.isAuthenticated,
        authState.loading,
        authState.isValidating,
        authState.user?.accessToken,
        permissions,
        currentSheetId,
        initialized,
        analyzeSystemStatus,
        progressiveInitialize
    ]);

    // Periodic maintenance
    useEffect(() => {
        if (!initialized) return;

        maintenanceIntervalRef.current = setInterval(() => {
            performSystemMaintenance();
        }, 10 * 60 * 1000); // Every 10 minutes

        return () => {
            if (maintenanceIntervalRef.current) {
                clearInterval(maintenanceIntervalRef.current);
                maintenanceIntervalRef.current = null;
            }
        };
    }, [initialized, performSystemMaintenance]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
            clearAllIntervals();
            resetInitializationState();
        };
    }, [clearAllTimers, clearAllIntervals, resetInitializationState]);

    console.log('🔍 useHabitData: Final render state', {
        initialized,
        systemStatusCanProceed: systemStatus.canProceed,
        systemStatusInitializing: systemStatus.isInitializing,
        habitLoading: habitLoading,
        authStateLoading: authState.loading,
        needsAuth: systemStatus.needsAuth,
        needsReauth: systemStatus.needsReauth,
        needsPermissions: systemStatus.needsPermissions,
        blockingIssues: systemStatus.blockingIssues
    });

    // ========== RETURN INTERFACE ==========
    return {
        // ========== STATE ==========
        authState,
        habits,
        loading: habitLoading || authState.loading,
        error: habitError || authState.error,
        initialized,
        systemStatus,
        initStages,
        syncInProgress,
        permissions,

        // ========== STATUS ==========
        isAuthReady: isAuthReady(),
        canProceed: systemStatus.canProceed,
        needsAuth: systemStatus.needsAuth,
        needsReauth: systemStatus.needsReauth,
        needsPermissions: systemStatus.needsPermissions,
        needsSetup: systemStatus.needsSetup,

        // ========== AUTH ACTIONS ==========
        handleLogin,
        handleLogout,
        handleForceReauth,
        handleValidateAuth,

        // ========== HABIT OPERATIONS ==========
        createHabit: createHabitWithErrorHandling,
        updateHabit: updateHabitWithErrorHandling,
        deleteHabit: deleteHabitWithErrorHandling,
        archiveHabit: archiveHabitWithErrorHandling,
        updateDailyHabit: updateDailyHabitWithErrorHandling,

        // ========== UTILITY ACTIONS ==========
        syncInBackground,
        performSystemMaintenance,
        runDiagnostics,
        clearCache: clearHabitCache,

        // ========== COMPUTED VALUES ==========
        getTodayStats,
        getInitializationProgress,
        getAuthStatus,
        getDiagnostics: () => diagnosticCache.current,

        // ========== MAINTENANCE ==========
        retryInitialization,
        resetSystem
    };
};

export default useHabitData;