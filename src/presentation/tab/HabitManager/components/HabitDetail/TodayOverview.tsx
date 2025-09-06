import React from "react";
import {
  CheckCircle,
  Target,
  TrendingUp,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  Award,
} from "lucide-react";

interface TodayOverviewProps {
  todayStats: {
    completed: number;
    total: number;
    remaining: number;
    completionRate: number;
  };
  habits?: any[];
}

const TodayOverview: React.FC<TodayOverviewProps> = ({
  todayStats,
  habits = [],
}) => {
  const isAllCompleted = todayStats.remaining === 0 && todayStats.total > 0;

  // Calculate additional metrics
  const activeHabits = habits.filter((h) => !h.isArchived);
  const todayStreak = activeHabits.filter((h) => h.currentStreak > 0).length;
  const avgStreak =
    activeHabits.length > 0
      ? Math.round(
          activeHabits.reduce((sum, h) => sum + h.currentStreak, 0) /
            activeHabits.length
        )
      : 0;

  const completedCategories = new Set(
    activeHabits.filter((h) => h.completedToday).map((h) => h.category)
  ).size;

  const totalCategories = new Set(activeHabits.map((h) => h.category)).size;

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Today's Progress
            </h3>
            <p className="text-sm text-text-secondary">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(todayStats.completionRate)}%
          </div>
          <div className="text-xs text-text-secondary">Complete</div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Completed */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              DONE
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {todayStats.completed}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            habits completed
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              TOTAL
            </span>
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {todayStats.total}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            active habits
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              LEFT
            </span>
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
            {todayStats.remaining}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            to complete
          </div>
        </div>

        {/* Active Streaks */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              STREAKS
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {todayStreak}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            active today
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary">
            Daily Progress
          </span>
          <span className="text-sm text-text-secondary">
            {todayStats.completed}/{todayStats.total}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${todayStats.completionRate}%` }}
          />
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Categories Progress */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              CATEGORIES
            </span>
          </div>
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {completedCategories}/{totalCategories}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            categories active
          </div>
        </div>

        {/* Average Streak */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              AVG STREAK
            </span>
          </div>
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {avgStreak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            days average
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`rounded-lg p-4 border ${
          isAllCompleted
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30"
            : todayStats.completionRate >= 70
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30"
            : "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {isAllCompleted ? (
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : todayStats.completionRate >= 70 ? (
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          )}
          <div>
            <div
              className={`text-sm font-medium ${
                isAllCompleted
                  ? "text-emerald-700 dark:text-emerald-300"
                  : todayStats.completionRate >= 70
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-orange-700 dark:text-orange-300"
              }`}
            >
              {isAllCompleted
                ? "Perfect Day! All habits completed 🎉"
                : todayStats.completionRate >= 70
                ? "Great progress! Keep it up"
                : `${todayStats.remaining} habit${
                    todayStats.remaining !== 1 ? "s" : ""
                  } left to go`}
            </div>
            <div
              className={`text-xs mt-1 ${
                isAllCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : todayStats.completionRate >= 70
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {isAllCompleted
                ? "You've maintained your momentum across all categories"
                : todayStats.completionRate >= 70
                ? "You're on track to meet your daily goals"
                : "A few more habits and you'll hit your target"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayOverview;
