import { useEffect, useCallback, useRef } from 'react';

interface UseBackgroundSyncParams {
    initialized: boolean;
    syncData: (forceSync?: boolean) => Promise<any>;
}

interface SyncScheduler {
    intervalId: NodeJS.Timeout | null;
    isActive: boolean;
    lastSyncAttempt: number;
}

export const useBackgroundSync = ({
    initialized,
    syncData
}: UseBackgroundSyncParams) => {
    const schedulerRef = useRef<SyncScheduler>({
        intervalId: null,
        isActive: false,
        lastSyncAttempt: 0
    });

    const visibilityStateRef = useRef<'visible' | 'hidden'>('visible');
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Configuration constants
    const SYNC_INTERVALS = {
        ACTIVE: 5 * 60 * 1000,      // 5 minutes when active
        IDLE: 15 * 60 * 1000,       // 15 minutes when idle
        BACKGROUND: 30 * 60 * 1000  // 30 minutes when in background
    } as const;

    const MAX_RETRY_ATTEMPTS = 3;
    const RETRY_DELAY_BASE = 2000; // 2 seconds base delay

    // Get current sync interval based on app state
    const getCurrentSyncInterval = useCallback((): number => {
        if (visibilityStateRef.current === 'hidden') {
            return SYNC_INTERVALS.BACKGROUND;
        }

        // Could be extended to detect user activity/idle state
        return SYNC_INTERVALS.ACTIVE;
    }, []);

    // Perform background sync with error handling
    const performBackgroundSync = useCallback(async (): Promise<void> => {
        const now = Date.now();
        const timeSinceLastAttempt = now - schedulerRef.current.lastSyncAttempt;
        const currentInterval = getCurrentSyncInterval();

        // Prevent too frequent sync attempts
        if (timeSinceLastAttempt < currentInterval) {
            console.log('Background sync skipped - too soon since last attempt');
            return;
        }

        schedulerRef.current.lastSyncAttempt = now;

        console.log('Performing background sync...');

        try {
            await syncData(false); // Non-forced sync
            console.log('Background sync completed successfully');
        } catch (error) {
            console.warn('Background sync failed:', error);

            // Schedule retry with exponential backoff
            scheduleRetrySync();
        }
    }, [syncData, getCurrentSyncInterval]);

    // Schedule retry sync with exponential backoff
    const scheduleRetrySync = useCallback((attempt = 1): void => {
        if (attempt > MAX_RETRY_ATTEMPTS) {
            console.log('Max retry attempts reached for background sync');
            return;
        }

        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        console.log(`Scheduling background sync retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);

        syncTimeoutRef.current = setTimeout(async () => {
            try {
                await syncData(false);
                console.log(`Background sync retry ${attempt} succeeded`);
            } catch (error) {
                console.warn(`Background sync retry ${attempt} failed:`, error);
                scheduleRetrySync(attempt + 1);
            }
        }, delay);
    }, [syncData]);

    // Start background sync scheduler
    const startBackgroundSync = useCallback((): void => {
        if (schedulerRef.current.isActive) {
            console.log('Background sync already active');
            return;
        }

        if (!initialized) {
            console.log('Cannot start background sync - system not initialized');
            return;
        }

        console.log('Starting background sync scheduler');

        const interval = getCurrentSyncInterval();

        schedulerRef.current.intervalId = setInterval(() => {
            performBackgroundSync();
        }, interval);

        schedulerRef.current.isActive = true;

        // Perform initial sync after a short delay
        setTimeout(() => {
            if (initialized) {
                performBackgroundSync();
            }
        }, 2000);
    }, [initialized, getCurrentSyncInterval, performBackgroundSync]);

    // Stop background sync scheduler
    const stopBackgroundSync = useCallback((): void => {
        console.log('Stopping background sync scheduler');

        if (schedulerRef.current.intervalId) {
            clearInterval(schedulerRef.current.intervalId);
            schedulerRef.current.intervalId = null;
        }

        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = null;
        }

        schedulerRef.current.isActive = false;
    }, []);

    // Restart background sync with new interval
    const restartBackgroundSync = useCallback((): void => {
        stopBackgroundSync();

        // Small delay before restart to ensure cleanup
        setTimeout(() => {
            startBackgroundSync();
        }, 100);
    }, [startBackgroundSync, stopBackgroundSync]);

    // Handle visibility change events
    const handleVisibilityChange = useCallback((): void => {
        const newVisibilityState = document.hidden ? 'hidden' : 'visible';
        const previousState = visibilityStateRef.current;

        visibilityStateRef.current = newVisibilityState;

        console.log(`App visibility changed: ${previousState} -> ${newVisibilityState}`);

        if (newVisibilityState === 'visible' && previousState === 'hidden') {
            // App became visible - sync immediately and restart scheduler
            console.log('App became visible, triggering sync');
            performBackgroundSync();
            restartBackgroundSync();
        } else if (newVisibilityState === 'hidden') {
            // App went to background - restart with longer interval
            console.log('App went to background, adjusting sync interval');
            restartBackgroundSync();
        }
    }, [performBackgroundSync, restartBackgroundSync]);

    // Handle focus events for additional sync triggers
    const handleFocus = useCallback((): void => {
        if (initialized && schedulerRef.current.isActive) {
            const timeSinceLastSync = Date.now() - schedulerRef.current.lastSyncAttempt;

            // If it's been a while since last sync, trigger one
            if (timeSinceLastSync > SYNC_INTERVALS.ACTIVE) {
                console.log('App focused after long period, triggering sync');
                performBackgroundSync();
            }
        }
    }, [initialized, performBackgroundSync]);

    // Handle network connectivity changes
    const handleOnline = useCallback((): void => {
        if (initialized && navigator.onLine) {
            console.log('Network connection restored, triggering sync');
            performBackgroundSync();
        }
    }, [initialized, performBackgroundSync]);

    const handleOffline = useCallback((): void => {
        console.log('Network connection lost, stopping background sync');
        stopBackgroundSync();
    }, [stopBackgroundSync]);

    // Get current background sync status
    const getBackgroundSyncStatus = useCallback(() => {
        return {
            isActive: schedulerRef.current.isActive,
            currentInterval: getCurrentSyncInterval(),
            lastSyncAttempt: schedulerRef.current.lastSyncAttempt,
            timeSinceLastAttempt: schedulerRef.current.lastSyncAttempt
                ? Date.now() - schedulerRef.current.lastSyncAttempt
                : null,
            visibilityState: visibilityStateRef.current
        };
    }, [getCurrentSyncInterval]);

    // Manual trigger for background sync
    const triggerBackgroundSync = useCallback(async (): Promise<void> => {
        if (!initialized) {
            console.warn('Cannot trigger background sync - system not initialized');
            return;
        }

        console.log('Manually triggering background sync');
        await performBackgroundSync();
    }, [initialized, performBackgroundSync]);

    // Setup effect for initialization and cleanup
    useEffect(() => {
        if (initialized) {
            console.log('Setting up background sync...');

            // Start the background sync scheduler
            startBackgroundSync();

            // Setup event listeners
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleFocus);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Check initial network state
            if (!navigator.onLine) {
                console.log('App started offline, background sync disabled');
                stopBackgroundSync();
            }

            return () => {
                console.log('Cleaning up background sync...');

                // Cleanup scheduler
                stopBackgroundSync();

                // Remove event listeners
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [
        initialized,
        startBackgroundSync,
        stopBackgroundSync,
        handleVisibilityChange,
        handleFocus,
        handleOnline,
        handleOffline
    ]);

    // Effect for handling initialization state changes
    useEffect(() => {
        if (!initialized && schedulerRef.current.isActive) {
            console.log('System uninitialized, stopping background sync');
            stopBackgroundSync();
        }
    }, [initialized, stopBackgroundSync]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (schedulerRef.current.intervalId) {
                clearInterval(schedulerRef.current.intervalId);
            }
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    return {
        // Status
        getBackgroundSyncStatus,

        // Controls
        startBackgroundSync,
        stopBackgroundSync,
        restartBackgroundSync,
        triggerBackgroundSync,

        // State
        isActive: schedulerRef.current.isActive
    };
};