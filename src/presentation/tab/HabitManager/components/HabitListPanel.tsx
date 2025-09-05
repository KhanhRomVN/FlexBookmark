// src/presentation/tab/HabitManager/components/HabitListPanel.tsx
import React from "react";
import HabitCard from "./HabitList/HabitCard";
import { Habit } from "../types/types";
import { HabitType, HabitCategory } from "../constants/constant";

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
  onArchiveHabit: (habitId: string, archive: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
  onTabChange: (tab: "active" | "archived") => void;
  onCategoryFilterChange: (category: HabitCategory | "all") => void;
  onTypeFilterChange: (type: HabitType | "all") => void;
  isHabitCompletedForDate: (habit: Habit, date: Date) => boolean;
  getActiveHabitsCount: () => number;
  getArchivedHabitsCount: () => number;
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
}) => {
  // Helper function to determine time category based on startTime
  const getTimeCategory = (startTime?: string): string => {
    if (!startTime) return "Today";

    const [hours] = startTime.split(":").map(Number);

    if (hours >= 6 && hours < 12) return "Morning";
    if (hours >= 12 && hours < 18) return "Afternoon";
    if (hours >= 18 || hours < 6) return "Evening";

    return "Today";
  };

  // Filter habits based on time filter
  const getFilteredHabitsByTime = (habitsToFilter: Habit[]): Habit[] => {
    if (timeFilter === "All habit") return habitsToFilter;

    return habitsToFilter.filter((habit) => {
      const timeCategory = getTimeCategory(habit.startTime);

      if (timeFilter === "Morning")
        return timeCategory === "Morning" || timeCategory === "Today";
      if (timeFilter === "Afternoon")
        return timeCategory === "Afternoon" || timeCategory === "Today";
      if (timeFilter === "Evening")
        return timeCategory === "Evening" || timeCategory === "Today";

      return true;
    });
  };

  // Filter habits based on all criteria
  const filteredHabits = habits.filter((habit) => {
    const matchesTab =
      selectedTab === "active" ? !habit.isArchived : habit.isArchived;
    const matchesCategory =
      filterCategory === "all" || habit.category === filterCategory;
    const matchesType = filterType === "all" || habit.habitType === filterType;
    return matchesTab && matchesCategory && matchesType;
  });

  const timeFilteredHabits = getFilteredHabitsByTime(filteredHabits);

  // Group habits by time category
  const groupedHabits = {
    Today: timeFilteredHabits.filter(
      (habit) => getTimeCategory(habit.startTime) === "Today"
    ),
    Morning: timeFilteredHabits.filter(
      (habit) => getTimeCategory(habit.startTime) === "Morning"
    ),
    Afternoon: timeFilteredHabits.filter(
      (habit) => getTimeCategory(habit.startTime) === "Afternoon"
    ),
    Evening: timeFilteredHabits.filter(
      (habit) => getTimeCategory(habit.startTime) === "Evening"
    ),
  };

  const renderHabitSection = (title: string, sectionHabits: Habit[]) => {
    if (sectionHabits.length === 0) return null;

    return (
      <div key={title} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <span className="px-2 py-1 bg-card-background text-text-secondary text-xs rounded-full font-medium">
            {sectionHabits.length}
          </span>
        </div>

        <div className="space-y-4">
          {sectionHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={isHabitCompletedForDate(habit, selectedDate)}
              onToggleComplete={() => onToggleHabitComplete(habit.id)}
              onEdit={() => onEditHabit(habit)}
              onArchive={() => onArchiveHabit(habit.id, !habit.isArchived)}
              onDelete={() => onDeleteHabit(habit.id)}
              loading={loading}
              showActions={true}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background p-6">
      {/* Header with tabs and filters */}
      <div className="pb-6 border-b border-default mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("active")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === "active"
                  ? "bg-button-bg text-button-bgText shadow-lg"
                  : "bg-card-background text-text-primary hover:bg-button-second-bg"
              }`}
            >
              Active ({getActiveHabitsCount()})
            </button>
            <button
              onClick={() => onTabChange("archived")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === "archived"
                  ? "bg-slate-500 text-white shadow-lg"
                  : "bg-card-background text-text-primary hover:bg-button-second-bg"
              }`}
            >
              Archived ({getArchivedHabitsCount()})
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as HabitCategory | "all")
              }
              className="px-3 py-2 bg-input-background border border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-border-focus"
            >
              <option value="all">All Categories</option>
              <option value="health">🏥 Health</option>
              <option value="fitness">💪 Fitness</option>
              <option value="productivity">⚡ Productivity</option>
              <option value="mindfulness">🧘 Mindfulness</option>
              <option value="learning">📚 Learning</option>
              <option value="social">👥 Social</option>
              <option value="finance">💰 Finance</option>
              <option value="creativity">🎨 Creativity</option>
              <option value="other">📌 Other</option>
            </select>

            <select
              value={filterType}
              onChange={(e) =>
                onTypeFilterChange(e.target.value as HabitType | "all")
              }
              className="px-3 py-2 bg-input-background border border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-border-focus"
            >
              <option value="all">All Types</option>
              <option value="good">Good Habits</option>
              <option value="bad">Bad Habits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Show selected date */}
      <div className="mb-6 p-4 bg-card-background rounded-xl border border-default">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Viewing habits for{" "}
          {selectedDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <p className="text-sm text-text-secondary">
          Time filter:{" "}
          <span className="font-medium text-primary">{timeFilter}</span>
        </p>
      </div>

      {/* Habits grouped by time */}
      <div className="flex-1 overflow-auto">
        {timeFilter === "All habit" ? (
          <div>
            {renderHabitSection("Today", groupedHabits.Today)}
            {renderHabitSection("Morning", groupedHabits.Morning)}
            {renderHabitSection("Afternoon", groupedHabits.Afternoon)}
            {renderHabitSection("Evening", groupedHabits.Evening)}
          </div>
        ) : (
          <div>{renderHabitSection(timeFilter, timeFilteredHabits)}</div>
        )}

        {/* Empty state */}
        {timeFilteredHabits.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-card-background rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {selectedTab === "active"
                ? "No active habits"
                : "No archived habits"}
            </h3>
            <p className="text-text-secondary">
              {selectedTab === "active"
                ? timeFilter === "All habit"
                  ? "Start building good habits by creating your first one"
                  : `No habits scheduled for ${timeFilter.toLowerCase()}`
                : "Archived habits will appear here"}
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading habits...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitListPanel;
