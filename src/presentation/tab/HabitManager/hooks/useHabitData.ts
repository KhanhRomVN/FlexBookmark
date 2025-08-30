import { useState, useEffect, useCallback, useRef } from "react";
import { DriveFileManager } from "../utils/drive/DriveFileManager";
import { useAuth } from "./core/useAuth";
import { useCache } from "./core/useCache";
import { usePermissions } from "./core/usePermissions";
import { useHabits } from "./data/useHabits";
import { useHabitCRUD } from "./data/useHabitCRUD";
import { useSync } from "./sync/useSync";
import { useBackgroundSync } from "./sync/useBackgroundSync";
import { PerformanceMonitor } from "../utils/performance/PerformanceMonitor";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cache/CacheKeys";

export const useHabitData = () => {
    // Core state
    const [driveManager, setDriveManager] = useState<DriveFileManager | null>(null);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [needsReauth, setNeedsReauth] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);

    const performanceMonitor = PerformanceMonitor.getInstance();
    const initializationPromise = useRef<Promise<void> | null>(null);
    const hasInitialized = useRef<boolean>(false); // Track if we've already initialized

    // Hook integrations
    const { authState, authManager, handleLogin, handleLogout, handleForceReauth } = useAuth();
    const { getCache, setCache, clearCache } = useCache();
    const { permissions, checkPermissions } = usePermissions();

    const {
        habits,
        loading,
        error,
        setLoading,
        setError,
        loadCachedHabits,
        updateHabitsCache,
        optimisticUpdate,
        revertOptimisticUpdate,
        getActiveHabits,
        getTodayStats
    } = useHabits();

    const { syncData, refreshData, syncInProgress } = useSync({
        driveManager,
        currentSheetId,
        habits,
        updateHabitsCache,
        setError
    });

    // Background sync setup
    useBackgroundSync({
        initialized,
        syncData
    });

    // CRUD operations
    const {
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        updateDailyHabit
    } = useHabitCRUD({
        driveManager,
        currentSheetId,
        habits,
        updateHabitsCache,
        optimisticUpdate,
        revertOptimisticUpdate,
        setLoading,
        setError
    });

    // Initialize DriveFileManager when authenticated
    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            const manager = new DriveFileManager(authState.user.accessToken);
            setDriveManager(manager);
        } else {
            setDriveManager(null);
            setInitialized(false);
            hasInitialized.current = false; // Reset initialization flag
        }
    }, [authState.isAuthenticated, authState.user?.accessToken]);

    // Comprehensive setup check with timeout and better error handling
    const checkComprehensiveSetup = useCallback(async (): Promise<{
        hasPermissions: boolean;
        hasFolderStructure: boolean;
        hasCurrentSheet: boolean;
        needsFullSetup: boolean;
    }> => {
        try {
            performanceMonitor.startTiming('setup-check');

            if (!permissions.allRequired) {
                return {
                    hasPermissions: false,
                    hasFolderStructure: false,
                    hasCurrentSheet: false,
                    needsFullSetup: true
                };
            }

            // Check current sheet accessibility with timeout
            let hasCurrentSheet = false;
            const cachedSheetId = await getCache<string>(CACHE_KEYS.SHEET_ID);

            if (cachedSheetId && driveManager) {
                try {

                    // Add timeout to prevent hanging
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error('Sheet access timeout')), 10000);
                    });

                    const accessPromise = driveManager.readHabits(cachedSheetId);

                    await Promise.race([accessPromise, timeoutPromise]);

                    hasCurrentSheet = true;
                    setCurrentSheetId(cachedSheetId);
                } catch (error) {
                    // Clear invalid cached sheet ID
                    await chrome.storage.local.remove([CACHE_KEYS.SHEET_ID]);
                }
            }

            const needsFullSetup = !hasCurrentSheet;
            const result = {
                hasPermissions: true,
                hasFolderStructure: true,
                hasCurrentSheet,
                needsFullSetup
            };

            return result;

        } catch (error) {
            console.error('Error in comprehensive setup check:', error);
            return {
                hasPermissions: false,
                hasFolderStructure: false,
                hasCurrentSheet: false,
                needsFullSetup: true
            };
        } finally {
            performanceMonitor.endTiming('setup-check');
        }
    }, [permissions.allRequired, getCache, driveManager, performanceMonitor]);

    // Progressive initialization with better timeout and error handling
    const progressiveInitialize = useCallback(async (): Promise<void> => {
        if (initializationPromise.current) {
            return initializationPromise.current;
        }

        if (hasInitialized.current) {
            return;
        }


        initializationPromise.current = (async () => {
            const initTimeout = setTimeout(() => {
                console.error('INITIALIZATION TIMEOUT - forcing completion after 30 seconds');
                setError('Initialization timeout. Please refresh the page.');
                setInitialized(false);
                setLoadingProgress(0);
                initializationPromise.current = null;
                hasInitialized.current = false;
            }, 30000);

            try {
                performanceMonitor.startTiming('progressive-init');
                setError(null);

                await loadCachedHabits();
                setLoadingProgress(20);

                const setupStatus = await checkComprehensiveSetup();
                setLoadingProgress(40);

                if (!setupStatus.hasPermissions) {
                    setNeedsReauth(true);
                    setError('Need access permissions for Google Drive and Sheets');
                    clearTimeout(initTimeout);
                    return;
                }

                if (setupStatus.needsFullSetup) {
                    setLoadingProgress(60);

                    if (driveManager) {

                        // Add timeout for autoInitialize
                        const autoInitTimeout = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error('Auto-initialization timeout')), 20000);
                        });

                        const autoInitPromise = driveManager.autoInitialize();

                        const sheetId = await Promise.race([autoInitPromise, autoInitTimeout]);

                        setCurrentSheetId(sheetId);
                        await setCache(CACHE_KEYS.SHEET_ID, sheetId, CACHE_TTL.HABITS);

                        // Load fresh data from new sheet with timeout
                        const loadDataTimeout = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error('Data loading timeout')), 15000);
                        });

                        const loadDataPromise = driveManager.readHabits(sheetId);
                        const habitsData = await Promise.race([loadDataPromise, loadDataTimeout]);

                        await updateHabitsCache(habitsData);
                    } else {
                        console.error('CRITICAL ERROR: DriveManager not available for full setup');
                        throw new Error('DriveManager not available');
                    }
                } else {
                    // Background sync for existing setup
                    setTimeout(() => {
                        syncData().catch(error => {
                            console.warn('Background sync failed (non-critical):', error);
                            // Don't fail initialization for background sync errors
                        });
                    }, 100);
                }

                setLoadingProgress(100);
                setInitialized(true);
                hasInitialized.current = true; // Mark as initialized
                await setCache(CACHE_KEYS.LAST_SYNC, Date.now(), CACHE_TTL.HABITS);

                performanceMonitor.recordLoadTime({
                    totalLoadTime: performanceMonitor.getCurrentTiming('progressive-init') || 0,
                    authTime: 0,
                    cacheLoadTime: 0,
                    permissionsTime: 0,
                    syncTime: 0,
                    initializationTime: performanceMonitor.getCurrentTiming('progressive-init') || 0,
                    timestamp: Date.now()
                });

                clearTimeout(initTimeout);

            } catch (error) {
                console.error('INITIALIZATION FAILED:', error);
                clearTimeout(initTimeout);

                // Add detailed error logging
                if (error instanceof Error) {
                    console.error('Error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });

                    if (error.message.includes('403') || error.message.includes('permission')) {
                        setNeedsReauth(true);
                        setError('Access expired or insufficient permissions, please login again');
                    } else if (error.message.includes('timeout')) {
                        setError('Operation timed out. Please check your internet connection and try refreshing.');
                    } else if (error.message.includes('network') || error.message.includes('fetch')) {
                        setError('Network error. Please check your internet connection.');
                    } else {
                        setError(`Initialization error: ${error.message}`);
                    }
                } else {
                    setError('System initialization error');
                }

                // Reset states
                setInitialized(false);
                hasInitialized.current = false;
                setLoadingProgress(0);
            } finally {
                performanceMonitor.endTiming('progressive-init');
                initializationPromise.current = null;
            }
        })();

        return initializationPromise.current;
    }, [
        loadCachedHabits, checkComprehensiveSetup, driveManager,
        setCache, updateHabitsCache, syncData, performanceMonitor
    ]);

    // FIXED: Simplified auto-initialize effect that doesn't create loops
    useEffect(() => {
        // Skip if we've already initialized
        if (hasInitialized.current) {
            return;
        }

        const conditions = {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            hasDriveManager: !!driveManager,
            permissionsChecked: permissions.checked,
            allRequired: permissions.allRequired,
            initialized,
            needsReauth,
            hasInitializedRef: hasInitialized.current
        };


        // More specific condition check
        const canInitialize =
            authState.isAuthenticated &&
            authState.user &&
            driveManager &&
            permissions.checked &&
            permissions.allRequired &&
            !initialized &&
            !needsReauth &&
            !hasInitialized.current;

        if (canInitialize) {

            progressiveInitialize()
                .then(() => {
                })
                .catch((error) => {
                    console.error('INITIALIZATION PROMISE REJECTED:', error);
                    setError(`Initialization failed: ${error.message}`);
                });
        }
    }, [
        authState.isAuthenticated,
        authState.user?.accessToken, // This ensures we reinitialize if token changes
        driveManager,
        permissions.checked,
        permissions.allRequired,
        initialized,
        needsReauth,
        progressiveInitialize
    ]);

    // Enhanced logout with cleanup
    const handleEnhancedLogout = useCallback(async () => {
        try {
            await handleLogout();

            setCurrentSheetId(null);
            setInitialized(false);
            hasInitialized.current = false; // Reset initialization flag
            setNeedsReauth(false);
            setError(null);

            await clearCache();
        } catch (err) {
            console.error("Enhanced logout error:", err);
        }
    }, [handleLogout, clearCache]);

    // Enhanced force reauth
    const handleEnhancedForceReauth = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            await handleForceReauth();
            setNeedsReauth(false);
            hasInitialized.current = false; // Allow reinitialization after reauth
        } catch (err) {
            console.error("Enhanced force reauth error:", err);
            setError("Permission grant failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [handleForceReauth, setLoading, setError]);

    return {
        // State
        authState,
        driveManager,
        habits,
        loading,
        error,
        currentSheetId,
        needsReauth,
        initialized,
        permissions,
        loadingProgress,

        // Actions
        handleLogin,
        handleLogout: handleEnhancedLogout,
        handleCreateHabit: createHabit,
        handleUpdateHabit: updateHabit,
        handleDeleteHabit: deleteHabit,
        handleArchiveHabit: archiveHabit,
        handleUpdateDailyHabit: updateDailyHabit,
        handleRefresh: refreshData,
        handleForceReauth: handleEnhancedForceReauth,
        checkPermissions,

        // Sync operations
        syncInBackground: syncData,

        // Computed data
        getActiveHabits,
        getTodayStats
    };
};