import React, { useState } from "react";
import { Habit, HabitType, HabitCategory } from "../types/types";
import HabitCard from "./HabitList/HabitCard";
import { HABIT_TYPES } from "../constants/constant";

interface HabitListPanelProps {
  habits: Habit[];
  selectedDate: Date;
  timeFilter: string;
  selectedTab: "active" | "archived";
  filterCategory: HabitCategory | "all";
  filterType: HabitType | "all";
  loading: boolean;
  onToggleHabitComplete: (habitId: string) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onTabChange: (tab: "active" | "archived") => void;
  onCategoryFilterChange: (category: HabitCategory | "all") => void;
  onTypeFilterChange: (type: HabitType | "all") => void;
  isHabitCompletedForDate: (habit: Habit | undefined, date: Date) => boolean;
  getActiveHabitsCount: () => number;
  getArchivedHabitsCount: () => number;
  onSelectHabit: (habit: Habit | undefined) => void;
}

const HabitListPanel: React.FC<HabitListPanelProps> = ({
  habits,
  selectedDate,
  timeFilter,
  selectedTab,
  filterCategory,
  filterType,
  loading,
  onToggleHabitComplete,
  onEditHabit,
  onArchiveHabit,
  onDeleteHabit,
  isHabitCompletedForDate,
  onSelectHabit,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Filter habits with null checks
  const filteredHabits = habits.filter((habit) => {
    if (!habit) return false;

    // Filter by archive status
    if (selectedTab === "active" && habit.isArchived) return false;
    if (selectedTab === "archived" && !habit.isArchived) return false;

    // Filter by category
    if (filterCategory !== "all" && habit.category !== filterCategory)
      return false;

    // Filter by type
    if (filterType !== "all" && habit.habitType !== filterType) return false;

    // Filter by time (simplified time filter logic)
    if (timeFilter !== "All habit") {
      // Add your time filtering logic here based on habit.startTime
      // This is a placeholder implementation
      if (
        timeFilter === "Morning" &&
        (!habit.startTime || parseInt(habit.startTime.split(":")[0]) < 6)
      ) {
        return false;
      }
      if (
        timeFilter === "Afternoon" &&
        (!habit.startTime ||
          parseInt(habit.startTime.split(":")[0]) < 12 ||
          parseInt(habit.startTime.split(":")[0]) >= 18)
      ) {
        return false;
      }
      if (
        timeFilter === "Evening" &&
        (!habit.startTime || parseInt(habit.startTime.split(":")[0]) < 18)
      ) {
        return false;
      }
    }

    return true;
  });

  // Separate habits by type
  const goodHabits = filteredHabits.filter(
    (habit) => habit.habitType === HABIT_TYPES.GOOD
  );
  const badHabits = filteredHabits.filter(
    (habit) => habit.habitType === HABIT_TYPES.BAD
  );

  const handleHabitClick = (habit: Habit) => {
    setSelectedHabitId(habit.id);
    onSelectHabit(habit);
  };

  const handleToggleComplete = async (habitId: string) => {
    try {
      await onToggleHabitComplete(habitId);
    } catch (error) {
      // Hiển thị thông báo lỗi nếu cần
      console.error("Failed to toggle habit:", error);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    onEditHabit(habit);
  };

  const handleArchiveHabit = (habitId: string) => {
    onArchiveHabit(habitId);
  };

  const handleDeleteHabit = (habitId: string) => {
    onDeleteHabit(habitId);
  };

  if (loading && habits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Habit List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Good Habits Section */}
        {goodHabits.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-4">
              Good Habits
            </h3>
            <div className="grid gap-3">
              {goodHabits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => handleHabitClick(habit)}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedHabitId === habit.id
                      ? "bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                      : "hover:scale-[1.02]"
                  }`}
                >
                  <HabitCard
                    habit={habit}
                    isCompleted={isHabitCompletedForDate(habit, selectedDate)}
                    onToggleComplete={() => handleToggleComplete(habit.id)}
                    onEdit={() => handleEditHabit(habit)}
                    onArchive={() => handleArchiveHabit(habit.id)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                    loading={loading}
                    completedCount={
                      habit.dailyCounts?.[selectedDate.getDate() - 1] || 0
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bad Habits Section */}
        {badHabits.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-red-700 mb-4">
              Bad Habits
            </h3>
            <div className="grid gap-3">
              {badHabits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => handleHabitClick(habit)}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedHabitId === habit.id
                      ? "bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                      : "hover:scale-[1.02]"
                  }`}
                >
                  <HabitCard
                    habit={habit}
                    isCompleted={isHabitCompletedForDate(habit, selectedDate)}
                    onToggleComplete={() => handleToggleComplete(habit.id)}
                    onEdit={() => handleEditHabit(habit)}
                    onArchive={() => handleArchiveHabit(habit.id)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                    loading={loading}
                    completedCount={
                      habit.dailyCounts?.[selectedDate.getDate() - 1] || 0
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredHabits.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No habits found
            </h3>
            <p className="text-gray-600">
              {selectedTab === "active"
                ? "Create your first habit to get started!"
                : "No archived habits yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitListPanel;
