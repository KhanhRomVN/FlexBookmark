import React, { useState, useMemo } from "react";
import { Habit } from "../types/types";
import HabitCard from "./HabitList/HabitCard";
import { HABIT_TYPES } from "../constants/constant";

// Skeleton Loader Component using Tailwind CSS
const SkeletonHabitCard = () => (
  <div className="bg-card-background border border-border-default rounded-xl p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        {/* Habit emoji/icon skeleton */}
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>

        {/* Habit name and description skeleton */}
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    {/* Progress bar skeleton */}
    <div className="mb-3">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full w-3/4"></div>
      </div>
    </div>

    {/* Stats row skeleton */}
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
    </div>
  </div>
);

interface HabitListPanelProps {
  habits: Habit[];
  selectedDate: Date;
  timeFilter: string;
  selectedTab: "active" | "archived";
  filterCategory: string[];
  filterTags: string[];
  filterTimeOfDay: string[];
  showArchived: boolean;
  loading: boolean;
  onToggleHabitComplete: (habitId: string) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habitId: string, isArchived: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
  onTabChange: (tab: "active" | "archived") => void;
  onCategoryFilterChange: (categories: string[]) => void;
  onTagFilterChange: (tags: string[]) => void;
  onTimeOfDayFilterChange: (timeOfDay: string[]) => void;
  onArchiveFilterChange: (showArchived: boolean) => void;
  isHabitCompletedForDate: (habit: Habit | undefined, date: Date) => boolean;
  getActiveHabitsCount: () => number;
  getArchivedHabitsCount: () => number;
  onSelectHabit: (habit: Habit | undefined) => void;
}

const HabitListPanel: React.FC<HabitListPanelProps> = ({
  habits,
  selectedDate,
  filterCategory,
  filterTags,
  filterTimeOfDay,
  showArchived,
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
  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (!habit) return false;

      // Filter by archive status
      if (!showArchived && habit.isArchived) return false;
      if (showArchived && !habit.isArchived) return false;

      // Filter by category
      if (
        filterCategory.length > 0 &&
        !filterCategory.includes(habit.category)
      ) {
        return false;
      }

      // Filter by tags
      if (
        filterTags.length > 0 &&
        !filterTags.some((tag) => habit.tags?.includes(tag))
      ) {
        return false;
      }

      // Filter by time of day
      if (filterTimeOfDay.length > 0 && habit.startTime) {
        const habitHour = parseInt(habit.startTime.split(":")[0]);
        let timeMatch = false;

        for (const timeFilter of filterTimeOfDay) {
          switch (timeFilter) {
            case "morning":
              timeMatch = timeMatch || (habitHour >= 6 && habitHour < 12);
              break;
            case "afternoon":
              timeMatch = timeMatch || (habitHour >= 12 && habitHour < 18);
              break;
            case "evening":
              timeMatch = timeMatch || (habitHour >= 18 && habitHour < 24);
              break;
            case "night":
              timeMatch = timeMatch || (habitHour >= 0 && habitHour < 6);
              break;
          }
        }

        if (!timeMatch) return false;
      }

      return true;
    });
  }, [habits, showArchived, filterCategory, filterTags, filterTimeOfDay]);

  // Separate habits by type and categorize by time status
  const { goodHabits, badHabits } = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    const categorizeHabits = (habits: Habit[]) => {
      const upcoming: Habit[] = [];
      const preparing: Habit[] = [];
      const missed: Habit[] = [];
      const others: Habit[] = [];

      habits.forEach((habit) => {
        if (!habit.startTime) {
          others.push(habit);
          return;
        }

        const habitHour = parseInt(habit.startTime.split(":")[0]);
        const habitMinute = parseInt(habit.startTime.split(":")[1]) || 0;

        // Calculate time difference in minutes
        const currentTotalMinutes = currentHour * 60 + now.getMinutes();
        const habitTotalMinutes = habitHour * 60 + habitMinute;

        let timeDiff = habitTotalMinutes - currentTotalMinutes;

        // Handle cross-day scenarios
        if (timeDiff < -720) {
          // More than 12 hours ago, consider it tomorrow
          timeDiff += 1440;
        } else if (timeDiff > 720) {
          // More than 12 hours ahead, consider it yesterday
          timeDiff -= 1440;
        }

        if (timeDiff > 0 && timeDiff <= 60) {
          upcoming.push(habit);
        } else if (timeDiff > 60) {
          preparing.push(habit);
        } else if (timeDiff < 0 && timeDiff >= -1440) {
          missed.push(habit);
        } else {
          others.push(habit);
        }
      });

      return { upcoming, preparing, missed, others };
    };

    const goodHabits = filteredHabits.filter(
      (habit) => habit.habitType === HABIT_TYPES.GOOD
    );
    const badHabits = filteredHabits.filter(
      (habit) => habit.habitType === HABIT_TYPES.BAD
    );

    return {
      goodHabits: categorizeHabits(goodHabits),
      badHabits: categorizeHabits(badHabits),
    };
  }, [filteredHabits]);

  const handleHabitClick = (habit: Habit) => {
    if (selectedHabitId === habit.id) {
      // If clicking the same habit, deselect it
      setSelectedHabitId(null);
      onSelectHabit(undefined);
    } else {
      // If clicking a different habit, select it
      setSelectedHabitId(habit.id);
      onSelectHabit(habit);
    }
  };

  const handleToggleComplete = async (habitId: string) => {
    try {
      await onToggleHabitComplete(habitId);
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    }
  };

  const handleArchiveHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      onArchiveHabit(habitId, !habit.isArchived);
    }
  };

  const renderHabitSection = (
    title: string,
    habits: Habit[],
    showLabel: boolean = true
  ) => {
    if (habits.length === 0) return null;

    return (
      <div>
        {showLabel && (
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
            {title}
          </h3>
        )}
        <div className="grid gap-3 mb-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
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
                onEdit={() => onEditHabit(habit)}
                onArchive={() => handleArchiveHabit(habit.id)}
                onDelete={() => onDeleteHabit(habit.id)}
                loading={loading}
                completedCount={
                  habit.dailyCounts?.[selectedDate.getDate() - 1] || 0
                }
                isSelected={selectedHabitId === habit.id}
                onSelect={() => handleHabitClick(habit)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasGoodHabits =
    goodHabits.upcoming.length > 0 ||
    goodHabits.preparing.length > 0 ||
    goodHabits.missed.length > 0 ||
    goodHabits.others.length > 0;

  const hasBadHabits =
    badHabits.upcoming.length > 0 ||
    badHabits.preparing.length > 0 ||
    badHabits.missed.length > 0 ||
    badHabits.others.length > 0;

  // Show skeleton loading when loading and no habits
  if (loading && habits.length === 0) {
    return (
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-6 flex items-center gap-2 border-b border-green-200 pb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Good Habits
            </h3>
            {[...Array(3)].map((_, index) => (
              <div key={`good-${index}`} className="mb-4">
                <SkeletonHabitCard />
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-red-700 mb-6 flex items-center gap-2 border-b border-red-200 pb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Bad Habits
            </h3>
            {[...Array(2)].map((_, index) => (
              <div key={`bad-${index}`} className="mb-4">
                <SkeletonHabitCard />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Habit List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Good Habits Section */}
        {hasGoodHabits && (
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-6 flex items-center gap-2 border-b border-green-200 pb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Good Habits
            </h3>

            {renderHabitSection("⏰ Coming up (<1h)", goodHabits.upcoming)}
            {renderHabitSection("📋 Preparing (>1h)", goodHabits.preparing)}
            {renderHabitSection("❌ Missed today", goodHabits.missed)}
            {renderHabitSection(
              "📅 Other habits",
              goodHabits.others,
              goodHabits.others.length > 0
            )}
          </div>
        )}

        {/* Bad Habits Section - Only show if there are bad habits */}
        {hasBadHabits && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-red-700 mb-6 flex items-center gap-2 border-b border-red-200 pb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Bad Habits
            </h3>

            {renderHabitSection("⏰ Coming up (<1h)", badHabits.upcoming)}
            {renderHabitSection("📋 Preparing (>1h)", badHabits.preparing)}
            {renderHabitSection("❌ Missed today", badHabits.missed)}
            {renderHabitSection(
              "📅 Other habits",
              badHabits.others,
              badHabits.others.length > 0
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredHabits.length === 0 && !loading && (
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
            <h3 className="text-lg font-medium mb-2 text-text-primary">
              No habits found
            </h3>
            <p className="text-text-secondary">
              {showArchived
                ? "No archived habits found with current filters"
                : "No active habits found with current filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitListPanel;
