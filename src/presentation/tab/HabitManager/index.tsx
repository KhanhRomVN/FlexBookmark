import React, { useState, useEffect } from "react";
import { useHabitData } from "./hooks/useHabitData";
import CreateHabitDialog from "./components/CreateHabitDialog";
import Sidebar from "./components/Sidebar";
import HabitListPanel from "./components/HabitListPanel";
import HabitDetailPanel from "./components/HabitDetailPanel";
import ProgressiveLoadingScreen from "./components/ProgressiveLoadingScreen";
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
    handleLogin,
    handleLogout,
    handleCreateHabit,
    handleUpdateHabit,
    handleDeleteHabit,
    handleUpdateDailyHabit,
    handleArchiveHabit,
    handleRefresh,
    handleForceReauth,
    getTodayStats,
    getActiveHabits,
    syncInBackground,
  } = useHabitData();

  // Loading stages for progressive UI
  const [loadingStage, setLoadingStage] = useState<
    "auth" | "cache" | "permissions" | "sync" | "complete"
  >("auth");
  const [loadingProgress, setLoadingProgress] = useState(0);

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
  const [collection, setCollection] = useState("Default");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const [habitFormData, setHabitFormData] = useState<HabitFormData>({
    name: "",
    description: "",
    habitType: "good",
    difficultyLevel: 1,
    goal: 1,
    limit: undefined,
    category: "other",
    tags: [],
    whyReason: "",
    isQuantifiable: true,
    unit: "",
    startTime: "",
    subtasks: [],
    colorCode: "#3b82f6",
    emoji: "",
  });

  // Progressive loading state management
  useEffect(() => {
    if (authState.loading) {
      setLoadingStage("auth");
      setLoadingProgress(10);
    } else if (authState.isAuthenticated && !permissions.checked) {
      setLoadingStage("cache");
      setLoadingProgress(25);
    } else if (permissions.checked && !permissions.allRequired) {
      setLoadingStage("permissions");
      setLoadingProgress(50);
    } else if (permissions.allRequired && !initialized) {
      setLoadingStage("sync");
      setLoadingProgress(75);
    } else if (initialized) {
      setLoadingStage("complete");
      setLoadingProgress(100);

      // Auto-hide loading screen after brief delay
      setTimeout(() => {
        setLoadingStage("complete");
      }, 500);
    }
  }, [
    authState.loading,
    authState.isAuthenticated,
    permissions.checked,
    permissions.allRequired,
    initialized,
  ]);

  // Background sync trigger
  useEffect(() => {
    if (initialized && habits.length === 0) {
      // If we have no cached data, trigger background sync immediately
      setTimeout(() => syncInBackground(), 100);
    }
  }, [initialized, habits.length, syncInBackground]);

  // Get today's stats
  const todayStats = getTodayStats();

  const resetForm = () => {
    setHabitFormData({
      name: "",
      description: "",
      habitType: "good",
      difficultyLevel: 1,
      goal: 1,
      limit: undefined,
      category: "other",
      tags: [],
      whyReason: "",
      isQuantifiable: true,
      unit: "",
      startTime: "",
      subtasks: [],
      colorCode: "#3b82f6",
      emoji: "",
    });
  };

  const handleCreateSubmit = async (formData: HabitFormData) => {
    await handleCreateHabit(formData);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSubmit = async (habit: Habit) => {
    await handleUpdateHabit(habit);
    setEditingHabit(null);
  };

  const handleToggleHabitForDate = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
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
    setIsCreateDialogOpen(true);
    setSelectedHabit(habit);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingHabit(null);
    resetForm();
  };

  const openNewHabitDialog = () => {
    setIsCreateDialogOpen(true);
    setEditingHabit(null);
    resetForm();
  };

  const getActiveHabitsCount = () => habits.filter((h) => !h.isArchived).length;
  const getArchivedHabitsCount = () =>
    habits.filter((h) => h.isArchived).length;

  // Show progressive loading screen for non-authenticated users
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

  // Show progressive loading screen during initialization
  if (
    loadingStage !== "complete" ||
    authState.loading ||
    (permissions.checked && permissions.allRequired && !initialized)
  ) {
    return (
      <ProgressiveLoadingScreen
        stage={loadingStage}
        progress={loadingProgress}
        showDetails={true}
      />
    );
  }

  // Show permission requirements if not all required permissions are granted
  if (
    authState.isAuthenticated &&
    permissions.checked &&
    (needsReauth || !permissions.allRequired)
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
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
            Additional permissions needed
          </h3>
          <p className="text-slate-600 mb-4">
            The app needs the following permissions to function:
          </p>
          <div className="text-left mb-6 space-y-2">
            <div
              className={`flex items-center gap-2 text-sm ${
                permissions.hasDrive ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  permissions.hasDrive ? "text-green-500" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {permissions.hasDrive ? (
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
              Google Drive {permissions.hasDrive ? "✓" : "✗"}
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                permissions.hasSheets ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  permissions.hasSheets ? "text-green-500" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {permissions.hasSheets ? (
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
              Google Sheets {permissions.hasSheets ? "✓" : "✗"}
            </div>
          </div>
          <button
            onClick={handleForceReauth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {loading
              ? "Granting permissions..."
              : "Grant additional permissions"}
          </button>
        </div>
      </div>
    );
  }

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
      <CreateHabitDialog
        isOpen={isCreateDialogOpen}
        onClose={closeDialog}
        onSubmit={
          editingHabit
            ? () => handleUpdateSubmit(editingHabit)
            : handleCreateSubmit
        }
        editingHabit={editingHabit}
        loading={loading}
        formData={
          editingHabit
            ? {
                name: editingHabit.name,
                description: editingHabit.description,
                habitType: editingHabit.habitType,
                difficultyLevel: editingHabit.difficultyLevel,
                goal: editingHabit.goal,
                limit: editingHabit.limit,
                category: editingHabit.category,
                tags: editingHabit.tags,
                whyReason: editingHabit.whyReason,
                isQuantifiable: editingHabit.isQuantifiable,
                unit: editingHabit.unit,
                startTime: editingHabit.startTime,
                subtasks: editingHabit.subtasks,
                colorCode: editingHabit.colorCode,
                emoji: editingHabit.emoji,
              }
            : habitFormData
        }
        onFormChange={editingHabit ? () => {} : setHabitFormData}
      />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-3">
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
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Background sync indicator */}
      {loadingStage === "sync" && initialized && (
        <div className="fixed top-4 right-4 p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm z-40">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Syncing...
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
