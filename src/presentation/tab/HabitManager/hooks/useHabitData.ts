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
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

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
        }
    }, [authState.isAuthenticated, authState.user?.accessToken]);

    // Check permissions when authenticated
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && driveManager) {
            checkPermissions();
        }
    }, [authState.isAuthenticated, authState.user, driveManager]);

    // Load data when folder is selected
    useEffect(() => {
        if (selectedFolderId && driveManager && !needsReauth) {
            loadHabitData();
        }
    }, [selectedFolderId, driveManager, needsReauth]);

    const checkPermissions = useCallback(async () => {
        if (!driveManager) return;

        try {
            setLoading(true);
            setError(null);

            // Check if we have drive.file permissions
            const hasPermissions = await authManager.hasDriveFilePermission();
            setNeedsReauth(!hasPermissions);

            if (!hasPermissions) {
                setError("Cần cấp quyền Drive để lưu trữ dữ liệu thói quen. Vui lòng cấp quyền.");
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            setError("Lỗi kiểm tra quyền truy cập");
        } finally {
            setLoading(false);
        }
    }, [driveManager, authManager]);

    const loadHabitData = useCallback(async () => {
        if (!driveManager || !selectedFolderId) {
            console.log('Cannot load data: driveManager or selectedFolderId missing');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Set the selected folder in the drive manager
            driveManager.setSelectedFolder(selectedFolderId);

            // Get current month/year sheet
            const sheetId = await driveManager.getCurrentMonthSheet();
            setCurrentSheetId(sheetId);

            // Load habits and logs
            const [habitsData, logsData] = await Promise.all([
                driveManager.readHabits(sheetId),
                driveManager.readHabitLogs(sheetId)
            ]);

            setHabits(habitsData);
            setHabitLogs(logsData);
        } catch (error) {
            console.error('Error loading habit data:', error);
            setError(error instanceof Error ? error.message : "Lỗi tải dữ liệu thói quen");
        } finally {
            setLoading(false);
        }
    }, [driveManager, selectedFolderId]);

    const handleLogin = useCallback(async () => {
        try {
            await authManager.login();
        } catch (err) {
            console.error("Login error:", err);
            setError("Đăng nhập thất bại. Vui lòng thử lại.");
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
            setSelectedFolderId(null);
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
            // Refresh permissions check after re-auth
            setTimeout(() => {
                checkPermissions();
            }, 500);
        } catch (error) {
            console.error("Re-authentication error:", error);
            setError("Không thể cấp quyền. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [authManager, checkPermissions]);

    const handleSelectFolder = useCallback((folderId: string, folderName: string) => {
        console.log('Folder selected:', folderId, folderName);
        setSelectedFolderId(folderId);
        if (driveManager) {
            driveManager.setSelectedFolder(folderId);
        }
    }, [driveManager]);

    const handleRefresh = useCallback(() => {
        if (selectedFolderId) {
            loadHabitData();
        } else {
            setError("Chưa chọn thư mục lưu trữ");
        }
    }, [loadHabitData, selectedFolderId]);

    const handleCreateHabit = useCallback(async (habitData: Omit<Habit, "id" | "currentCount" | "createdAt">) => {
        if (!driveManager || !currentSheetId) {
            setError("Chưa khởi tạo hệ thống lưu trữ");
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
            setError(error instanceof Error ? error.message : "Lỗi tạo thói quen");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId]);

    const handleUpdateHabit = useCallback(async (habit: Habit) => {
        if (!driveManager || !currentSheetId) {
            setError("Chưa khởi tạo hệ thống lưu trữ");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await driveManager.updateHabit(currentSheetId, habit);
            setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
        } catch (error) {
            console.error("Error updating habit:", error);
            setError(error instanceof Error ? error.message : "Lỗi cập nhật thói quen");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId]);

    const handleDeleteHabit = useCallback(async (habitId: string) => {
        if (!driveManager || !currentSheetId) {
            setError("Chưa khởi tạo hệ thống lưu trữ");
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
            setError(error instanceof Error ? error.message : "Lỗi xóa thói quen");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [driveManager, currentSheetId]);

    const handleLogHabit = useCallback(async (logData: Omit<HabitLog, "timestamp">) => {
        if (!driveManager || !currentSheetId) {
            setError("Chưa khởi tạo hệ thống lưu trữ");
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
            setError(error instanceof Error ? error.message : "Lỗi ghi nhận thói quen");
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
        selectedFolderId,
        handleLogin,
        handleLogout,
        handleCreateHabit,
        handleUpdateHabit,
        handleDeleteHabit,
        handleLogHabit,
        handleRefresh,
        handleForceReauth,
        handleSelectFolder,
    };
};