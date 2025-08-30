import { useState, useCallback, useRef } from 'react';
import { useCache } from '../core/useCache';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache/CacheKeys';
import { DriveFileManager } from '../../utils/drive/DriveFileManager';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';
import type { Habit } from '../../types/habit';

interface UseSyncParams {
    driveManager: DriveFileManager | null;
    currentSheetId: string | null;
    habits: Habit[];
    updateHabitsCache: (habits: Habit[]) => Promise<void>;
    setError: (error: string | null) => void;
}

interface SyncResult {
    success: boolean;
    syncedCount: number;
    errors: string[];
    duration: number;
}

interface SyncStats {
    lastSyncTime: number;
    lastSyncResult: SyncResult | null;
    syncCount: number;
    averageDuration: number;
    errorCount: number;
}

export const useSync = ({
    driveManager,
    currentSheetId,
    habits,
    updateHabitsCache,
    setError
}: UseSyncParams) => {
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [syncStats, setSyncStats] = useState<SyncStats>({
        lastSyncTime: 0,
        lastSyncResult: null,
        syncCount: 0,
        averageDuration: 0,
        errorCount: 0
    });

    const { getCache, setCache } = useCache();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const syncAbortControllerRef = useRef<AbortController | null>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if sync is needed based on time elapsed
    const isSyncNeeded = useCallback(async (forceSync = false): Promise<boolean> => {
        if (forceSync) return true;

        try {
            const lastSync = await getCache<number>(CACHE_KEYS.LAST_SYNC);
            const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

            if (!lastSync) return true;

            const timeSinceLastSync = Date.now() - lastSync;
            return timeSinceLastSync > SYNC_INTERVAL;
        } catch (error) {
            console.warn('Failed to check sync necessity:', error);
            return true; // Assume sync is needed if we can't check
        }
    }, [getCache]);

    // Validate sync prerequisites
    const validateSyncPrerequisites = (): boolean => {
        if (!driveManager || !currentSheetId) {
            setError('Sync not available: System not initialized');
            return false;
        }

        if (syncInProgress) {
            console.log('Sync already in progress, skipping');
            return false;
        }

        return true;
    };

    // Main sync operation
    const syncData = useCallback(async (forceSync = false): Promise<SyncResult> => {
        const operationId = `sync-${Date.now()}`;
        const startTime = Date.now();

        // Initialize default result
        let result: SyncResult = {
            success: false,
            syncedCount: 0,
            errors: [],
            duration: 0
        };

        try {
            // Check if sync is needed
            if (!forceSync && !(await isSyncNeeded())) {
                console.log('Sync not needed, skipping');
                result.success = true;
                return result;
            }

            // Validate prerequisites
            if (!validateSyncPrerequisites()) {
                result.errors.push('Sync prerequisites not met');
                return result;
            }

            console.log('🔄 Starting data sync...', { forceSync });

            setSyncInProgress(true);
            setError(null);
            performanceMonitor.startTiming(operationId);

            // Create abort controller for timeout handling
            syncAbortControllerRef.current = new AbortController();

            // Set sync timeout (30 seconds)
            syncTimeoutRef.current = setTimeout(() => {
                if (syncAbortControllerRef.current && !syncAbortControllerRef.current.signal.aborted) {
                    console.warn('Sync operation timed out');
                    syncAbortControllerRef.current.abort();
                }
            }, 30000);

            // Perform the actual sync
            const freshHabits = await driveManager!.readHabits(currentSheetId!);

            // Clear timeout since sync completed
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }

            // Check if operation was aborted
            if (syncAbortControllerRef.current?.signal.aborted) {
                throw new Error('Sync operation was aborted due to timeout');
            }

            // Validate received data
            if (!Array.isArray(freshHabits)) {
                throw new Error('Invalid data received from sync');
            }

            console.log(`📥 Synced ${freshHabits.length} habits from sheet`);

            // Update cache with fresh data
            await updateHabitsCache(freshHabits);

            // Update last sync timestamp
            const syncTime = Date.now();
            await setCache(CACHE_KEYS.LAST_SYNC, syncTime, CACHE_TTL.HABITS);
            setLastSyncTime(syncTime);

            // Prepare successful result
            result = {
                success: true,
                syncedCount: freshHabits.length,
                errors: [],
                duration: Date.now() - startTime
            };

            console.log('✅ Data sync completed successfully', {
                duration: result.duration,
                syncedCount: result.syncedCount
            });

            return result;

        } catch (error) {
            console.error('❌ Sync failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            result.errors.push(errorMessage);

            // Don't overwrite existing data on sync error
            setError(`Sync failed: ${errorMessage}`);

            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);

            return result;

        } finally {
            // Cleanup
            setSyncInProgress(false);
            performanceMonitor.endTiming(operationId);

            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }

            syncAbortControllerRef.current = null;

            // Update sync stats
            updateSyncStats(result);
        }
    }, [
        driveManager,
        currentSheetId,
        isSyncNeeded,
        updateHabitsCache,
        setCache,
        setError,
        performanceMonitor
    ]);

    // Update sync statistics
    const updateSyncStats = useCallback((result: SyncResult): void => {
        setSyncStats(prevStats => {
            const newSyncCount = prevStats.syncCount + 1;
            const newErrorCount = result.success ? prevStats.errorCount : prevStats.errorCount + 1;
            const newAverageDuration = prevStats.averageDuration === 0
                ? result.duration
                : (prevStats.averageDuration * prevStats.syncCount + result.duration) / newSyncCount;

            return {
                lastSyncTime: Date.now(),
                lastSyncResult: result,
                syncCount: newSyncCount,
                averageDuration: Math.round(newAverageDuration),
                errorCount: newErrorCount
            };
        });
    }, []);

    // Force refresh data from server
    const refreshData = useCallback(async (): Promise<SyncResult> => {
        console.log('🔄 Force refreshing data...');
        return syncData(true);
    }, [syncData]);

    // Cancel ongoing sync operation
    const cancelSync = useCallback((): void => {
        if (syncAbortControllerRef.current && !syncAbortControllerRef.current.signal.aborted) {
            console.log('Cancelling sync operation...');
            syncAbortControllerRef.current.abort();
        }
    }, []);

    // Get sync status information
    const getSyncStatus = useCallback(() => {
        return {
            inProgress: syncInProgress,
            lastSyncTime,
            canSync: driveManager !== null && currentSheetId !== null,
            stats: syncStats
        };
    }, [syncInProgress, lastSyncTime, driveManager, currentSheetId, syncStats]);

    // Auto-sync based on data staleness
    const autoSync = useCallback(async (): Promise<void> => {
        try {
            const needsSync = await isSyncNeeded();

            if (needsSync && !syncInProgress) {
                console.log('Auto-sync triggered due to stale data');
                await syncData();
            }
        } catch (error) {
            console.warn('Auto-sync check failed:', error);
        }
    }, [isSyncNeeded, syncInProgress, syncData]);

    // Sync with retry logic
    const syncWithRetry = useCallback(async (maxRetries = 3, delay = 1000): Promise<SyncResult> => {
        let lastResult: SyncResult = {
            success: false,
            syncedCount: 0,
            errors: ['No attempts made'],
            duration: 0
        };

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`Sync attempt ${attempt}/${maxRetries}`);

            lastResult = await syncData(true);

            if (lastResult.success) {
                console.log(`Sync succeeded on attempt ${attempt}`);
                return lastResult;
            }

            // Wait before retrying (unless it's the last attempt)
            if (attempt < maxRetries) {
                console.log(`Sync attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5; // Exponential backoff
            }
        }

        console.error(`All ${maxRetries} sync attempts failed`);
        setError(`Sync failed after ${maxRetries} attempts: ${lastResult.errors.join(', ')}`);

        return lastResult;
    }, [syncData, setError]);

    // Validate data integrity after sync
    const validateSyncedData = useCallback((habits: Habit[]): boolean => {
        try {
            if (!Array.isArray(habits)) {
                console.error('Synced data is not an array');
                return false;
            }

            // Check for required fields
            const invalidHabits = habits.filter(habit =>
                !habit.id ||
                !habit.name ||
                typeof habit.habitType !== 'string' ||
                !Array.isArray(habit.dailyTracking)
            );

            if (invalidHabits.length > 0) {
                console.error(`Found ${invalidHabits.length} invalid habits in synced data`);
                return false;
            }

            // Check for duplicate IDs
            const ids = habits.map(h => h.id);
            const uniqueIds = new Set(ids);

            if (ids.length !== uniqueIds.size) {
                console.error('Duplicate habit IDs found in synced data');
                return false;
            }

            console.log('Data integrity validation passed');
            return true;

        } catch (error) {
            console.error('Data validation error:', error);
            return false;
        }
    }, []);

    // Get time since last sync in human-readable format
    const getTimeSinceLastSync = useCallback((): string => {
        if (!lastSyncTime) return 'Never';

        const now = Date.now();
        const diffMs = now - lastSyncTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }, [lastSyncTime]);

    return {
        // State
        syncInProgress,
        lastSyncTime,
        syncStats,

        // Actions
        syncData,
        refreshData,
        cancelSync,
        autoSync,
        syncWithRetry,

        // Utilities
        getSyncStatus,
        getTimeSinceLastSync,
        validateSyncedData,
        isSyncNeeded
    };
};