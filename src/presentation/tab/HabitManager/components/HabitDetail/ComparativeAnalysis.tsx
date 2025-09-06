import React, { useMemo } from "react";
import { Habit } from "../../types/types";
import { Target, TrendingUp, Award, Flame } from "lucide-react";

interface ComparativeAnalysisProps {
  habit: Habit;
  habits: Habit[];
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  habit,
  habits,
}) => {
  const analysisData = useMemo(() => {
    const sameCategoryHabits = habits.filter(
      (h) => h.category === habit.category && h.id !== habit.id && !h.isArchived
    );

    // Calculate real metrics for comparison
    const currentStreakPercentile =
      sameCategoryHabits.length > 0
        ? Math.round(
            (sameCategoryHabits.filter(
              (h) => h.currentStreak <= habit.currentStreak
            ).length /
              sameCategoryHabits.length) *
              100
          )
        : 50;

    const completionRate =
      habit.dailyCounts.filter((count) => count > 0).length /
      habit.dailyCounts.length;
    const avgCompletionRate =
      sameCategoryHabits.length > 0
        ? sameCategoryHabits.reduce(
            (sum, h) =>
              sum +
              h.dailyCounts.filter((count) => count > 0).length /
                h.dailyCounts.length,
            0
          ) / sameCategoryHabits.length
        : completionRate;

    const completionRatePercentile =
      sameCategoryHabits.length > 0
        ? Math.round(
            (sameCategoryHabits.filter(
              (h) =>
                h.dailyCounts.filter((count) => count > 0).length /
                  h.dailyCounts.length <=
                completionRate
            ).length /
              sameCategoryHabits.length) *
              100
          )
        : 50;

    const consistencyScore = Math.min(100, Math.round(completionRate * 100));

    return {
      sameCategoryHabits,
      currentStreakPercentile,
      completionRatePercentile,
      consistencyScore,
      completionRate: Math.round(completionRate * 100),
    };
  }, [habit, habits]);

  const getRankLabel = (percentile: number) => {
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Above Average";
    return "Below Average";
  };

  const getRankColor = (percentile: number) => {
    if (percentile >= 90) return "text-green-600 dark:text-green-400";
    if (percentile >= 75) return "text-blue-600 dark:text-blue-400";
    if (percentile >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Comparative Analysis
      </h3>

      <div className="space-y-4">
        {/* Current Streak Comparison */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Current Streak
              </span>
            </div>
            <span
              className={`text-sm font-bold ${getRankColor(
                analysisData.currentStreakPercentile
              )}`}
            >
              {getRankLabel(analysisData.currentStreakPercentile)}
            </span>
          </div>
          <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisData.currentStreakPercentile}%` }}
            />
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Better than {analysisData.currentStreakPercentile}% of{" "}
            {habit.category} habits
          </div>
        </div>

        {/* Completion Rate Comparison */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Completion Rate
              </span>
            </div>
            <span
              className={`text-sm font-bold ${getRankColor(
                analysisData.completionRatePercentile
              )}`}
            >
              {getRankLabel(analysisData.completionRatePercentile)}
            </span>
          </div>
          <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisData.completionRatePercentile}%` }}
            />
          </div>
          <div className="text-xs text-green-600 mt-1">
            {analysisData.completionRate}% completion rate
          </div>
        </div>

        {/* Overall Consistency */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Overall Consistency
              </span>
            </div>
            <span className="text-sm font-bold text-purple-600">
              {analysisData.consistencyScore}/100
            </span>
          </div>
          <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisData.consistencyScore}%` }}
            />
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Based on historical completion data
          </div>
        </div>

        {analysisData.sameCategoryHabits.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Award className="w-4 h-4" />
              <span>
                Compared to {analysisData.sameCategoryHabits.length} other{" "}
                {habit.category} habits
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
