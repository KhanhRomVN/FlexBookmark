// src/presentation/tab/HabitManager/hooks/useHabitData.ts
// Enhanced hook with comprehensive permission checking for Sheets API

import { useState, useEffect, useCallback } from "react";
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

export const useHabitData = () => {
    const authManager = ChromeAuthManager.getInstance();
    const [driveManager, setDriveManager] = useState<DriveFileManager | null>(null);

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

    // NEW: Track specific permission states
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

    // Auth state subscription
    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState) => {
            setAuthState(newState);
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

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

    // Check permissions when authenticated
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && !permissions.checked) {
            checkPermissions();
        }
    }, [authState.isAuthenticated, authState.user, permissions.checked]);

    // Auto-initialize when permissions are satisfied
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && driveManager &&
            permissions.allRequired && !initialized && !needsReauth) {
            autoInitialize();
        }
    }, [authState.isAuthenticated, authState.user, driveManager,
    permissions.allRequired, initialized, needsReauth]);

    const checkPermissions = useCallback(async () => {
        if (!authState.isAuthenticated || !authState.user) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Checking all required permissions for HabitManager...');
            const permissionCheck = await authManager.hasAllHabitManagerPermissions();

            console.log('Permission check results:', permissionCheck);

            setPermissions({
                ...permissionCheck,
                checked: true
            });

            if (!permissionCheck.allRequired) {
                console.log('Missing required permissions, needs re-auth');
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
    }, [authState.isAuthenticated, authState.user, authManager]);

    const autoInitialize = useCallback(async () => {
        if (!driveManager) {
            console.log('DriveManager not available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Starting auto-initialization...');

            // Double-check permissions before proceeding
            const permissionCheck = await authManager.hasAllHabitManagerPermissions();
            if (!permissionCheck.allRequired) {
                console.log('Permissions no longer valid during initialization');
                setNeedsReauth(true);
                setError('Quyền truy cập không hợp lệ, vui lòng đăng nhập lại');
                setLoading(false);
                return;
            }

            // Auto-initialize the folder structure and get the current month sheet
            const sheetId = await driveManager.autoInitialize();
            setCurrentSheetId(sheetId);

            // Load habits
            const habitsData = await driveManager.readHabits(sheetId);

            setHabits(habitsData);
            setInitialized(true);

            console.log(`Auto-initialization completed. Loaded ${habitsData.length} habits`);

        } catch (error) {
            console.error('Auto-initialization error:', error);

            // Handle specific error types
            if (error instanceof Error) {
                if (error.message.includes('403') || error.message.includes('permission')) {
                    setNeedsReauth(true);
                    setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
                } else if (error.message.includes('CSP') || error.message.includes('Content Security Policy')) {
                    setError("Lỗi bảo mật trình duyệt, vui lòng reload extension");
                } else {
                    setError(`Lỗi khởi tạo: ${error.message}`);
                }
            } else {
                setError("Lỗi khởi tạo hệ thống quản lý thói quen");
            }
        } finally {
            setLoading(false);
        }
    }, [driveManager, authManager]);

    const handleLogin = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            await authManager.login();
            // Reset permission checking state to trigger re-check
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
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [authManager]);

    const handleForceReauth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await authManager.forceReauth();
            setNeedsReauth(false);
            setInitialized(false);

            // Reset and re-check permissions
            setPermissions({
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                checked: false
            });

            // Re-initialize after successful re-auth
            setTimeout(() => {
                if (driveManager) {
                    checkPermissions();
                }
            }, 500);
        } catch (error) {
            console.error("Re-authentication error:", error);
            setError("Không thể cấp quyền. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [authManager, driveManager, checkPermissions]);

    const handleRefresh = useCallback(async () => {
        if (!currentSheetId || !driveManager) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const habitsData = await driveManager.readHabits(currentSheetId);
            setHabits(habitsData);
        } catch (error) {
            console.error('Error refreshing data:', error);

            // Handle specific error types
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
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId]);

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
                emoji: habitFormData.emoji,
                longestStreak: 0,
                category: habitFormData.category,
                tags: habitFormData.tags,
                isArchived: false,
                whyReason: habitFormData.whyReason,
                isQuantifiable: habitFormData.isQuantifiable,
                unit: habitFormData.unit,
                startTime: habitFormData.startTime,
                subtasks: habitFormData.subtasks
            };

            await driveManager.createHabit(currentSheetId, newHabit);
            setHabits(prev => [...prev, newHabit]);

            return newHabit;
        } catch (error) {
            console.error("Error creating habit:", error);

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
    }, [driveManager, currentSheetId]);

    const handleUpdateHabit = useCallback(async (habit: Habit) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await driveManager.updateHabit(currentSheetId, habit);
            setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
        } catch (error) {
            console.error("Error updating habit:", error);

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
    }, [driveManager, currentSheetId]);

    const handleDeleteHabit = useCallback(async (habitId: string) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await driveManager.deleteHabit(currentSheetId, habitId);
            setHabits(prev => prev.filter(h => h.id !== habitId));
        } catch (error) {
            console.error("Error deleting habit:", error);

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
    }, [driveManager, currentSheetId]);

    const handleUpdateDailyHabit = useCallback(async (habitId: string, day: number, value: number) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await driveManager.updateDailyHabit(currentSheetId, habitId, day, value);

            // Update local state
            setHabits(prev => prev.map(habit => {
                if (habit.id === habitId) {
                    const updatedDailyTracking = [...habit.dailyTracking];
                    updatedDailyTracking[day - 1] = value;
                    return { ...habit, dailyTracking: updatedDailyTracking };
                }
                return habit;
            }));

            // Refresh to get updated streaks
            await handleRefresh();
        } catch (error) {
            console.error("Error updating daily habit:", error);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi cập nhật thói quen hàng ngày");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, handleRefresh]);

    const handleArchiveHabit = useCallback(async (habitId: string, archive: boolean) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await driveManager.archiveHabit(currentSheetId, habitId, archive);

            // Update local state
            setHabits(prev => prev.map(habit =>
                habit.id === habitId ? { ...habit, isArchived: archive } : habit
            ));
        } catch (error) {
            console.error("Error archiving habit:", error);

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
    }, [driveManager, currentSheetId]);

    const getActiveHabits = useCallback(() => {
        return habits.filter(habit => !habit.isArchived);
    }, [habits]);

    const getHabitsByCategory = useCallback((category: HabitCategory) => {
        return habits.filter(habit => habit.category === category && !habit.isArchived);
    }, [habits]);

    const getHabitsByType = useCallback((habitType: HabitType) => {
        return habits.filter(habit => habit.habitType === habitType && !habit.isArchived);
    }, [habits]);

    // Get today's completion stats
    const getTodayStats = useCallback(() => {
        const today = new Date().getDate();
        const activeHabits = getActiveHabits();

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
    }, [getActiveHabits]);

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

        // Actions
        handleLogin,
        handleLogout,
        handleCreateHabit,
        handleUpdateHabit,
        handleDeleteHabit,
        handleUpdateDailyHabit,
        handleArchiveHabit,
        handleRefresh,
        handleForceReauth,
        checkPermissions,

        // Computed data
        getActiveHabits,
        getHabitsByCategory,
        getHabitsByType,
        getTodayStats,
    };
};