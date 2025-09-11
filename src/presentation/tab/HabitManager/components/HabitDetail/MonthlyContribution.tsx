import React, { useMemo } from "react";
import { Habit } from "../../types/types";
import { Calendar, Target, CheckCircle, Award, Flame } from "lucide-react";

interface MonthlyContributionProps {
  habit?: Habit;
  selectedDate: Date;
}

const MonthlyContribution: React.FC<MonthlyContributionProps> = ({
  habit,
  selectedDate,
}) => {
  if (!habit) return null;

  const calendarData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1);

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Calculate number of weeks needed (5 or 6)
    const totalCells = firstDayOfWeek + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);

    const calendarGrid: Array<
      Array<{
        date: Date | null;
        dayNumber: number | null;
        completed: boolean;
        completionCount: number;
        isCurrentMonth: boolean;
      }>
    > = [];

    let dayCounter = 1;

    for (let week = 0; week < weeksNeeded; week++) {
      const weekData = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellIndex = week * 7 + dayOfWeek;
        let date: Date | null = null;
        let dayNumber: number | null = null;
        let completed = false;
        let completionCount = 0;
        let isCurrentMonth = false;

        if (cellIndex >= firstDayOfWeek && dayCounter <= daysInMonth) {
          // Current month day
          date = new Date(year, month, dayCounter);
          dayNumber = dayCounter;
          isCurrentMonth = true;

          // Get completion data from habit.dailyCounts
          const dayIndex = dayCounter - 1;
          if (dayIndex >= 0 && dayIndex < habit.dailyCounts.length) {
            completionCount = habit.dailyCounts[dayIndex] || 0;
            completed = completionCount > 0;
          }

          dayCounter++;
        } else if (cellIndex < firstDayOfWeek) {
          // Previous month days
          const prevMonth = month === 0 ? 11 : month - 1;
          const prevYear = month === 0 ? year - 1 : year;
          const daysInPrevMonth = new Date(
            prevYear,
            prevMonth + 1,
            0
          ).getDate();
          const prevMonthDay =
            daysInPrevMonth - (firstDayOfWeek - cellIndex - 1);

          date = new Date(prevYear, prevMonth, prevMonthDay);
          dayNumber = prevMonthDay;
          isCurrentMonth = false;
        } else {
          // Next month days
          const nextMonth = month === 11 ? 0 : month + 1;
          const nextYear = month === 11 ? year + 1 : year;
          const nextMonthDay = cellIndex - firstDayOfWeek - daysInMonth + 1;

          date = new Date(nextYear, nextMonth, nextMonthDay);
          dayNumber = nextMonthDay;
          isCurrentMonth = false;
        }

        weekData.push({
          date,
          dayNumber,
          completed,
          completionCount,
          isCurrentMonth,
        });
      }

      calendarGrid.push(weekData);
    }

    return calendarGrid;
  }, [habit, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const currentMonthDays = calendarData
      .flat()
      .filter((day) => day.isCurrentMonth);

    const completedDays = currentMonthDays.filter(
      (day) => day.completed
    ).length;
    const totalDays = currentMonthDays.length;
    const completionRate =
      totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const currentDay = today.getDate();

    // Count backwards from current day
    for (let i = currentDay - 1; i >= 0; i--) {
      if (habit.dailyCounts[i] > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate total completions this month
    const totalCompletions = currentMonthDays.reduce(
      (sum, day) => sum + day.completionCount,
      0
    );

    return {
      completedDays,
      totalDays,
      completionRate,
      currentStreak,
      totalCompletions,
    };
  }, [calendarData, habit]);

  const getIntensityColor = (day: any) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-50 dark:bg-gray-900 opacity-30";
    }

    if (!day.completed) {
      return "bg-gray-100 dark:bg-gray-800";
    }

    // Use completion count for intensity
    const intensity = Math.min(
      day.completionCount / (habit.goal || habit.limit || 1),
      1
    );

    if (intensity >= 1) return "bg-emerald-600 dark:bg-emerald-500";
    if (intensity >= 0.7) return "bg-emerald-500 dark:bg-emerald-600";
    if (intensity >= 0.4) return "bg-emerald-400 dark:bg-emerald-500";
    return "bg-emerald-300 dark:bg-emerald-400";
  };

  const getTooltipText = (day: any) => {
    if (!day.date) return "";

    const dateStr = day.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    if (!day.isCurrentMonth) {
      return dateStr;
    }

    return `${dateStr}: ${
      day.completed
        ? `✅ Completed (${day.completionCount})`
        : "❌ Not completed"
    }`;
  };

  const monthName = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Monthly Progress
            </h3>
            <p className="text-sm text-text-secondary">{monthName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-text-secondary">Completion</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              COMPLETED
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {stats.completedDays}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">
            of {stats.totalDays} days
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              STREAK
            </span>
          </div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            current days
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              TOTAL
            </span>
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {stats.totalCompletions}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            completions
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              SUCCESS
            </span>
          </div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {stats.completionRate}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            rate
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2 mb-4">
        {/* Day labels */}
        <div className="flex gap-1 mb-2">
          {dayLabels.map((day, index) => (
            <div
              key={index}
              className="w-8 h-6 flex items-center justify-center text-xs font-medium text-text-secondary"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        {calendarData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-8 h-8 rounded-md transition-all duration-200 hover:scale-110 hover:shadow-sm cursor-pointer flex items-center justify-center relative group ${getIntensityColor(
                  day
                )}`}
                title={getTooltipText(day)}
              >
                {day.dayNumber && (
                  <span
                    className={`text-xs font-medium ${
                      day.isCurrentMonth
                        ? day.completed
                          ? "text-white"
                          : "text-text-secondary"
                        : "text-text-secondary opacity-50"
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                )}

                {/* Today indicator */}
                {day.isCurrentMonth &&
                  day.dayNumber === new Date().getDate() && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-gray-800"></div>
                  )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend and Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-border-default">
        <div className="text-xs text-text-secondary">
          {stats.completedDays} of {stats.totalDays} days completed this month
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-emerald-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
          </div>
          <span className="text-xs text-text-secondary">More</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyContribution;
