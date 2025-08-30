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
        console.log('DriveFileManager effect triggered:', {
            isAuthenticated: authState.isAuthenticated,
            hasAccessToken: !!authState.user?.accessToken,
            currentDriveManager: !!driveManager
        });

        if (authState.isAuthenticated && authState.user?.accessToken) {
            console.log('Creating DriveFileManager with access token');
            const manager = new DriveFileManager(authState.user.accessToken);
            setDriveManager(manager);
        } else {
            console.log('Clearing DriveFileManager - not authenticated');
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
            console.log('Starting comprehensive setup check...', {
                allRequired: permissions.allRequired,
                driveManager: !!driveManager
            });

            if (!permissions.allRequired) {
                console.log('Missing required permissions');
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
            console.log('Cached sheet ID check result:', cachedSheetId);

            if (cachedSheetId && driveManager) {
                try {
                    console.log('Testing cached sheet accessibility...');

                    // Add timeout to prevent hanging
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error('Sheet access timeout')), 10000);
                    });

                    const accessPromise = driveManager.readHabits(cachedSheetId);
                    console.log('Starting sheet access test...');

                    await Promise.race([accessPromise, timeoutPromise]);

                    hasCurrentSheet = true;
                    setCurrentSheetId(cachedSheetId);
                    console.log('Cached sheet is accessible, sheet ID set:', cachedSheetId);
                } catch (error) {
                    console.log('Cached sheet not accessible:', error);
                    // Clear invalid cached sheet ID
                    await chrome.storage.local.remove([CACHE_KEYS.SHEET_ID]);
                    console.log('Removed invalid cached sheet ID');
                }
            } else {
                console.log('No cached sheet ID or no drive manager:', {
                    cachedSheetId,
                    hasDriveManager: !!driveManager
                });
            }

            const needsFullSetup = !hasCurrentSheet;
            const result = {
                hasPermissions: true,
                hasFolderStructure: true,
                hasCurrentSheet,
                needsFullSetup
            };

            console.log('Setup check completed with result:', result);
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
            console.log('Initialization already in progress, waiting for existing promise...');
            return initializationPromise.current;
        }

        if (hasInitialized.current) {
            console.log('Already initialized, skipping...');
            return;
        }

        console.log('Starting progressive initialization...');

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
                console.log('Progressive initialization started, clearing any previous errors');

                // Step 1: Load cached data immediately
                console.log('STEP 1: Loading cached habits...');
                await loadCachedHabits();
                setLoadingProgress(20);
                console.log('STEP 1 COMPLETED: Cached habits loaded, progress: 20%');

                // Step 2: Comprehensive setup check
                console.log('STEP 2: Running comprehensive setup check...');
                const setupStatus = await checkComprehensiveSetup();
                setLoadingProgress(40);
                console.log('STEP 2 COMPLETED: Setup check finished, progress: 40%, result:', setupStatus);

                if (!setupStatus.hasPermissions) {
                    console.log('PERMISSIONS MISSING: Setting needsReauth flag');
                    setNeedsReauth(true);
                    setError('Need access permissions for Google Drive and Sheets');
                    clearTimeout(initTimeout);
                    return;
                }

                if (setupStatus.needsFullSetup) {
                    console.log('STEP 3A: Running full setup initialization...');
                    setLoadingProgress(60);

                    if (driveManager) {
                        console.log('DriveManager available, calling autoInitialize...');

                        // Add timeout for autoInitialize
                        const autoInitTimeout = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error('Auto-initialization timeout')), 20000);
                        });

                        const autoInitPromise = driveManager.autoInitialize();
                        console.log('Auto-initialization promise created, racing with timeout...');

                        const sheetId = await Promise.race([autoInitPromise, autoInitTimeout]);
                        console.log('Auto-initialization completed successfully, sheet ID:', sheetId);

                        setCurrentSheetId(sheetId);
                        await setCache(CACHE_KEYS.SHEET_ID, sheetId, CACHE_TTL.HABITS);
                        console.log('Sheet ID cached successfully');

                        // Load fresh data from new sheet with timeout
                        console.log('Loading initial habits from new sheet...');
                        const loadDataTimeout = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error('Data loading timeout')), 15000);
                        });

                        const loadDataPromise = driveManager.readHabits(sheetId);
                        const habitsData = await Promise.race([loadDataPromise, loadDataTimeout]);

                        console.log('Initial habits loaded successfully, count:', habitsData.length);
                        await updateHabitsCache(habitsData);
                        console.log('Habits cache updated with initial data');
                    } else {
                        console.error('CRITICAL ERROR: DriveManager not available for full setup');
                        throw new Error('DriveManager not available');
                    }
                } else {
                    console.log('STEP 3B: Using existing setup, triggering background sync...');
                    // Background sync for existing setup
                    setTimeout(() => {
                        console.log('Starting background sync...');
                        syncData().catch(error => {
                            console.warn('Background sync failed (non-critical):', error);
                            // Don't fail initialization for background sync errors
                        });
                    }, 100);
                }

                setLoadingProgress(100);
                console.log('INITIALIZATION SUCCESSFUL: All steps completed, setting initialized flag');
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
                console.log('INITIALIZATION CLEANUP: Timeout cleared, initialization complete');

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
                        console.log('PERMISSION ERROR detected, setting needsReauth');
                        setNeedsReauth(true);
                        setError('Access expired or insufficient permissions, please login again');
                    } else if (error.message.includes('timeout')) {
                        console.log('TIMEOUT ERROR detected');
                        setError('Operation timed out. Please check your internet connection and try refreshing.');
                    } else if (error.message.includes('network') || error.message.includes('fetch')) {
                        console.log('NETWORK ERROR detected');
                        setError('Network error. Please check your internet connection.');
                    } else {
                        console.log('GENERIC ERROR detected');
                        setError(`Initialization error: ${error.message}`);
                    }
                } else {
                    console.log('UNKNOWN ERROR detected');
                    setError('System initialization error');
                }

                // Reset states
                setInitialized(false);
                hasInitialized.current = false;
                setLoadingProgress(0);
                console.log('INITIALIZATION RESET: States reset due to error');
            } finally {
                performanceMonitor.endTiming('progressive-init');
                initializationPromise.current = null;
                console.log('INITIALIZATION FINALLY: Cleanup completed, promise cleared');
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
            console.log('SKIP AUTO-INITIALIZE: Already initialized');
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

        console.log('AUTO-INITIALIZE EFFECT TRIGGERED:', conditions);

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

        console.log('CAN INITIALIZE CHECK:', {
            canInitialize,
            breakdown: {
                authenticated: authState.isAuthenticated,
                hasUser: !!authState.user,
                hasDriveManager: !!driveManager,
                permissionsChecked: permissions.checked,
                allPermissions: permissions.allRequired,
                notInitialized: !initialized,
                noReauth: !needsReauth,
                notAlreadyInitialized: !hasInitialized.current
            }
        });

        if (canInitialize) {
            console.log('ALL CONDITIONS MET - STARTING INITIALIZATION');

            progressiveInitialize()
                .then(() => {
                    console.log('INITIALIZATION PROMISE RESOLVED SUCCESSFULLY');
                })
                .catch((error) => {
                    console.error('INITIALIZATION PROMISE REJECTED:', error);
                    setError(`Initialization failed: ${error.message}`);
                });
        } else {
            console.log('INITIALIZATION CONDITIONS NOT MET - WAITING');
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
            console.log('Enhanced logout started...');
            await handleLogout();

            setCurrentSheetId(null);
            setInitialized(false);
            hasInitialized.current = false; // Reset initialization flag
            setNeedsReauth(false);
            setError(null);

            await clearCache();
            console.log('Enhanced logout completed');
        } catch (err) {
            console.error("Enhanced logout error:", err);
        }
    }, [handleLogout, clearCache]);

    // Enhanced force reauth
    const handleEnhancedForceReauth = useCallback(async () => {
        try {
            console.log('Enhanced force reauth started...');
            setError(null);
            setLoading(true);
            await handleForceReauth();
            setNeedsReauth(false);
            hasInitialized.current = false; // Allow reinitialization after reauth
            console.log('Enhanced force reauth completed');
        } catch (err) {
            console.error("Enhanced force reauth error:", err);
            setError("Permission grant failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [handleForceReauth, setLoading, setError]);

    // Log state changes
    useEffect(() => {
        console.log('PERMISSIONS STATE CHANGED:', permissions);
    }, [permissions]);

    useEffect(() => {
        console.log('AUTH STATE CHANGED:', {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            loading: authState.loading
        });
    }, [authState]);

    useEffect(() => {
        console.log('DRIVE MANAGER CHANGED:', !!driveManager);
    }, [driveManager]);

    useEffect(() => {
        console.log('INITIALIZED STATE CHANGED:', initialized);
    }, [initialized]);

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