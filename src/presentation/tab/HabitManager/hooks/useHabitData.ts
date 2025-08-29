// src/presentation/tab/HabitManager/hooks/useHabitData.ts
// Enhanced hook with comprehensive permission checking for Sheets API

import { useState, useEffect, useCallback } from "react";
import { DriveFileManager } from "../../../../utils/driveFileManager";
import ChromeAuthManager, { AuthState } from "../../../../utils/chromeAuth";

export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly";
    targetCount: number;
    currentCount: number;
    createdAt: Date;
    color?: string;
}

export interface HabitLog {
    date: string; // YYYY-MM-DD format
    habitId: string;
    completed: boolean;
    note?: string;
    timestamp?: number;
}

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
    const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
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

            // Load habits and logs
            const [habitsData, logsData] = await Promise.all([
                driveManager.readHabits(sheetId),
                driveManager.readHabitLogs(sheetId)
            ]);

            setHabits(habitsData);
            setHabitLogs(logsData);
            setInitialized(true);

            console.log(`Auto-initialization completed. Loaded ${habitsData.length} habits and ${logsData.length} logs`);

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
            setHabitLogs([]);
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
            const [habitsData, logsData] = await Promise.all([
                driveManager.readHabits(currentSheetId),
                driveManager.readHabitLogs(currentSheetId)
            ]);

            setHabits(habitsData);
            setHabitLogs(logsData);
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

    const handleCreateHabit = useCallback(async (habitData: Omit<Habit, "id" | "currentCount" | "createdAt">) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newHabit: Habit = {
                ...habitData,
                id: Date.now().toString(),
                currentCount: 0,
                createdAt: new Date(),
            };

            await driveManager.createHabit(currentSheetId, newHabit);
            setHabits(prev => [...prev, newHabit]);
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
            setHabitLogs(prev => prev.filter(log => log.habitId !== habitId));
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

    const handleLogHabit = useCallback(async (logData: Omit<HabitLog, "timestamp">) => {
        if (!driveManager || !currentSheetId) {
            setError("Hệ thống chưa được khởi tạo");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const log: HabitLog = {
                ...logData,
                timestamp: Date.now(),
            };

            await driveManager.logHabit(currentSheetId, log);

            // Update local state
            setHabitLogs(prev => {
                const filtered = prev.filter(l => !(l.date === log.date && l.habitId === log.habitId));
                return [...filtered, log];
            });

            // Update habit current count
            setHabits(prev => prev.map(habit => {
                if (habit.id === log.habitId) {
                    const todayLogs = habitLogs.filter(l => l.date === log.date && l.habitId === habit.id);
                    const completedCount = todayLogs.filter(l => l.completed).length + (log.completed ? 1 : 0);
                    return { ...habit, currentCount: completedCount };
                }
                return habit;
            }));
        } catch (error) {
            console.error("Error logging habit:", error);

            if (error instanceof Error && (error.message.includes('403') || error.message.includes('permission'))) {
                setNeedsReauth(true);
                setError("Quyền truy cập hết hạn, vui lòng đăng nhập lại");
            } else {
                setError(error instanceof Error ? error.message : "Lỗi ghi nhận thói quen");
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId, habitLogs]);

    return {
        authState,
        driveManager,
        habits,
        habitLogs,
        loading,
        error,
        currentSheetId,
        needsReauth,
        initialized,
        permissions,
        handleLogin,
        handleLogout,
        handleCreateHabit,
        handleUpdateHabit,
        handleDeleteHabit,
        handleLogHabit,
        handleRefresh,
        handleForceReauth,
        checkPermissions,
    };
};