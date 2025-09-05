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
  onToggleHabitComplete: (habitId: string) => void;
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
  onTabChange,
  onCategoryFilterChange,
  onTypeFilterChange,
  isHabitCompletedForDate,
  getActiveHabitsCount,
  getArchivedHabitsCount,
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

  const handleToggleComplete = (habitId: string) => {
    onToggleHabitComplete(habitId);
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
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Habits</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{getActiveHabitsCount()} Active</span>
            <span>{getArchivedHabitsCount()} Archived</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onTabChange("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === "active"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onTabChange("archived")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === "archived"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Archived
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={filterCategory}
            onChange={(e) =>
              onCategoryFilterChange(e.target.value as HabitCategory | "all")
            }
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="all">All Categories</option>
            <option value="health">Health</option>
            <option value="fitness">Fitness</option>
            <option value="productivity">Productivity</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="learning">Learning</option>
            <option value="social">Social</option>
            <option value="finance">Finance</option>
            <option value="creativity">Creativity</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filterType}
            onChange={(e) =>
              onTypeFilterChange(e.target.value as HabitType | "all")
            }
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="all">All Types</option>
            <option value="good">Good Habits</option>
            <option value="bad">Bad Habits</option>
          </select>
        </div>
      </div>

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
                      ? "ring-2 ring-blue-500 rounded-xl"
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
                      ? "ring-2 ring-blue-500 rounded-xl"
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
