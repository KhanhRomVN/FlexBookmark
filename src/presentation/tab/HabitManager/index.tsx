// src/presentation/tab/HabitManager/index.tsx

import React, { useState, useEffect } from "react";
import { useHabitData } from "./hooks/useHabitData";
import HabitDialog from "./components/HabitDialog";
import Sidebar from "./components/Sidebar";
import HabitListPanel from "./components/HabitListPanel";
import HabitDetailPanel from "./components/HabitDetailPanel";
import { Habit, HabitFormData, HabitType, HabitCategory } from "./types/habit";

const HabitManager: React.FC = () => {
  const {
    authState,
    habits,
    loading,
    error,
    needsReauth,
    permissions,
    initialized,
    systemStatus,
    initStages,
    isAuthReady,
    handleLogin,
    handleLogout,
    handleCreateHabit,
    handleUpdateHabit,
    handleDeleteHabit,
    handleUpdateDailyHabit,
    handleArchiveHabit,
    handleForceReauth,
    handleValidateAuth,
    getTodayStats,
    syncInBackground,
    getAuthStatus,
  } = useHabitData();

  // Component states
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

  // Default form data template
  const defaultFormData: HabitFormData = {
    name: "",
    description: "",
    habitType: "good",
    difficultyLevel: 1,
    goal: 1,
    limit: undefined,
    category: "other",
    tags: [],
    isQuantifiable: true,
    unit: "",
    startTime: "",
    subtasks: [],
    colorCode: "#3b82f6",
  };

  // Separate form states for create and edit
  const [habitFormData, setHabitFormData] =
    useState<HabitFormData>(defaultFormData);
  const [editFormData, setEditFormData] =
    useState<HabitFormData>(defaultFormData);

  // Background validation check every 5 minutes
  useEffect(() => {
    if (!isAuthReady) return;

    const validationInterval = setInterval(async () => {
      try {
        console.log("Periodic auth validation check...");
        const isValid = await handleValidateAuth();
        if (!isValid) {
          console.warn("Periodic validation failed - auth may be invalid");
        }
      } catch (error) {
        console.error("Periodic validation error:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(validationInterval);
  }, [isAuthReady, handleValidateAuth]);

  // Enhanced error handling based on auth status
  useEffect(() => {
    if (error && (error.includes("403") || error.includes("permission"))) {
      console.warn(
        "Detected permission-related error, triggering reauth check"
      );
      handleValidateAuth().then((isValid) => {
        if (!isValid) {
          console.warn(
            "Auth validation failed, system will handle reauth in useHabitData"
          );
        }
      });
    }
  }, [error, handleValidateAuth]);

  // Get current loading stage based on initialization progress
  const getCurrentLoadingStage = ():
    | "auth"
    | "cache"
    | "permissions"
    | "sync"
    | "complete" => {
    if (!authState.isAuthenticated || authState.loading) return "auth";
    if (!authState.validationStatus.isValid || authState.isValidating)
      return "auth";
    if (!permissions.checked) return "cache";
    if (!permissions.allRequired) return "permissions";
    if (!initialized) return "sync";
    return "complete";
  };

  const loadingStage = getCurrentLoadingStage();

  // Background sync trigger - only when fully initialized
  useEffect(() => {
    if (initialized && isAuthReady && habits.length === 0) {
      // If we have no cached data and auth is ready, trigger background sync immediately
      setTimeout(() => syncInBackground(), 100);
    }
  }, [initialized, isAuthReady, habits.length, syncInBackground]);

  // Get today's stats
  const todayStats = getTodayStats();

  const resetForm = () => {
    setHabitFormData({ ...defaultFormData });
  };

  const resetEditForm = () => {
    setEditFormData({ ...defaultFormData });
  };

  const handleCreateSubmit = async (formData: HabitFormData) => {
    await handleCreateHabit(formData);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditSubmit = async (formData: HabitFormData) => {
    if (!editingHabit) return;

    const updatedHabit: Habit = {
      ...editingHabit,
      name: formData.name,
      description: formData.description,
      habitType: formData.habitType,
      difficultyLevel: formData.difficultyLevel,
      goal: formData.habitType === "good" ? formData.goal : undefined,
      limit: formData.habitType === "bad" ? formData.limit : undefined,
      category: formData.category,
      tags: formData.tags,
      isQuantifiable: formData.isQuantifiable,
      unit: formData.unit,
      startTime: formData.startTime,
      subtasks: formData.subtasks,
      colorCode: formData.colorCode,
    };

    await handleUpdateHabit(updatedHabit);
    setEditingHabit(null);
    resetEditForm();
    setIsCreateDialogOpen(false);
  };

  const handleToggleHabitForDate = async (habitId: string) => {
    const habit = habits.find((h: { id: string }) => h.id === habitId);
    if (!habit) return;

    const day = selectedDate.getDate();
    const dayIndex = day - 1;
    const currentValue = habit.dailyTracking[dayIndex] || 0;

    let newValue: number;

    if (habit.habitType === "good") {
      newValue = currentValue === 0 ? habit.goal || 1 : 0;
    } else {
      newValue = currentValue === 0 ? habit.limit || 1 : 0;
    }

    await handleUpdateDailyHabit(habitId, day, newValue);
  };

  const isHabitCompletedForDate = (habit: Habit, date: Date): boolean => {
    const day = date.getDate();
    const dayIndex = day - 1;
    const value = habit.dailyTracking[dayIndex];

    if (value === null || value === undefined) return false;

    if (habit.habitType === "good") {
      return habit.goal ? value >= habit.goal : value > 0;
    } else {
      return habit.limit ? value <= habit.limit : value === 0;
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setEditFormData({
      name: habit.name,
      description: habit.description || "",
      habitType: habit.habitType,
      difficultyLevel: habit.difficultyLevel,
      goal: habit.goal,
      limit: habit.limit,
      category: habit.category,
      tags: habit.tags,
      isQuantifiable: habit.isQuantifiable,
      unit: habit.unit || "",
      startTime: habit.startTime || "",
      subtasks: habit.subtasks,
      colorCode: habit.colorCode,
    });
    setIsCreateDialogOpen(true);
    setSelectedHabit(habit);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingHabit(null);
    resetForm();
    resetEditForm();
  };

  const openNewHabitDialog = () => {
    setIsCreateDialogOpen(true);
    setEditingHabit(null);
    resetForm();
    resetEditForm();
  };

  const getActiveHabitsCount = () =>
    habits.filter((h: { isArchived: any }) => !h.isArchived).length;
  const getArchivedHabitsCount = () =>
    habits.filter((h: { isArchived: any }) => h.isArchived).length;

  // Show authentication required screen
  if (!authState.isAuthenticated && !authState.loading) {
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

  // Show enhanced loading screen with validation stages
  if (loadingStage !== "complete" || authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            {authState.isValidating ? "Validating..." : "Loading Habit Manager"}
          </h3>
          <p className="text-slate-600 mb-4">
            {authState.isValidating
              ? "Checking authentication status..."
              : "Initializing your habit tracker..."}
          </p>
        </div>
      </div>
    );
  }

  // Show permission requirements if auth validation failed
  if (
    authState.isAuthenticated &&
    (needsReauth ||
      !authState.validationStatus.isValid ||
      systemStatus.needsReauth)
  ) {
    const authStatus = getAuthStatus();

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
            Authentication Issue Detected
          </h3>

          <p className="text-slate-600 mb-4">
            Your authentication needs to be refreshed or additional permissions
            are required.
          </p>

          {/* Detailed validation status */}
          <div className="text-left mb-6 space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-slate-700 mb-2">
                Current Status:
              </div>
              <div className="space-y-1 text-xs">
                <div
                  className={`flex items-center gap-2 ${
                    authStatus.hasValidToken ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      authStatus.hasValidToken
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {authStatus.hasValidToken ? (
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
                  Access Token{" "}
                  {authStatus.hasValidToken ? "Valid" : "Invalid/Expired"}
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    authStatus.hasRequiredScopes
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      authStatus.hasRequiredScopes
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {authStatus.hasRequiredScopes ? (
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
                  {authStatus.hasRequiredScopes ? "Granted" : "Missing"}
                </div>
              </div>
            </div>

            {authStatus.validationErrors.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-700 mb-1">
                  Issues Found:
                </div>
                <div className="text-xs text-red-600 space-y-1">
                  {authStatus.validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleForceReauth}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing permissions..." : "Refresh Authentication"}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-500 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Sign Out & Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main application interface
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
          todayStats={todayStats}
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

      {/* Enhanced Error Display with Auth Status */}
      {error && (
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
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
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

      {/* Auth Status Indicator - Top Right */}
      <div className="fixed top-4 right-4 z-30">
        {authState.isValidating && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Validating auth...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitManager;
