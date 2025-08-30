import { useState, useEffect, useCallback, useRef } from "react";
import { DriveFileManager } from "../../../../utils/driveFileManager";
import ChromeAuthManager, { AuthState } from "../../../../utils/chromeAuth";
import type {
    Habit,
    HabitFormData,
    HabitType,
    HabitCategory,
    DifficultyLevel,
    calculateHabitStats,
    HabitStats
} from "../types/habit";

// Cache keys for Chrome storage
const CACHE_KEYS = {
    HABITS: 'habits_cache',
    PERMISSIONS: 'permissions_cache',
    SHEET_ID: 'current_sheet_id',
    LAST_SYNC: 'last_sync_timestamp',
    AUTH_VERIFIED: 'auth_verified_timestamp'
} as const;

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
    HABITS: 5 * 60 * 1000,        // 5 minutes for habits data
    PERMISSIONS: 15 * 60 * 1000,   // 15 minutes for permissions
    AUTH: 30 * 60 * 1000           // 30 minutes for auth verification
} as const;

interface CachedData<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export const useHabitData = () => {
    const authManager = ChromeAuthManager.getInstance();
    const [driveManager, setDriveManager] = useState<DriveFileManager | null>(null);
    const syncInProgress = useRef(false);
    const initializationPromise = useRef<Promise<void> | null>(null);

    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [needsReauth, setNeedsReauth] = useState<boolean>(false);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0); // ADD THIS LINE

    const [permissions, setPermissions] = useState<{
        hasDrive: boolean;
        hasSheets: boolean;
        hasCalendar: boolean;
        allRequired: boolean;
        checked: boolean;
    }>({
        hasDrive: false,
        hasSheets: false,
        hasCalendar: false,
        allRequired: false,
        checked: false
    });

    // Cache utilities
    const setCache = useCallback(async <T>(key: string, data: T, ttl: number): Promise<void> => {
        const cacheData: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };

        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: cacheData }, () => resolve());
        });
    }, []);

    const getCache = useCallback(async <T>(key: string): Promise<T | null> => {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                const cached = result[key] as CachedData<T> | undefined;

                if (!cached) {
                    resolve(null);
                    return;
                }

                const isExpired = Date.now() - cached.timestamp > cached.ttl;
                if (isExpired) {
                    // Clean up expired cache
                    chrome.storage.local.remove([key]);
                    resolve(null);
                    return;
                }

                resolve(cached.data);
            });
        });
    }, []);

    const checkComprehensiveSetup = useCallback(async (): Promise<{
        hasPermissions: boolean;
        hasFolderStructure: boolean;
        hasCurrentSheet: boolean;
        needsFullSetup: boolean;
    }> => {
        try {
            console.log('Checking comprehensive setup...');

            // 1. Kiểm tra permissions đầy đủ
            const permissionCheck = await authManager.hasAllHabitManagerPermissions();

            if (!permissionCheck.allRequired) {
                return {
                    hasPermissions: false,
                    hasFolderStructure: false,
                    hasCurrentSheet: false,
                    needsFullSetup: true
                };
            }

            // 2. Kiểm tra folder structure
            const hasFolderStructure = permissionCheck.folderStructureExists || false;

            // 3. Kiểm tra current sheet (nếu có cached sheet ID)
            let hasCurrentSheet = false;
            const cachedSheetId = await getCache<string>(CACHE_KEYS.SHEET_ID);

            if (cachedSheetId && driveManager) {
                try {
                    // Test xem sheet có accessible không
                    await driveManager.readHabits(cachedSheetId);
                    hasCurrentSheet = true;
                    console.log('Current sheet is accessible:', cachedSheetId);
                } catch (error) {
                    console.log('Cached sheet not accessible:', error);
                    // Clear invalid cache
                    chrome.storage.local.remove([CACHE_KEYS.SHEET_ID]);
                }
            }

            const needsFullSetup = !hasFolderStructure || !hasCurrentSheet;

            return {
                hasPermissions: true,
                hasFolderStructure,
                hasCurrentSheet,
                needsFullSetup
            };

        } catch (error) {
            console.error('Error checking comprehensive setup:', error);
            return {
                hasPermissions: false,
                hasFolderStructure: false,
                hasCurrentSheet: false,
                needsFullSetup: true
            };
        }
    }, [authManager, driveManager, getCache]);

    // Load cached data on startup
    const loadCachedData = useCallback(async () => {
        try {
            console.log('Loading cached data...');

            // Load cached habits (instant UI population)
            const cachedHabits = await getCache<Habit[]>(CACHE_KEYS.HABITS);
            if (cachedHabits) {
                console.log(`Loaded ${cachedHabits.length} habits from cache`);
                setHabits(cachedHabits);
            }

            // Load cached permissions
            const cachedPermissions = await getCache<typeof permissions>(CACHE_KEYS.PERMISSIONS);
            if (cachedPermissions) {
                console.log('Loaded permissions from cache');
                setPermissions(cachedPermissions);
            }

            // Load cached sheet ID
            const cachedSheetId = await getCache<string>(CACHE_KEYS.SHEET_ID);
            if (cachedSheetId) {
                console.log('Loaded sheet ID from cache');
                setCurrentSheetId(cachedSheetId);
            }

        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
    }, [getCache]);

    // Background sync without blocking UI
    const syncInBackground = useCallback(async () => {
        if (syncInProgress.current || !driveManager || !currentSheetId) {
            return;
        }

        syncInProgress.current = true;

        try {
            console.log('Background sync started...');

            // Get fresh data from server
            const freshHabits = await driveManager.readHabits(currentSheetId);

            // Compare with current data
            const hasChanges = JSON.stringify(freshHabits) !== JSON.stringify(habits);

            if (hasChanges) {
                console.log('Data changes detected, updating...');
                setHabits(freshHabits);
                await setCache(CACHE_KEYS.HABITS, freshHabits, CACHE_TTL.HABITS);
            }

            // Update sync timestamp
            await setCache(CACHE_KEYS.LAST_SYNC, Date.now(), CACHE_TTL.HABITS);

            console.log('Background sync completed');

        } catch (error) {
            console.warn('Background sync failed:', error);
            // Don't show error to user for background sync failures
        } finally {
            syncInProgress.current = false;
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Progressive initialization - show cached data first, then sync
    const progressiveInitialize = useCallback(async () => {
        if (initializationPromise.current) {
            return initializationPromise.current;
        }

        initializationPromise.current = (async () => {
            try {
                console.log('Starting comprehensive progressive initialization...');

                // Step 1: Load cached data immediately
                await loadCachedData();
                setLoadingProgress(20);

                // Step 2: Comprehensive setup check
                const setupStatus = await checkComprehensiveSetup();
                setLoadingProgress(40);

                console.log('Setup status:', setupStatus);

                if (!setupStatus.hasPermissions) {
                    setNeedsReauth(true);
                    setError('Cần cấp quyền truy cập Google Drive và Sheets');
                    return;
                }

                if (setupStatus.needsFullSetup) {
                    console.log('Need full setup - creating folder structure...');
                    setLoadingProgress(60);

                    // Thực hiện full setup
                    if (driveManager) {
                        const sheetId = await driveManager.autoInitialize();
                        setCurrentSheetId(sheetId);
                        await setCache(CACHE_KEYS.SHEET_ID, sheetId, CACHE_TTL.HABITS);

                        // Load fresh data from new sheet
                        const habitsData = await driveManager.readHabits(sheetId);
                        setHabits(habitsData);
                        await setCache(CACHE_KEYS.HABITS, habitsData, CACHE_TTL.HABITS);
                    }
                } else {
                    console.log('Setup already exists, syncing in background...');
                    // Folder structure exists, sync in background
                    setTimeout(() => syncInBackground(), 100);
                }

                setLoadingProgress(100);
                setInitialized(true);
                await setCache(CACHE_KEYS.LAST_SYNC, Date.now(), CACHE_TTL.HABITS);

                console.log('Comprehensive progressive initialization completed');

            } catch (error) {
                console.error('Progressive initialization failed:', error);

                if (error instanceof Error) {
                    if (error.message.includes('403') || error.message.includes('permission')) {
                        setNeedsReauth(true);
                        setError('Quyền truy cập hết hạn hoặc không đủ, vui lòng đăng nhập lại');
                    } else {
                        setError(`Lỗi khởi tạo: ${error.message}`);
                    }
                } else {
                    setError('Lỗi khởi tạo hệ thống quản lý thói quen');
                }
            }
        })();

        return initializationPromise.current;
    }, [authState.isAuthenticated, authState.user, driveManager, checkComprehensiveSetup, loadCachedData, syncInBackground, getCache, setCache]);

    // Auth state subscription with caching
    useEffect(() => {
        const unsubscribe = authManager.subscribe(async (newState) => {
            setAuthState(newState);

            // Cache auth state for faster future loads
            if (newState.isAuthenticated && newState.user) {
                await setCache(CACHE_KEYS.AUTH_VERIFIED, true, CACHE_TTL.AUTH);
            }
        });

        authManager.initialize();
        return unsubscribe;
    }, [authManager, setCache]);

    // Initialize DriveFileManager when authenticated
    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            const manager = new DriveFileManager(authState.user.accessToken);
            setDriveManager(manager);
        } else {
            setDriveManager(null);
            setInitialized(false);
            setPermissions({
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                checked: false
            });
        }
    }, [authState.isAuthenticated, authState.user?.accessToken]);

    // Fast permission check with caching
    const checkPermissions = useCallback(async () => {
        if (!authState.isAuthenticated || !authState.user) {
            return;
        }

        // Check cache first
        const cachedPermissions = await getCache<typeof permissions>(CACHE_KEYS.PERMISSIONS);
        if (cachedPermissions && cachedPermissions.checked) {
            console.log('Using cached permissions');
            setPermissions(cachedPermissions);

            if (cachedPermissions.allRequired) {
                setNeedsReauth(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Checking permissions...');
            const permissionCheck = await authManager.hasAllHabitManagerPermissions();

            const newPermissions = {
                ...permissionCheck,
                checked: true
            };

            setPermissions(newPermissions);

            // Cache permissions for faster future loads
            await setCache(CACHE_KEYS.PERMISSIONS, newPermissions, CACHE_TTL.PERMISSIONS);

            if (!permissionCheck.allRequired) {
                setNeedsReauth(true);
                setError(
                    !permissionCheck.hasDrive
                        ? "Thiếu quyền truy cập Google Drive"
                        : "Thiếu quyền truy cập Google Sheets"
                );
            } else {
                setNeedsReauth(false);
                setError(null);
            }

        } catch (error) {
            console.error('Permission check error:', error);
            setError('Không thể kiểm tra quyền truy cập');
            setNeedsReauth(true);
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, authState.user, authManager, getCache, setCache]);

    // Check permissions on auth (with caching)
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && !permissions.checked) {
            checkPermissions();
        }
    }, [authState.isAuthenticated, authState.user, permissions.checked, checkPermissions]);

    // Auto-initialize when ready (progressive)
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && driveManager &&
            permissions.allRequired && !initialized && !needsReauth) {
            progressiveInitialize();
        }
    }, [authState.isAuthenticated, authState.user, driveManager,
    permissions.allRequired, initialized, needsReauth, progressiveInitialize]);

    // Fast auto-initialize with cached data
    const fastAutoInitialize = useCallback(async () => {
        if (!driveManager) {
            console.log('DriveManager not available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fast auto-initialization...');

            // Check for cached sheet ID first
            let sheetId = await getCache<string>(CACHE_KEYS.SHEET_ID);

            if (!sheetId) {
                // Only do full initialization if no cached sheet ID
                console.log('No cached sheet ID, doing full initialization...');
                sheetId = await driveManager.autoInitialize();
                await setCache(CACHE_KEYS.SHEET_ID, sheetId, CACHE_TTL.HABITS);
            } else {
                console.log('Using cached sheet ID:', sheetId);
            }

            setCurrentSheetId(sheetId);

            // Load from cache first, then sync in background
            const cachedHabits = await getCache<Habit[]>(CACHE_KEYS.HABITS);
            if (cachedHabits) {
                setHabits(cachedHabits);
                setInitialized(true);

                // Sync in background without blocking UI
                setTimeout(() => syncInBackground(), 100);
            } else {
                // No cache, load fresh data
                const habitsData = await driveManager.readHabits(sheetId);
                setHabits(habitsData);
                setInitialized(true);

                // Cache the fresh data
                await setCache(CACHE_KEYS.HABITS, habitsData, CACHE_TTL.HABITS);
            }

            console.log('Fast auto-initialization completed');

        } catch (error) {
            console.error('Fast auto-initialization error:', error);

            if (error instanceof Error) {
                if (error.message.includes('403') || error.message.includes('permission')) {
                    setNeedsReauth(true);
                    setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
                } else {
                    setError(`Lỗi khởi tạo: ${error.message}`);
                }
            } else {
                setError("Lỗi khởi tạo hệ thống quản lý thói quen");
            }
        } finally {
            setLoading(false);
        }
    }, [driveManager, getCache, setCache, syncInBackground]);

    // Optimized CRUD operations with caching
    const handleCreateHabit = useCallback(async (habitFormData: HabitFormData) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newHabit: Habit = {
                id: Date.now().toString(),
                name: habitFormData.name,
                description: habitFormData.description,
                habitType: habitFormData.habitType,
                difficultyLevel: habitFormData.difficultyLevel,
                goal: habitFormData.goal,
                limit: habitFormData.limit,
                currentStreak: 0,
                dailyTracking: Array(31).fill(null),
                createdDate: new Date(),
                colorCode: habitFormData.colorCode,
                longestStreak: 0,
                category: habitFormData.category,
                tags: habitFormData.tags,
                isArchived: false,
                isQuantifiable: habitFormData.isQuantifiable,
                unit: habitFormData.unit,
                startTime: habitFormData.startTime,
                subtasks: habitFormData.subtasks
            };

            // Optimistic update for faster UI response
            const newHabits = [...habits, newHabit];
            setHabits(newHabits);

            // Background save to server
            await Promise.all([
                driveManager.createHabit(currentSheetId, newHabit),
                setCache(CACHE_KEYS.HABITS, newHabits, CACHE_TTL.HABITS)
            ]);

            return newHabit;
        } catch (error) {
            console.error("Error creating habit:", error);

            // Revert optimistic update on error
            setHabits(habits);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi tạo thói quen");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Update habit with optimistic updates and caching
    const handleUpdateHabit = useCallback(async (habit: Habit) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Optimistic update
            const updatedHabits = habits.map(h => h.id === habit.id ? habit : h);
            setHabits(updatedHabits);

            // Background save
            await Promise.all([
                driveManager.updateHabit(currentSheetId, habit),
                setCache(CACHE_KEYS.HABITS, updatedHabits, CACHE_TTL.HABITS)
            ]);

        } catch (error) {
            console.error("Error updating habit:", error);

            // Revert optimistic update
            setHabits(habits);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi cập nhật thói quen");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Delete habit with optimistic updates
    const handleDeleteHabit = useCallback(async (habitId: string) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Optimistic update
            const updatedHabits = habits.filter(h => h.id !== habitId);
            setHabits(updatedHabits);

            // Background save
            await Promise.all([
                driveManager.deleteHabit(currentSheetId, habitId),
                setCache(CACHE_KEYS.HABITS, updatedHabits, CACHE_TTL.HABITS)
            ]);

        } catch (error) {
            console.error("Error deleting habit:", error);

            // Revert optimistic update
            setHabits(habits);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi xóa thói quen");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Archive habit with optimistic updates
    const handleArchiveHabit = useCallback(async (habitId: string, archive: boolean) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Optimistic update
            const updatedHabits = habits.map(h =>
                h.id === habitId ? { ...h, isArchived: archive } : h
            );
            setHabits(updatedHabits);

            // Background save
            await Promise.all([
                driveManager.archiveHabit(currentSheetId, habitId, archive),
                setCache(CACHE_KEYS.HABITS, updatedHabits, CACHE_TTL.HABITS)
            ]);

        } catch (error) {
            console.error("Error archiving habit:", error);

            // Revert optimistic update
            setHabits(habits);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi lưu trữ thói quen");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Update daily habit tracking
    const handleUpdateDailyHabit = useCallback(async (habitId: string, day: number, value: number) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Optimistic update
            const updatedHabits = habits.map(h => {
                if (h.id === habitId) {
                    const newTracking = [...h.dailyTracking];
                    newTracking[day - 1] = value;
                    return { ...h, dailyTracking: newTracking };
                }
                return h;
            });
            setHabits(updatedHabits);

            // Background save
            await Promise.all([
                driveManager.updateDailyHabit(currentSheetId, habitId, day, value),
                setCache(CACHE_KEYS.HABITS, updatedHabits, CACHE_TTL.HABITS)
            ]);

        } catch (error) {
            console.error("Error updating daily habit:", error);

            // Revert optimistic update
            setHabits(habits);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi cập nhật theo dõi hàng ngày");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habits, setCache]);

    // Background refresh without blocking UI
    const handleRefresh = useCallback(async () => {
        if (!currentSheetId || !driveManager) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        // Don't show loading for refresh
        try {
            const habitsData = await driveManager.readHabits(currentSheetId);
            setHabits(habitsData);
            await setCache(CACHE_KEYS.HABITS, habitsData, CACHE_TTL.HABITS);
        } catch (error) {
            console.error('Error refreshing data:', error);

            if (error instanceof Error) {
                if (error.message.includes('403') || error.message.includes('permission')) {
                    setNeedsReauth(true);
                    setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
                } else {
                    setError(`Lỗi làm mới dữ liệu: ${error.message}`);
                }
            } else {
                setError("Lỗi làm mới dữ liệu");
            }
        }
    }, [driveManager, currentSheetId, setCache]);

    const handleLogin = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            await authManager.login();
            setPermissions(prev => ({ ...prev, checked: false }));
        } catch (err) {
            console.error("Login error:", err);
            setError("Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [authManager]);

    const handleLogout = useCallback(async () => {
        try {
            await authManager.logout();
            setHabits([]);
            setError(null);
            setNeedsReauth(false);
            setCurrentSheetId(null);
            setInitialized(false);
            setPermissions({
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                checked: false
            });

            // Clear all caches
            chrome.storage.local.clear();
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [authManager]);

    const handleForceReauth = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            await authManager.forceReauth();
            setPermissions(prev => ({ ...prev, checked: false }));
            setNeedsReauth(false);
        } catch (err) {
            console.error("Force reauth error:", err);
            setError("Cấp quyền thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [authManager]);

    // Auto-sync every 5 minutes
    useEffect(() => {
        if (initialized && !syncInProgress.current) {
            const interval = setInterval(() => {
                syncInBackground();
            }, 5 * 60 * 1000); // 5 minutes

            return () => clearInterval(interval);
        }
    }, [initialized, syncInBackground]);

    // Return all existing functions plus new optimizations
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
        loadingProgress, // ADD THIS LINE

        // Actions
        handleLogin,
        handleLogout,
        handleCreateHabit,
        handleUpdateHabit,
        handleDeleteHabit,
        handleArchiveHabit,
        handleUpdateDailyHabit,
        handleRefresh,
        handleForceReauth,
        checkPermissions,

        // New optimized actions
        fastAutoInitialize,
        syncInBackground,

        // Computed data
        getActiveHabits: useCallback(() => habits.filter(habit => !habit.isArchived), [habits]),
        getTodayStats: useCallback(() => {
            const today = new Date().getDate();
            const activeHabits = habits.filter(habit => !habit.isArchived);

            let completed = 0;
            let total = activeHabits.length;

            activeHabits.forEach(habit => {
                const dayIndex = today - 1;
                const value = habit.dailyTracking[dayIndex];

                if (value !== null) {
                    let isCompleted = false;
                    if (habit.habitType === 'good') {
                        isCompleted = habit.goal ? value >= habit.goal : value > 0;
                    } else {
                        isCompleted = habit.limit ? value <= habit.limit : value === 0;
                    }

                    if (isCompleted) {
                        completed++;
                    }
                }
            });

            return {
                completed,
                total,
                remaining: total - completed,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }, [habits])
    };
};