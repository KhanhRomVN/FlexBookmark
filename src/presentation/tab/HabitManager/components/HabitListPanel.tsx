// src/presentation/tab/HabitManager/components/HabitListPanel.tsx
import React from "react";
import HabitCard from "./HabitList/HabitCard";
import { Habit, HabitType, HabitCategory } from "../types/habit";

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
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
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
    <div className="flex-1 flex flex-col h-full bg-white/30 backdrop-blur-xl rounded-2xl border border-white/20 mx-6 my-6">
      {/* Header with tabs and filters */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("active")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === "active"
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-white/60 text-slate-600 hover:bg-white/80"
              }`}
            >
              Active ({getActiveHabitsCount()})
            </button>
            <button
              onClick={() => onTabChange("archived")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === "archived"
                  ? "bg-slate-500 text-white shadow-lg"
                  : "bg-white/60 text-slate-600 hover:bg-white/80"
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
              className="px-3 py-2 bg-white/60 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="px-3 py-2 bg-white/60 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="good">Good Habits</option>
              <option value="bad">Bad Habits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Show selected date */}
        <div className="mb-6 p-4 bg-white/50 rounded-xl border border-white/30">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Viewing habits for{" "}
            {selectedDate.toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-sm text-slate-600">
            Time filter:{" "}
            <span className="font-medium text-green-600">{timeFilter}</span>
          </p>
        </div>

        {/* Habits grouped by time */}
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
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {selectedTab === "active"
                ? "No active habits"
                : "No archived habits"}
            </h3>
            <p className="text-slate-600">
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
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading habits...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitListPanel;
