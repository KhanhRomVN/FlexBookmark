import React, { useMemo } from "react";
import { Habit } from "../../types/types";
import { Calendar, TrendingUp, Award, Target } from "lucide-react";

interface YearlyCalendarContributeProps {
  habit?: Habit;
  habits?: Habit[];
  selectedYear?: number;
}

const YearlyCalendarContribute: React.FC<YearlyCalendarContributeProps> = ({
  habit,
  habits,
  selectedYear = new Date().getFullYear(),
}) => {
  const calendarData = useMemo(() => {
    // Create 48 weeks x 7 days grid
    const weeks = 48;
    const daysPerWeek = 7;

    // Start from January 1st of selected year
    const startDate = new Date(selectedYear, 0, 1);
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Adjust to make Monday the first row (index 0)
    const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const calendarGrid: Array<
      Array<{
        date: Date | null;
        dayIndex: number;
        completed: boolean;
        completionCount: number;
        isCurrentYear: boolean;
      }>
    > = [];

    for (let week = 0; week < weeks; week++) {
      const weekData = [];

      for (let dayOfWeek = 0; dayOfWeek < daysPerWeek; dayOfWeek++) {
        // Calculate the actual date
        const daysSinceStart = week * 7 + dayOfWeek - mondayOffset;
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + daysSinceStart);

        // Check if this date is within the selected year
        const isCurrentYear = currentDate.getFullYear() === selectedYear;

        let completed = false;
        let completionCount = 0;

        if (isCurrentYear) {
          if (habit) {
            // Single habit mode
            const dayOfYear = Math.floor(
              (currentDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (dayOfYear >= 0 && dayOfYear < habit.dailyCounts.length) {
              completionCount = habit.dailyCounts[dayOfYear] || 0;
              completed = completionCount > 0;
            }
          } else if (habits) {
            // Multiple habits mode - count how many habits were completed on this day
            const activeHabits = habits.filter((h) => !h.isArchived);
            const dayOfYear = Math.floor(
              (currentDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            completionCount = activeHabits.reduce((count, h) => {
              if (dayOfYear >= 0 && dayOfYear < h.dailyCounts.length) {
                return count + (h.dailyCounts[dayOfYear] > 0 ? 1 : 0);
              }
              return count;
            }, 0);

            completed = completionCount > 0;
          }
        }

        weekData.push({
          date: isCurrentYear ? currentDate : null,
          dayIndex: dayOfWeek,
          completed,
          completionCount,
          isCurrentYear,
        });
      }

      calendarGrid.push(weekData);
    }

    return calendarGrid;
  }, [habit, habits, selectedYear]);

  // Calculate statistics
  const stats = useMemo(() => {
    const validDays = calendarData
      .flat()
      .filter((day) => day.isCurrentYear && day.date);
    const completedDays = validDays.filter((day) => day.completed).length;
    const totalDays = validDays.length;
    const completionRate =
      totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Find longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakEnd = false;

    for (const day of validDays) {
      if (day.completed) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreakEnd = false;
      } else {
        if (!currentStreakEnd) {
          currentStreakEnd = true;
        }
        currentStreak = 0;
      }
    }

    // Calculate current active streak (from the end)
    currentStreak = 0;
    const reversedDays = [...validDays].reverse();
    for (const day of reversedDays) {
      if (day.completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      completedDays,
      totalDays,
      completionRate,
      longestStreak,
      currentStreak,
    };
  }, [calendarData]);

  const getIntensityColor = (day: any) => {
    if (!day.isCurrentYear || !day.completed) {
      return "bg-gray-100 dark:bg-gray-800";
    }

    if (habit) {
      // Single habit - use completion count intensity
      const intensity = Math.min(
        day.completionCount / (habit.goal || habit.limit || 1),
        1
      );
      if (intensity >= 1) return "bg-emerald-600";
      if (intensity >= 0.7) return "bg-emerald-500";
      if (intensity >= 0.4) return "bg-emerald-400";
      return "bg-emerald-300";
    } else if (habits) {
      // Multiple habits - use completion ratio
      const activeHabits = habits.filter((h) => !h.isArchived).length;
      if (activeHabits === 0) return "bg-gray-100 dark:bg-gray-800";

      const ratio = day.completionCount / activeHabits;
      if (ratio >= 0.8) return "bg-blue-600";
      if (ratio >= 0.6) return "bg-blue-500";
      if (ratio >= 0.4) return "bg-blue-400";
      return "bg-blue-300";
    }

    return "bg-gray-300";
  };

  const getTooltipText = (day: any) => {
    if (!day.isCurrentYear || !day.date) return "";

    const dateStr = day.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (habit) {
      return `${dateStr}: ${
        day.completed
          ? `✅ Completed (${day.completionCount})`
          : "❌ Not completed"
      }`;
    } else if (habits) {
      const activeHabits = habits.filter((h) => !h.isArchived).length;
      return `${dateStr}: ${day.completionCount}/${activeHabits} habits completed`;
    }

    return dateStr;
  };

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {selectedYear} Contribution
            </h3>
            <p className="text-sm text-text-secondary">
              {habit ? habit.name : "All habits"} yearly overview
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-text-secondary">Completion</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              TOTAL
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {stats.completedDays}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">
            days active
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              CURRENT
            </span>
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">streak</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              LONGEST
            </span>
          </div>
          <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {stats.longestStreak}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            streak
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">📅</span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              RATE
            </span>
          </div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            success
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Calendar Grid - 7 rows x 48 columns */}
        {Array.from({ length: 7 }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {calendarData.map((week, weekIndex) => {
              const day = week[rowIndex];
              return (
                <div
                  key={`${weekIndex}-${rowIndex}`}
                  className={`w-3 h-3 rounded-sm transition-all duration-200 hover:scale-110 ${getIntensityColor(
                    day
                  )} ${!day.isCurrentYear ? "opacity-30" : ""}`}
                  title={getTooltipText(day)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
        <div className="text-xs text-text-secondary">
          {stats.completedDays} contributions in {selectedYear}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
            <div
              className={`w-3 h-3 rounded-sm ${
                habit ? "bg-emerald-300" : "bg-blue-300"
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-sm ${
                habit ? "bg-emerald-400" : "bg-blue-400"
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-sm ${
                habit ? "bg-emerald-500" : "bg-blue-500"
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-sm ${
                habit ? "bg-emerald-600" : "bg-blue-600"
              }`}
            ></div>
          </div>
          <span className="text-xs text-text-secondary">More</span>
        </div>
      </div>
    </div>
  );
};

export default YearlyCalendarContribute;
