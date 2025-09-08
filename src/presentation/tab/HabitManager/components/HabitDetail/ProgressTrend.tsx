import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
} from "lucide-react";
import { Habit } from "../../types/types";

interface ProgressTrendProps {
  habit: Habit;
  selectedDate: Date;
}

const ProgressTrend: React.FC<ProgressTrendProps> = ({
  habit,
  selectedDate,
}) => {
  const progressData = useMemo(() => {
    // Generate progress data for last 7 days using dailyCounts
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - (6 - i));
      const dayIndex = date.getDate() - 1;

      const count = habit.dailyCounts[dayIndex] || 0;
      const completionRate = habit.goal
        ? Math.min(100, (count / habit.goal) * 100)
        : habit.limit
        ? Math.min(100, (count / habit.limit) * 100)
        : count > 0
        ? 100
        : 0;

      return {
        date,
        completionRate: Math.round(completionRate),
        count,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
      };
    });
  }, [habit, selectedDate]);

  const currentCompletion =
    progressData[progressData.length - 1]?.completionRate || 0;
  const previousCompletion = progressData[0]?.completionRate || 0;
  const trend = currentCompletion - previousCompletion;
  const isImproving = trend > 0;
  const isStable = trend === 0;

  const averageCompletion = Math.round(
    progressData.reduce((sum, d) => sum + d.completionRate, 0) /
      progressData.length
  );

  const completedDays = progressData.filter((d) => d.completionRate > 0).length;
  const maxCompletion = Math.max(...progressData.map((d) => d.completionRate));

  const getTrendMessage = () => {
    if (isStable && currentCompletion > 0) return "Steady performance";
    if (isImproving) return `+${Math.abs(trend)}% improvement`;
    if (trend < 0) return `${trend}% decline`;
    return "No activity";
  };

  const getTrendColor = () => {
    if (isStable && currentCompletion > 0)
      return "text-blue-600 dark:text-blue-400";
    if (isImproving) return "text-emerald-600 dark:text-emerald-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = () => {
    if (isStable) return Activity;
    return isImproving ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Progress Trend
            </h3>
            <p className="text-sm text-text-secondary">
              Last 7 days performance
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {currentCompletion}%
          </div>
          <div className="text-xs text-text-secondary">Today</div>
        </div>
      </div>

      {/* Trend Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Current Performance */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              CURRENT
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {currentCompletion}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            today's rate
          </div>
        </div>

        {/* Weekly Average */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              AVERAGE
            </span>
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {averageCompletion}%
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            7-day average
          </div>
        </div>

        {/* Active Days */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ACTIVE
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {completedDays}/7
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            days completed
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-text-primary">
            Daily Performance
          </span>
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{getTrendMessage()}</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-32 relative bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="absolute inset-4 flex items-end justify-between">
            {progressData.map((data, index) => {
              const height = (data.completionRate / 100) * 96;
              const isCurrent = index === progressData.length - 1;
              const isPeak =
                data.completionRate === maxCompletion && maxCompletion > 0;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  {/* Bar */}
                  <div
                    className={`w-8 mx-1 rounded-t transition-all duration-500 ${
                      isCurrent
                        ? "bg-gradient-to-t from-purple-400 to-purple-600"
                        : isPeak
                        ? "bg-gradient-to-t from-emerald-400 to-emerald-600"
                        : data.completionRate > 0
                        ? "bg-gradient-to-t from-blue-300 to-blue-500"
                        : "bg-gray-200 dark:bg-gray-600"
                    }`}
                    style={{ height: `${Math.max(4, height)}px` }}
                    title={`${data.dayName}: ${data.completionRate}% (${data.count})`}
                  />

                  {/* Day label */}
                  <div className="mt-2 text-center">
                    <div className="text-xs text-text-secondary font-medium">
                      {data.dayName}
                    </div>
                    <div className="text-xs text-text-secondary opacity-75">
                      {data.dayNumber}
                    </div>
                  </div>

                  {/* Percentage label for current day */}
                  {isCurrent && (
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {data.completionRate}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div
        className={`rounded-lg p-4 border ${
          currentCompletion >= 80
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30"
            : currentCompletion >= 60
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30"
            : "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <TrendIcon
            className={`w-5 h-5 ${
              currentCompletion >= 80
                ? "text-emerald-600"
                : currentCompletion >= 60
                ? "text-blue-600"
                : "text-orange-600"
            }`}
          />
          <div>
            <div
              className={`text-sm font-medium ${
                currentCompletion >= 80
                  ? "text-emerald-700"
                  : currentCompletion >= 60
                  ? "text-blue-700"
                  : "text-orange-700"
              }`}
            >
              {currentCompletion >= 80
                ? "Excellent performance this week!"
                : currentCompletion >= 60
                ? "Good progress with room to grow"
                : completedDays > 0
                ? "Keep building consistency"
                : "Ready to start fresh?"}
            </div>
            <div
              className={`text-xs mt-1 ${
                currentCompletion >= 80
                  ? "text-emerald-600"
                  : currentCompletion >= 60
                  ? "text-blue-600"
                  : "text-orange-600"
              } opacity-80`}
            >
              {isImproving
                ? `Trending upward with ${getTrendMessage().toLowerCase()}`
                : isStable && currentCompletion > 0
                ? "Maintaining steady progress"
                : completedDays > 0
                ? "Some activity, focus on consistency"
                : "Start today to begin tracking progress"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrend;
