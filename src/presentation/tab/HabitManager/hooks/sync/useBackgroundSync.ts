import { useEffect, useCallback, useRef, useState } from 'react';
import { BackgroundOperationsManager, BackgroundCheckResult } from '../../utils/background/BackgroundOperationsManager';

interface UseBackgroundSyncParams {
    initialized: boolean;
    syncData: (forceSync?: boolean) => Promise<any>;
}

interface BackgroundSyncState {
    isActive: boolean;
    lastCheck: number | null;
    lastSyncAttempt: number | null;
    checkInterval: number;
    backgroundStatus: BackgroundCheckResult | null;
    errors: string[];
}

export const useBackgroundSync = ({
    initialized,
    syncData
}: UseBackgroundSyncParams) => {

    const [backgroundSyncState, setBackgroundSyncState] = useState<BackgroundSyncState>({
        isActive: false,
        lastCheck: null,
        lastSyncAttempt: null,
        checkInterval: 5 * 60 * 1000, // 5 minutes default
        backgroundStatus: null,
        errors: []
    });

    const backgroundManager = BackgroundOperationsManager.getInstance();
    const schedulerRef = useRef<{
        intervalId: NodeJS.Timeout | null;
        syncTimeoutId: NodeJS.Timeout | null;
        checkTimeoutId: NodeJS.Timeout | null;
    }>({
        intervalId: null,
        syncTimeoutId: null,
        checkTimeoutId: null
    });

    const visibilityStateRef = useRef<'visible' | 'hidden'>('visible');
    const lastSyncResultRef = useRef<{
        success: boolean;
        timestamp: number;
        consecutiveFailures: number;
    }>({
        success: true,
        timestamp: 0,
        consecutiveFailures: 0
    });

    // Store current initialized state and syncData in refs to avoid dependency issues
    const initializedRef = useRef(initialized);
    const syncDataRef = useRef(syncData);

    // Update refs when props change
    useEffect(() => {
        initializedRef.current = initialized;
    }, [initialized]);

    useEffect(() => {
        syncDataRef.current = syncData;
    }, [syncData]);

    // Configuration constants based on requirements
    const INTERVALS = {
        ACTIVE: 5 * 60 * 1000,       // 5 minutes when active
        BACKGROUND: 15 * 60 * 1000,   // 15 minutes when in background
        IDLE: 30 * 60 * 1000,        // 30 minutes when idle
        QUICK_CHECK: 2 * 60 * 1000,   // 2 minutes for quick checks
        RETRY_BASE: 2000,            // 2 seconds base retry delay
        MAX_RETRIES: 3
    } as const;

    // Get appropriate interval based on app state
    const getCurrentInterval = useCallback((): number => {
        const { consecutiveFailures } = lastSyncResultRef.current;

        // Increase interval after failures
        if (consecutiveFailures > 2) {
            return INTERVALS.IDLE;
        }

        if (visibilityStateRef.current === 'hidden') {
            return INTERVALS.BACKGROUND;
        }

        return INTERVALS.ACTIVE;
    }, []);

    // Trigger data refresh from sheets
    const triggerDataRefresh = useCallback(async (): Promise<void> => {
        try {
            console.log('🔄 Triggering data refresh...');

            setBackgroundSyncState(prev => ({
                ...prev,
                lastSyncAttempt: Date.now()
            }));

            const syncResult = await syncDataRef.current(true); // Force sync

            lastSyncResultRef.current = {
                success: !!syncResult,
                timestamp: Date.now(),
                consecutiveFailures: syncResult ? 0 : lastSyncResultRef.current.consecutiveFailures + 1
            };

            console.log('✅ Data refresh completed');

        } catch (error) {
            console.error('Data refresh failed:', error);

            lastSyncResultRef.current.consecutiveFailures += 1;

            setBackgroundSyncState(prev => ({
                ...prev,
                errors: [...prev.errors, `Data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }));
        }
    }, []); // No dependencies - using ref

    // Attempt automatic system repair
    const attemptSystemRepair = useCallback(async (): Promise<boolean> => {
        try {
            console.log('🔧 Attempting system auto-repair...');

            const repairResult = await backgroundManager.autoRepairSystem();

            if (repairResult.success) {
                console.log('✅ System repair successful:', repairResult.repaired);

                // Refresh data after successful repair
                await triggerDataRefresh();
                return true;

            } else if (repairResult.needsUserAction) {
                console.log('👤 System repair requires user action');

                setBackgroundSyncState(prev => ({
                    ...prev,
                    errors: [...prev.errors, 'System repair requires user authentication']
                }));

                return false;
            } else {
                console.log('❌ System repair failed:', repairResult.errors);
                return false;
            }

        } catch (error) {
            console.error('System repair attempt failed:', error);
            return false;
        }
    }, [backgroundManager, triggerDataRefresh]);

    // Enhanced background check following the specified sequence
    const performBackgroundCheck = useCallback(async (): Promise<BackgroundCheckResult | null> => {
        try {
            console.log('Performing comprehensive background check...');

            const checkResult = await backgroundManager.performBackgroundCheck();

            setBackgroundSyncState(prev => ({
                ...prev,
                lastCheck: Date.now(),
                backgroundStatus: checkResult,
                errors: checkResult.needsFullSetup ?
                    backgroundManager['getStatusErrors'](checkResult) : []
            }));

            // Handle different scenarios based on check result
            if (checkResult.hasCache && !checkResult.needsFullSetup) {
                // Scenario: Cache available + system healthy
                console.log('✅ System healthy with cache - minimal background activity');
                return checkResult;

            } else if (checkResult.hasCache && checkResult.needsFullSetup) {
                // Scenario: Cache available but system issues
                console.log('⚠️ Cache available but system has issues - attempting repair');
                await attemptSystemRepair();
                return checkResult;

            } else if (!checkResult.hasCache && !checkResult.needsFullSetup) {
                // Scenario: No cache but system healthy - refresh data
                console.log('📥 No cache but system healthy - refreshing data');
                await triggerDataRefresh();
                return checkResult;

            } else {
                // Scenario: No cache + system issues - full setup needed
                console.log('❌ No cache and system issues - full setup required');
                return checkResult;
            }

        } catch (error) {
            console.error('Background check failed:', error);

            setBackgroundSyncState(prev => ({
                ...prev,
                errors: [...prev.errors, `Background check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }));

            return null;
        }
    }, [backgroundManager, attemptSystemRepair, triggerDataRefresh]);

    // Main background sync operation
    const performBackgroundSync = useCallback(async (): Promise<void> => {
        if (!initializedRef.current) {
            console.log('System not initialized, skipping background sync');
            return;
        }

        const now = Date.now();
        const timeSinceLastAttempt = backgroundSyncState.lastSyncAttempt ?
            now - backgroundSyncState.lastSyncAttempt : Infinity;
        const currentInterval = getCurrentInterval();

        // Prevent too frequent sync attempts
        if (timeSinceLastAttempt < currentInterval) {
            console.log(`Background sync skipped - too soon (${Math.round(timeSinceLastAttempt / 1000)}s < ${Math.round(currentInterval / 1000)}s)`);
            return;
        }

        try {
            // Perform the background check sequence
            const checkResult = await performBackgroundCheck();

            if (!checkResult || checkResult.needsAuth) {
                console.log('Background sync requires authentication - stopping');
                return;
            }

            // Only proceed with data sync if cache needs refresh
            if (!checkResult.hasCache || checkResult.needsFullSetup) {
                console.log('Background sync: Proceeding with data refresh');
                await triggerDataRefresh();
            } else {
                console.log('Background sync: Cache is valid, skipping data refresh');
            }

        } catch (error) {
            console.error('Background sync failed:', error);

            lastSyncResultRef.current.consecutiveFailures += 1;

            setBackgroundSyncState(prev => ({
                ...prev,
                errors: [...prev.errors, `Background sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            }));
        }
    }, [backgroundSyncState.lastSyncAttempt, getCurrentInterval, performBackgroundCheck, triggerDataRefresh]);

    // Stop background sync scheduler - stable function
    const stopBackgroundSync = useCallback((): void => {
        console.log('Stopping background sync scheduler');

        if (schedulerRef.current.intervalId) {
            clearInterval(schedulerRef.current.intervalId);
            schedulerRef.current.intervalId = null;
        }

        if (schedulerRef.current.syncTimeoutId) {
            clearTimeout(schedulerRef.current.syncTimeoutId);
            schedulerRef.current.syncTimeoutId = null;
        }

        if (schedulerRef.current.checkTimeoutId) {
            clearTimeout(schedulerRef.current.checkTimeoutId);
            schedulerRef.current.checkTimeoutId = null;
        }

        setBackgroundSyncState(prev => ({ ...prev, isActive: false }));
    }, []); // No dependencies

    // Start background sync scheduler - stable function
    const startBackgroundSync = useCallback((): void => {
        if (backgroundSyncState.isActive) {
            console.log('Background sync already active');
            return;
        }

        if (!initializedRef.current) {
            console.log('Cannot start background sync - system not initialized');
            return;
        }

        console.log('Starting background sync scheduler');

        const interval = getCurrentInterval();

        schedulerRef.current.intervalId = setInterval(() => {
            performBackgroundSync();
        }, interval);

        setBackgroundSyncState(prev => ({ ...prev, isActive: true, checkInterval: interval }));

        // Perform initial check after a short delay
        schedulerRef.current.checkTimeoutId = setTimeout(() => {
            if (initializedRef.current) {
                performBackgroundSync();
            }
        }, 3000); // 3 second delay for initial check

    }, [backgroundSyncState.isActive, getCurrentInterval, performBackgroundSync]); // Minimal stable dependencies

    // Restart background sync with new interval
    const restartBackgroundSync = useCallback((): void => {
        console.log('Restarting background sync with updated interval');
        stopBackgroundSync();

        // Small delay before restart to ensure cleanup
        setTimeout(() => {
            startBackgroundSync();
        }, 100);
    }, [startBackgroundSync, stopBackgroundSync]);

    // Handle visibility change events - stable function
    const handleVisibilityChange = useCallback((): void => {
        const newVisibilityState = document.hidden ? 'hidden' : 'visible';
        const previousState = visibilityStateRef.current;

        visibilityStateRef.current = newVisibilityState;

        console.log(`App visibility changed: ${previousState} -> ${newVisibilityState}`);

        if (newVisibilityState === 'visible' && previousState === 'hidden') {
            // App became visible - perform immediate check and restart scheduler
            console.log('App became visible, triggering immediate background check');

            if (initializedRef.current && backgroundSyncState.isActive) {
                performBackgroundCheck().then((result) => {
                    if (result && !result.hasCache) {
                        // If no cache when app becomes visible, refresh immediately
                        triggerDataRefresh();
                    }
                });
            }

            restartBackgroundSync();

        } else if (newVisibilityState === 'hidden') {
            // App went to background - restart with longer interval
            console.log('App went to background, adjusting sync interval');
            restartBackgroundSync();
        }
    }, [backgroundSyncState.isActive, performBackgroundCheck, triggerDataRefresh, restartBackgroundSync]);

    // Handle focus events for additional sync triggers - stable function
    const handleFocus = useCallback((): void => {
        if (initializedRef.current && backgroundSyncState.isActive) {
            const timeSinceLastCheck = backgroundSyncState.lastCheck ?
                Date.now() - backgroundSyncState.lastCheck : Infinity;

            // If it's been a while since last check, trigger one
            if (timeSinceLastCheck > INTERVALS.ACTIVE) {
                console.log('App focused after long period, triggering background check');
                performBackgroundCheck();
            }
        }
    }, [backgroundSyncState.isActive, backgroundSyncState.lastCheck, performBackgroundCheck]);

    // Handle network connectivity changes - stable functions
    const handleOnline = useCallback((): void => {
        if (initializedRef.current && navigator.onLine) {
            console.log('Network connection restored, triggering background sync');
            performBackgroundSync();
        }
    }, [performBackgroundSync]);

    const handleOffline = useCallback((): void => {
        console.log('Network connection lost');
        setBackgroundSyncState(prev => ({
            ...prev,
            errors: [...prev.errors, 'Network connection lost']
        }));
    }, []);

    // Manual trigger for background operations
    const triggerBackgroundCheck = useCallback(async (): Promise<BackgroundCheckResult | null> => {
        if (!initializedRef.current) {
            console.warn('Cannot trigger background check - system not initialized');
            return null;
        }

        console.log('Manually triggering background check');
        return await performBackgroundCheck();
    }, [performBackgroundCheck]);

    // Clear accumulated errors
    const clearBackgroundErrors = useCallback((): void => {
        setBackgroundSyncState(prev => ({ ...prev, errors: [] }));
    }, []);

    // Get detailed background sync status
    const getBackgroundSyncStatus = useCallback(() => {
        return {
            isActive: backgroundSyncState.isActive,
            lastCheck: backgroundSyncState.lastCheck,
            lastSyncAttempt: backgroundSyncState.lastSyncAttempt,
            currentInterval: backgroundSyncState.checkInterval,
            backgroundStatus: backgroundSyncState.backgroundStatus,
            errors: backgroundSyncState.errors,
            visibilityState: visibilityStateRef.current,
            consecutiveFailures: lastSyncResultRef.current.consecutiveFailures,
            lastSyncSuccess: lastSyncResultRef.current.success,
            canSync: initializedRef.current && backgroundSyncState.backgroundStatus?.isAuthValid === true
        };
    }, [backgroundSyncState]);

    // Setup effect for initialization and cleanup - FIXED
    useEffect(() => {
        if (initialized) {
            console.log('Setting up enhanced background sync system...');

            // Start the background sync scheduler
            startBackgroundSync();

            // Setup event listeners
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleFocus);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Check initial network state
            if (!navigator.onLine) {
                console.log('App started offline');
                setBackgroundSyncState(prev => ({
                    ...prev,
                    errors: ['App started offline']
                }));
            }

            return () => {
                console.log('Cleaning up background sync system...');

                // Cleanup scheduler
                stopBackgroundSync();

                // Remove event listeners
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [initialized]); // ONLY depend on initialized - all functions are now stable

    // Effect for handling initialization state changes
    useEffect(() => {
        if (!initialized && backgroundSyncState.isActive) {
            console.log('System uninitialized, stopping background sync');
            stopBackgroundSync();
        }
    }, [initialized, backgroundSyncState.isActive, stopBackgroundSync]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const { intervalId, syncTimeoutId, checkTimeoutId } = schedulerRef.current;

            if (intervalId) clearInterval(intervalId);
            if (syncTimeoutId) clearTimeout(syncTimeoutId);
            if (checkTimeoutId) clearTimeout(checkTimeoutId);
        };
    }, []);

    return {
        // Status
        backgroundSyncState,
        getBackgroundSyncStatus,

        // Controls
        startBackgroundSync,
        stopBackgroundSync,
        restartBackgroundSync,
        triggerBackgroundCheck,
        clearBackgroundErrors,

        // Manual operations
        performBackgroundCheck,
        triggerDataRefresh,
        attemptSystemRepair
    };
};