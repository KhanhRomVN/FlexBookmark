import React from "react";
import { Flame, Trophy } from "lucide-react";
import { Habit } from "../../types/types";

interface CurrentStreakProps {
  habit?: Habit;
}

const CurrentStreak: React.FC<CurrentStreakProps> = ({ habit }) => {
  if (!habit) return null;

  const streakPercentage =
    habit.longestStreak > 0
      ? Math.round((habit.currentStreak / habit.longestStreak) * 100)
      : 0;

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800/30">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Current Streak
            </h3>
            <p className="text-sm text-text-secondary">
              Track your consistency
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {habit.currentStreak}
          </div>
          <div className="text-xs text-text-secondary">Days</div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Streak */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                CURRENT
              </span>
            </div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-2">
              {habit.currentStreak}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              {habit.currentStreak === 1 ? "day" : "days"} in a row
            </div>
          </div>
          {/* Decorative flame pattern */}
          <div className="absolute -bottom-2 -right-2 opacity-10">
            <Flame className="w-16 h-16 text-orange-500" />
          </div>
        </div>

        {/* Longest Streak */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                BEST EVER
              </span>
            </div>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-2">
              {habit.longestStreak}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">
              personal record
            </div>
          </div>
          {/* Decorative trophy pattern */}
          <div className="absolute -bottom-2 -right-2 opacity-10">
            <Trophy className="w-16 h-16 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Progress to Personal Best */}
      {habit.longestStreak > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-text-primary">
              Progress to Personal Best
            </span>
            <span className="text-sm text-text-secondary">
              {habit.currentStreak}/{habit.longestStreak} days
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-400 to-amber-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, streakPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>Start</span>
            <span>{streakPercentage}% there</span>
            <span>Record</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentStreak;
