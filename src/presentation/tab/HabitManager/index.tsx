// src/presentation/tab/HabitManager/index.tsx
import React, { useState, useEffect } from "react";
import { useHabit } from "./hooks/useHabit";
import HabitDialog from "./components/HabitDialog";
import HabitListPanel from "./components/HabitListPanel";
import HabitDetailPanel from "./components/HabitDetailPanel";
import Sidebar from "./components/Sidebar";
import { Habit, HabitFormData } from "./types/types";
import { HabitType, HabitCategory } from "./constants/constant";
import ChromeAuthManager from "../../../utils/chromeAuth";

const HabitManager: React.FC = () => {
  const {
    habits,
    loading,
    error,
    addHabit,
    updateHabit,
    toggleHabit,
    archiveHabit,
    deleteHabit,
    hasDriveAccess,
    isBackgroundLoading,
  } = useHabit();

  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    loading: true,
    hasDriveAccess: false,
  });

  useEffect(() => {
    const authManager = ChromeAuthManager.getInstance();
    const unsubscribe = authManager.subscribe(async (state) => {
      const hasAccess = await authManager.hasRequiredScopes([
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
      ]);

      setAuthState({
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        hasDriveAccess: hasAccess,
      });
    });

    authManager.initialize();

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const authManager = ChromeAuthManager.getInstance();
    await authManager.login();
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>({
    name: "",
    description: "",
    habitType: "good",
    difficultyLevel: 3,
    colorCode: "#3b82f6",
    category: "health",
  });
  const [selectedTab, setSelectedTab] = useState<"active" | "archived">(
    "active"
  );
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "all">(
    "all"
  );
  const [filterType, setFilterType] = useState<HabitType | "all">("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeFilter, setTimeFilter] = useState<string>("All habit");
  const [selectedCollection, setSelectedCollection] =
    useState<string>("Default");
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();

  const handleFormChange = (newFormData: HabitFormData) => {
    setFormData(newFormData);
  };

  const handleSubmitHabit = async (habitFormData: HabitFormData) => {
    try {
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
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHabit(null);
    setFormData({
      name: "",
      description: "",
      habitType: "good",
      difficultyLevel: 3,
      colorCode: "#3b82f6",
      category: "health",
    });
  };

  const isHabitCompletedForDate = (habit: Habit, date: Date): boolean => {
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

  // Auth state
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading auth...
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
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

  if (!authState.hasDriveAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
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

  // Show cached habits immediately, only show loading if no cached data
  if (loading && habits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading habits for the first time...</p>
        </div>
      </div>
    );
  }

  // Show background sync indicator
  const showSyncIndicator = isBackgroundLoading && habits.length > 0;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <Sidebar
        onNewHabit={() => setIsDialogOpen(true)}
        onDateChange={setSelectedDate}
        onTimeFilterChange={setTimeFilter}
        onCollectionChange={setSelectedCollection}
        selectedDate={selectedDate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showSyncIndicator && (
          <div className="bg-blue-50 border-b border-blue-200 p-2 text-center text-sm text-blue-700">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Syncing habits in background...
            </div>
          </div>
        )}

        <div className="flex-1 flex">
          {/* Habit List Panel */}
          <div className="flex-1">
            <HabitListPanel
              habits={habits}
              selectedDate={selectedDate}
              timeFilter={timeFilter}
              selectedTab={selectedTab}
              filterCategory={filterCategory}
              filterType={filterType}
              loading={loading && habits.length === 0}
              onToggleHabitComplete={(habitId) => toggleHabit(habitId, true)}
              onEditHabit={handleEditHabit}
              onArchiveHabit={archiveHabit}
              onDeleteHabit={deleteHabit}
              onTabChange={setSelectedTab}
              onCategoryFilterChange={setFilterCategory}
              onTypeFilterChange={setFilterType}
              isHabitCompletedForDate={isHabitCompletedForDate}
              getActiveHabitsCount={getActiveHabitsCount}
              getArchivedHabitsCount={getArchivedHabitsCount}
            />
          </div>

          {/* Habit Detail Panel */}
          <HabitDetailPanel
            selectedHabit={selectedHabit}
            selectedDate={selectedDate}
            todayStats={todayStats}
          />
        </div>

        <HabitDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitHabit}
          editingHabit={editingHabit}
          loading={loading}
          formData={formData}
          onFormChange={handleFormChange}
        />

        {/* Floating action button */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-button-bg hover:bg-button-bgHover text-white rounded-full 
                   shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HabitManager;
