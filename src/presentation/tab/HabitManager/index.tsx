import React, { useState, useEffect, useCallback } from "react";
import { useHabitData } from "./hooks/useHabitData";
import HabitDialog from "./components/HabitDialog";
import Sidebar from "./components/Sidebar";
import HabitListPanel from "./components/HabitListPanel";
import HabitDetailPanel from "./components/HabitDetailPanel";
import {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  GoodHabit,
  BadHabit,
  DailyStats, // Sửa từ TodayStats sang DailyStats
} from "./types";

const HabitManager: React.FC = () => {
  // 📊 DATA HOOK - Quản lý dữ liệu và authentication
  // ────────────────────────────────────────────────────────────────────────────
  const {
    authState,
    habits,
    loading,
    error,
    needsReauth,
    initialized,
    systemStatus,
    handleCreateHabit,
    handleUpdateHabit,
    handleDeleteHabit,
    handleUpdateDailyHabit,
    handleArchiveHabit,
    getTodayStats,
    getAuthStatus,
    diagnoseAuthIssues,
  } = useHabitData();

  // Mock implementations for missing functions
  const [isAuthReady] = useState(true);
  const handleLogin = useCallback(() => {
    console.log("Login handler not implemented");
  }, []);
  const handleLogout = useCallback(() => {
    console.log("Logout handler not implemented");
  }, []);
  const handleForceReauth = useCallback(() => {
    console.log("Force reauth handler not implemented");
  }, []);
  const handleValidateAuth = useCallback(async () => {
    console.log("Validate auth handler not implemented");
    return { isValid: true, errors: [] };
  }, []);

  // 🎯 COMPONENT STATES - Quản lý trạng thái giao diện
  // ────────────────────────────────────────────────────────────────────────────
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedTab, setSelectedTab] = useState<"active" | "archived">(
    "active"
  );
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "all">(
    "all"
  );
  const [filterType, setFilterType] = useState<HabitType | "all">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState("All habit");
  const [, setCollection] = useState("Default");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // 🔍 AUTH DIAGNOSTICS - Theo dõi trạng thái xác thực
  // ────────────────────────────────────────────────────────────────────────────
  const [authDiagnostics, setAuthDiagnostics] = useState<any>(null);

  // 📝 FORM TEMPLATES - Dữ liệu mẫu cho form
  // ────────────────────────────────────────────────────────────────────────────
  const defaultFormData: HabitFormData = {
    name: "",
    description: "",
    habitType: HabitType.GOOD,
    difficultyLevel: 1,
    goal: 1,
    limit: undefined,
    category: HabitCategory.OTHER,
    tags: [],
    isQuantifiable: true,
    unit: "",
    startTime: "",
    subtasks: [],
    colorCode: "#3b82f6",
  };

  const [habitFormData, setHabitFormData] =
    useState<HabitFormData>(defaultFormData);
  const [editFormData, setEditFormData] =
    useState<HabitFormData>(defaultFormData);

  // 🔄 DIAGNOSTICS EFFECT - Cập nhật diagnostics khi auth state thay đổi
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const updateDiagnostics = async () => {
      try {
        const diagnostics = await diagnoseAuthIssues();
        setAuthDiagnostics(diagnostics);
      } catch (error) {
        console.error("❌ Failed to get diagnostics:", error);
      }
    };

    // 📊 Update diagnostics khi auth state thay đổi
    if (authState.isAuthenticated || authState.error) {
      updateDiagnostics();
    }
  }, [
    authState.isAuthenticated,
    authState.validationStatus?.isValid,
    authState.error,
    diagnoseAuthIssues,
  ]);

  // ⏰ BACKGROUND VALIDATION - Kiểm tra auth định kỳ
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady) return;

    const validationInterval = setInterval(() => {
      console.log("🔄 Periodic auth validation check...");
      handleValidateAuth().catch((error: Error) => {
        console.error("❌ Periodic validation error:", error);
      });
    }, 5 * 60 * 1000); // ⏰ 5 phút

    return () => clearInterval(validationInterval);
  }, [isAuthReady, handleValidateAuth]);

  // 🛠️ HELPER FUNCTIONS - Các hàm tiện ích
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * 🔄 Reset form tạo thói quen
   */
  const resetForm = useCallback(() => {
    setHabitFormData({ ...defaultFormData });
  }, [defaultFormData]);

  /**
   * 🔄 Reset form chỉnh sửa thói quen
   */
  const resetEditForm = useCallback(() => {
    setEditFormData({ ...defaultFormData });
  }, [defaultFormData]);

  /**
   * 📤 Xử lý submit tạo thói quen mới
   * @param formData - Dữ liệu form
   */
  const handleCreateSubmit = useCallback(
    async (formData: HabitFormData) => {
      const result = await handleCreateHabit(formData);
      if (result.success) {
        resetForm();
        setIsCreateDialogOpen(false);
      }
    },
    [handleCreateHabit, resetForm]
  );

  /**
   * 📝 Xử lý submit chỉnh sửa thói quen
   * @param formData - Dữ liệu form
   */
  const handleEditSubmit = useCallback(
    async (formData: HabitFormData) => {
      if (!editingHabit) return;

      // Type-safe habit update
      const baseHabit = {
        ...editingHabit,
        name: formData.name,
        description: formData.description,
        habitType: formData.habitType,
        difficultyLevel: formData.difficultyLevel,
        category: formData.category,
        tags: formData.tags,
        colorCode: formData.colorCode,
      };

      // Type-specific properties
      let updatedHabit: Habit;
      if (formData.habitType === HabitType.GOOD) {
        updatedHabit = {
          ...baseHabit,
          habitType: HabitType.GOOD,
          goal: formData.goal || 1,
          isQuantifiable: formData.isQuantifiable ?? true,
          unit: formData.unit || "",
          startTime: formData.startTime || "",
          subtasks: formData.subtasks || [],
        } as GoodHabit;
      } else {
        // Sửa lỗi: Loại bỏ các thuộc tính không tồn tại trong BadHabit
        updatedHabit = {
          ...baseHabit,
          habitType: HabitType.BAD,
          limit: formData.limit || 1,
          // Loại bỏ isQuantifiable, unit, startTime, subtasks vì không tồn tại trong BadHabit
        } as BadHabit;
      }

      const result = await handleUpdateHabit(updatedHabit);
      if (result.success) {
        setEditingHabit(null);
        resetEditForm();
        setIsCreateDialogOpen(false);
      }
    },
    [editingHabit, handleUpdateHabit, resetEditForm]
  );

  /**
   * ✅ Toggle trạng thái hoàn thành thói quen cho ngày được chọn
   * @param habitId - ID của thói quen
   */
  const handleToggleHabitForDate = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h: Habit) => h.id === habitId);
      if (!habit) return;

      const day = selectedDate.getDate();
      const dayIndex = day - 1;

      // Safe access to dailyTracking với type guard
      const dailyTracking =
        "dailyTracking" in habit ? (habit as any).dailyTracking : [];
      const currentValue = dailyTracking[dayIndex] || 0;

      let newValue: number;
      if (habit.habitType === HabitType.GOOD) {
        const goal = "goal" in habit ? (habit as GoodHabit).goal : 1;
        newValue = currentValue === 0 ? goal : 0;
      } else {
        const limit = "limit" in habit ? (habit as BadHabit).limit : 1;
        newValue = currentValue === 0 ? limit : 0;
      }

      await handleUpdateDailyHabit(habitId, day, newValue);
    },
    [habits, selectedDate, handleUpdateDailyHabit]
  );

  /**
   * 🔍 Kiểm tra thói quen đã hoàn thành cho ngày cụ thể
   * @param habit - Thói quen cần kiểm tra
   * @param date - Ngày cần kiểm tra
   * @returns {boolean} True nếu đã hoàn thành
   */
  const isHabitCompletedForDate = useCallback(
    (habit: Habit, date: Date): boolean => {
      const day = date.getDate();
      const dayIndex = day - 1;

      // Safe access to dailyTracking với type guard
      const dailyTracking =
        "dailyTracking" in habit ? (habit as any).dailyTracking : [];
      const value = dailyTracking[dayIndex];

      if (value === null || value === undefined) return false;

      if (habit.habitType === HabitType.GOOD) {
        const goal = "goal" in habit ? (habit as GoodHabit).goal : 1;
        return goal ? value >= goal : value > 0;
      } else {
        const limit = "limit" in habit ? (habit as BadHabit).limit : 1;
        return limit ? value <= limit : value === 0;
      }
    },
    []
  );

  /**
   * 📖 Mở dialog chỉnh sửa thói quen
   * @param habit - Thói quen cần chỉnh sửa
   */
  const openEditDialog = useCallback((habit: Habit) => {
    setEditingHabit(habit);

    const formData: HabitFormData = {
      name: habit.name,
      description: habit.description || "",
      habitType: habit.habitType,
      difficultyLevel: habit.difficultyLevel,
      goal: "goal" in habit ? (habit as GoodHabit).goal : undefined,
      limit: "limit" in habit ? (habit as BadHabit).limit : undefined,
      category: habit.category,
      tags: habit.tags,
      isQuantifiable:
        "isQuantifiable" in habit ? (habit as GoodHabit).isQuantifiable : true,
      unit: "unit" in habit ? (habit as GoodHabit).unit || "" : "",
      startTime:
        "startTime" in habit ? (habit as GoodHabit).startTime || "" : "",
      subtasks: "subtasks" in habit ? (habit as GoodHabit).subtasks : [],
      colorCode: habit.colorCode,
    };

    setEditFormData(formData);
    setIsCreateDialogOpen(true);
    setSelectedHabit(habit);
  }, []);

  /**
   * ❌ Đóng dialog
   */
  const closeDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setEditingHabit(null);
    resetForm();
    resetEditForm();
  }, [resetForm, resetEditForm]);

  /**
   * ➕ Mở dialog tạo thói quen mới
   */
  const openNewHabitDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
    setEditingHabit(null);
    resetForm();
    resetEditForm();
  }, [resetForm, resetEditForm]);

  /**
   * 📊 Đếm số thói quen đang active
   * @returns {number} Số lượng thói quen active
   */
  const getActiveHabitsCount = useCallback(
    () => habits.filter((h: Habit) => !h.isArchived).length,
    [habits]
  );

  /**
   * 📊 Đếm số thói quen đã archived
   * @returns {number} Số lượng thói quen archived
   */
  const getArchivedHabitsCount = useCallback(
    () => habits.filter((h: Habit) => h.isArchived).length,
    [habits]
  );

  // 🎯 RENDER LOGIC - Xác định trạng thái hiển thị
  // ────────────────────────────────────────────────────────────────────────────

  // 👤 Hiển thị màn hình yêu cầu xác thực
  const shouldShowAuthRequired =
    !authState.isAuthenticated && !authState.loading;

  // 🔄 Hiển thị màn hình yêu cầu xác thực lại
  const shouldShowReauth =
    authState.isAuthenticated &&
    (needsReauth ||
      !authState.validationStatus?.isValid ||
      // Sửa lỗi 6: Thay thế hasValidToken bằng isValid
      (!authState.validationStatus?.isValid &&
        !authState.loading &&
        !authState.isValidating) ||
      // Sửa lỗi 7: Thay thế hasRequiredScopes bằng isValid
      (!authState.validationStatus?.isValid &&
        !authState.loading &&
        !authState.isValidating));

  // ⏳ Hiển thị màn hình loading
  const shouldShowLoading =
    (authState.loading || systemStatus.isInitializing || !initialized) &&
    !shouldShowReauth &&
    !shouldShowAuthRequired;

  console.log("🔍 Render decision:", {
    shouldShowAuthRequired,
    shouldShowReauth,
    shouldShowLoading,
    authState: {
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      isValidating: authState.isValidating,
      // Sửa lỗi 7: Thay thế hasValidToken bằng isValid
      hasValidToken: authState.validationStatus?.isValid,
      // Sửa lỗi 8: Thay thế hasRequiredScopes bằng isValid
      hasRequiredScopes: authState.validationStatus?.isValid,
      isValid: authState.validationStatus?.isValid,
    },
    systemStatus,
    initialized,
  });

  // 👤 RENDER AUTHENTICATION REQUIRED SCREEN
  // ════════════════════════════════════════════════════════════════════════════════
  if (shouldShowAuthRequired) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Google Login Required
          </h3>
          <p className="text-slate-600 mb-6">
            To use habit management features, please sign in with permissions
            for:
          </p>
          <div className="text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Google Drive (File storage)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Google Sheets (Data tracking)
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  // ⏳ RENDER LOADING STATE SCREEN
  // ════════════════════════════════════════════════════════════════════════════════
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Loading Habit Manager
          </h3>
          <p className="text-slate-600 mb-4">
            {authState.isValidating
              ? "Validating authentication..."
              : "Initializing your habit tracker..."}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: initialized
                  ? "100%"
                  : authState.isValidating
                  ? "75%"
                  : "60%",
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 🔄 RENDER REAUTHENTICATION REQUIRED SCREEN
  // ════════════════════════════════════════════════════════════════════════════════
  if (shouldShowReauth) {
    const authStatus = getAuthStatus();
    // Sửa lỗi 8: Thay thế hasValidToken và hasRequiredScopes bằng isValid
    const hasValidToken = authStatus.isValidating && authStatus.hasToken;
    const hasRequiredScopes = authStatus.isValidating;

    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.892-.833-2.664 0L3.133 16.5C2.364 18.167 3.326 19 4.866 19z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {authState.isValidating
              ? "Validating Authentication..."
              : "Authentication Issue Detected"}
          </h3>

          {authState.isValidating ? (
            <div className="mb-6">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600">
                Please wait while we verify your permissions...
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 mb-4">
                Your authentication needs to be refreshed or additional
                permissions are required.
              </p>

              {/* Status display */}
              <div className="text-left mb-6 space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-slate-700 mb-2">
                    Current Status:
                  </div>
                  <div className="space-y-1 text-xs">
                    <div
                      className={`flex items-center gap-2 ${
                        hasValidToken ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${
                          hasValidToken ? "text-green-500" : "text-red-500"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {hasValidToken ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      Access Token {hasValidToken ? "Valid" : "Invalid/Expired"}
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        hasRequiredScopes ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${
                          hasRequiredScopes ? "text-green-500" : "text-red-500"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {hasRequiredScopes ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      Required Permissions{" "}
                      {hasRequiredScopes ? "Granted" : "Missing"}
                    </div>
                  </div>
                </div>

                {authStatus.validationErrors?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-red-700 mb-1">
                      Issues Found:
                    </div>
                    <div className="text-xs text-red-600 space-y-1">
                      {authStatus.validationErrors.map(
                        (error: string, index: number) => (
                          <div key={index}>• {error}</div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {authDiagnostics && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-1">
                      Recommendations:
                    </div>
                    <div className="text-xs text-blue-600 space-y-1">
                      {authDiagnostics.recommendations?.map(
                        (rec: string, index: number) => (
                          <div key={index}>• {rec}</div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleForceReauth}
                  disabled={loading || authState.isValidating}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  {loading || authState.isValidating
                    ? "Refreshing permissions..."
                    : "Refresh Authentication"}
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full bg-slate-500 hover:bg-slate-600 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Sign Out & Start Over
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 🎯 RENDER MAIN APPLICATION INTERFACE
  // ════════════════════════════════════════════════════════════════════════════════
  const todayStats = getTodayStats();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
      {/* Sidebar */}
      <Sidebar
        onNewHabit={openNewHabitDialog}
        onDateChange={setSelectedDate}
        onTimeFilterChange={setTimeFilter}
        onCollectionChange={setCollection}
        selectedDate={selectedDate}
      />

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Habit List */}
        <HabitListPanel
          habits={habits}
          selectedDate={selectedDate}
          timeFilter={timeFilter}
          selectedTab={selectedTab}
          filterCategory={filterCategory}
          filterType={filterType}
          loading={loading}
          onToggleHabitComplete={handleToggleHabitForDate}
          onEditHabit={openEditDialog}
          onArchiveHabit={handleArchiveHabit}
          onDeleteHabit={handleDeleteHabit}
          onTabChange={setSelectedTab}
          onCategoryFilterChange={setFilterCategory}
          onTypeFilterChange={setFilterType}
          isHabitCompletedForDate={isHabitCompletedForDate}
          getActiveHabitsCount={getActiveHabitsCount}
          getArchivedHabitsCount={getArchivedHabitsCount}
        />

        {/* Right Panel - Habit Details */}
        <HabitDetailPanel
          selectedHabit={selectedHabit}
          selectedDate={selectedDate}
          todayStats={todayStats as unknown as DailyStats}
        />
      </div>

      {/* Create/Edit Habit Dialog */}
      <HabitDialog
        isOpen={isCreateDialogOpen}
        onClose={closeDialog}
        onSubmit={editingHabit ? handleEditSubmit : handleCreateSubmit}
        editingHabit={editingHabit}
        loading={loading}
        formData={editingHabit ? editFormData : habitFormData}
        onFormChange={editingHabit ? setEditFormData : setHabitFormData}
      />

      {/* Enhanced Error Display */}
      {error && !shouldShowLoading && !shouldShowReauth && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-xl shadow-lg z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              {(error.includes("403") || error.includes("permission")) && (
                <button
                  onClick={handleValidateAuth}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                >
                  Check Authentication Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
