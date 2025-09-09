// src/presentation/tab/HabitManager/index.tsx
import React, { useState, useEffect } from "react";
import { useHabit } from "./hooks/useHabit";
import HabitDialog from "./components/HabitDialog";
import HabitListPanel from "./components/HabitListPanel";
import HabitDetailPanel from "./components/HabitDetailPanel";
import Sidebar from "./components/Sidebar";
import { Habit, HabitFormData } from "./types/types";
import { useAuth } from "../../../contexts/AuthContext";
import ChromeAuthManager from "../../../utils/chromeAuth";

const HabitManager: React.FC = () => {
  const {
    habits,
    loading,
    addHabit,
    updateHabit,
    toggleHabit,
    archiveHabit,
    deleteHabit,
    isBackgroundLoading,
  } = useHabit();

  // Use global auth context instead of local auth state
  const { authState, login } = useAuth();
  const [hasDriveAccess, setHasDriveAccess] = useState(false);

  // New filter states
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    name: "",
    description: "",
    habitType: "good",
    difficultyLevel: 3,
    colorCode: "#3b82f6",
    category: "health",
    subtasks: [],
    tags: [],
  });
  const [selectedTab, setSelectedTab] = useState<"active" | "archived">(
    "active"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeFilter] = useState<string>("All habit");
  useState<string>("Default");
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Check Drive access when auth state changes
  useEffect(() => {
    const checkDriveAccess = async () => {
      if (authState.isAuthenticated && authState.user) {
        const authManager = ChromeAuthManager.getInstance();
        const hasAccess = await authManager.hasRequiredScopes([
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/spreadsheets",
        ]);
        setHasDriveAccess(hasAccess);
      } else {
        setHasDriveAccess(false);
      }
    };

    checkDriveAccess();
  }, [authState.isAuthenticated, authState.user]);

  const handleLogin = async () => {
    await login();
  };

  const handleFormChange = (newFormData: HabitFormData) => {
    setFormData(newFormData);
  };

  const handleSubmitHabit = async (habitFormData: HabitFormData) => {
    try {
      setIsCreatingNew(false);

      if (editingHabit) {
        const updatedHabit: Habit = {
          ...editingHabit,
          ...habitFormData,
          updatedAt: new Date(),
        };
        await updateHabit(updatedHabit);
      } else {
        await addHabit(habitFormData);
      }
      setIsDialogOpen(false);
      setEditingHabit(null);
      setFormData({
        name: "",
        description: "",
        habitType: "good",
        difficultyLevel: 3,
        colorCode: "#3b82f6",
        category: "health",
        subtasks: [],
        tags: [],
      });
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description,
      habitType: habit.habitType,
      difficultyLevel: habit.difficultyLevel,
      goal: habit.goal,
      limit: habit.limit,
      colorCode: habit.colorCode,
      category: habit.category,
      startTime: habit.startTime,
      unit: habit.unit,
      tags: habit.tags || [],
      subtasks: habit.subtasks || [],
      emoji: habit.emoji,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHabit(null);

    if (!isCreatingNew || editingHabit) {
      setFormData({
        name: "",
        description: "",
        habitType: "good",
        difficultyLevel: 3,
        colorCode: "#3b82f6",
        category: "health",
        subtasks: [],
        tags: [],
      });
      setIsCreatingNew(false);
    }
  };

  const handleOpenNewHabitDialog = () => {
    setIsCreatingNew(true);
    setIsDialogOpen(true);
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      description: "",
      habitType: "good",
      difficultyLevel: 3,
      colorCode: "#3b82f6",
      category: "health",
      subtasks: [],
      tags: [],
    });
    setIsCreatingNew(false);
    setIsDialogOpen(false);
  };

  const isHabitCompletedForDate = (
    habit: Habit | undefined,
    date: Date
  ): boolean => {
    if (!habit) return false;
    return (
      habit.completedToday && date.toDateString() === new Date().toDateString()
    );
  };

  const getActiveHabitsCount = () => habits.filter((h) => !h.isArchived).length;
  const getArchivedHabitsCount = () =>
    habits.filter((h) => h.isArchived).length;

  // Calculate today's stats for the detail panel
  const todayStats = {
    completed: habits.filter((h) => h.completedToday && !h.isArchived).length,
    total: habits.filter((h) => !h.isArchived).length,
    remaining: habits.filter((h) => !h.completedToday && !h.isArchived).length,
    completionRate:
      habits.filter((h) => !h.isArchived).length > 0
        ? (habits.filter((h) => h.completedToday && !h.isArchived).length /
            habits.filter((h) => !h.isArchived).length) *
          100
        : 0,
  };

  // Auth state loading
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading auth...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">Authentication required</div>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // No Drive access
  if (!hasDriveAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">Drive access required</div>
        <div className="text-sm text-gray-600 mb-4 text-center">
          Habit Manager requires access to Google Drive to store your habits.
          Please sign in again to grant the necessary permissions.
        </div>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Grant Drive Access
        </button>
      </div>
    );
  }

  // Show background sync indicator
  const showSyncIndicator = isBackgroundLoading && habits.length > 0;

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <Sidebar
        onNewHabit={handleOpenNewHabitDialog}
        onDateChange={setSelectedDate}
        onCategoryFilter={setFilterCategories}
        onTagFilter={setFilterTags}
        onTimeOfDayFilter={setFilterTimeOfDay}
        onArchiveFilter={setShowArchived}
        selectedDate={selectedDate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showSyncIndicator && (
          <div className="bg-blue-50 border-b border-blue-200 p-2 text-center text-sm text-blue-700">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Syncing habits in background...
            </div>
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          {/* Habit List Panel */}
          <div className="flex-1 min-h-0 overflow-auto">
            <HabitListPanel
              habits={habits}
              selectedDate={selectedDate}
              timeFilter={timeFilter}
              selectedTab={selectedTab}
              filterCategory={filterCategories}
              filterTags={filterTags}
              filterTimeOfDay={filterTimeOfDay}
              showArchived={showArchived}
              loading={loading}
              onToggleHabitComplete={(habitId: string) =>
                toggleHabit(habitId, true)
              }
              onEditHabit={handleEditHabit}
              onArchiveHabit={archiveHabit}
              onDeleteHabit={deleteHabit}
              onTabChange={setSelectedTab}
              onCategoryFilterChange={setFilterCategories}
              onTagFilterChange={setFilterTags}
              onTimeOfDayFilterChange={setFilterTimeOfDay}
              onArchiveFilterChange={setShowArchived}
              isHabitCompletedForDate={isHabitCompletedForDate}
              getActiveHabitsCount={getActiveHabitsCount}
              getArchivedHabitsCount={getArchivedHabitsCount}
              onSelectHabit={setSelectedHabit}
              onNewHabit={handleOpenNewHabitDialog}
            />
          </div>

          {/* Habit Detail Panel */}
          <HabitDetailPanel
            selectedHabit={selectedHabit}
            selectedDate={selectedDate}
            todayStats={todayStats}
            habits={habits}
            onToggleHabitComplete={toggleHabit}
            onEditHabit={handleEditHabit}
          />
        </div>

        <HabitDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onReset={handleResetForm}
          isCreatingNew={isCreatingNew}
          onSubmit={handleSubmitHabit}
          editingHabit={editingHabit}
          loading={loading}
          formData={formData}
          onFormChange={handleFormChange}
          existingHabits={habits}
        />
      </div>
    </div>
  );
};

export default HabitManager;
