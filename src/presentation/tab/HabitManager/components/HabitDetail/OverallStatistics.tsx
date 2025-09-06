import React from "react";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award,
} from "lucide-react";
import { Habit } from "../../types/types";

interface OverallStatisticsProps {
  habits: Habit[];
}

const OverallStatistics: React.FC<OverallStatisticsProps> = ({ habits }) => {
  const activeHabits = habits?.filter((habit) => !habit.isArchived) || [];
  const archivedHabits = habits?.filter((habit) => habit.isArchived) || [];

  const completedToday = activeHabits.filter(
    (habit) => habit.completedToday
  ).length;
  const completionRate =
    Math.round((completedToday / activeHabits.length) * 100) || 0;

  // Calculate additional metrics
  const totalStreakDays = activeHabits.reduce(
    (sum, habit) => sum + habit.currentStreak,
    0
  );
  const perfectHabits = activeHabits.filter(
    (habit) => habit.currentStreak >= 30
  ).length;
  const strugglingHabits = activeHabits.filter(
    (habit) => habit.currentStreak === 0
  ).length;

  // Weekly completion average
  const weeklyCompletions = activeHabits.reduce((sum, habit) => {
    const lastWeekCompleted = habit.dailyCounts
      .slice(-7)
      .filter((count) => count > 0).length;
    return sum + lastWeekCompleted;
  }, 0);
  const weeklyRate =
    Math.round((weeklyCompletions / (activeHabits.length * 7)) * 100) || 0;

  const categoryDistribution = activeHabits.reduce((acc, habit) => {
    acc[habit.category] = (acc[habit.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularCategory = Object.entries(categoryDistribution).reduce(
    (max, [category, count]) => (count > max.count ? { category, count } : max),
    { category: "", count: 0 }
  );

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Overall Statistics
            </h3>
            <p className="text-sm text-text-secondary">
              Complete habit overview
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Active Habits */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              ACTIVE HABITS
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
            {activeHabits.length}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            {archivedHabits.length} archived
          </div>
        </div>

        {/* Today's Completion */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              TODAY'S RATE
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
            {completionRate}%
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">
            {completedToday}/{activeHabits.length} completed
          </div>
        </div>

        {/* Total Streak Days */}
        <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              STREAK DAYS
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
            {totalStreakDays}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            total active days
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              WEEKLY AVG
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            {weeklyRate}%
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            last 7 days
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {perfectHabits}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Perfect (30+ days)
          </div>
        </div>

        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {activeHabits.length - perfectHabits - strugglingHabits}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Progressing
          </div>
        </div>

        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
          <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
            {strugglingHabits}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Need Attention
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-text-secondary" />
          <h4 className="text-sm font-medium text-text-primary">
            Category Breakdown
          </h4>
        </div>

        <div className="space-y-3 max-h-32 overflow-y-auto">
          {Object.entries(categoryDistribution)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => {
              const percentage = Math.round(
                (count / activeHabits.length) * 100
              );
              const isTop = category === mostPopularCategory.category;

              return (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm capitalize ${
                        isTop
                          ? "font-medium text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      {category}
                    </span>
                    {isTop && <Award className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isTop
                            ? "bg-gradient-to-r from-amber-400 to-orange-500"
                            : "bg-gradient-to-r from-blue-400 to-blue-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-text-primary">
                        {count}
                      </span>
                      <span className="text-xs text-text-secondary">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary Insights */}
      <div
        className={`rounded-lg p-4 border ${
          completionRate >= 80
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30"
            : completionRate >= 60
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30"
            : "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800/30"
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp
            className={`w-4 h-4 ${
              completionRate >= 80
                ? "text-emerald-600"
                : completionRate >= 60
                ? "text-blue-600"
                : "text-orange-600"
            }`}
          />
          <span
            className={`font-medium ${
              completionRate >= 80
                ? "text-emerald-700"
                : completionRate >= 60
                ? "text-blue-700"
                : "text-orange-700"
            }`}
          >
            {completionRate >= 80
              ? `Excellent! ${perfectHabits} habits are in perfect form.`
              : completionRate >= 60
              ? `Good progress with ${activeHabits.length} active habits.`
              : `Focus needed: ${strugglingHabits} habits need attention.`}
          </span>
        </div>
        <div
          className={`text-xs mt-1 ${
            completionRate >= 80
              ? "text-emerald-600"
              : completionRate >= 60
              ? "text-blue-600"
              : "text-orange-600"
          } opacity-80`}
        >
          Top category: {mostPopularCategory.category} (
          {mostPopularCategory.count} habits) • Weekly performance: {weeklyRate}
          %
        </div>
      </div>
    </div>
  );
};

export default OverallStatistics;
