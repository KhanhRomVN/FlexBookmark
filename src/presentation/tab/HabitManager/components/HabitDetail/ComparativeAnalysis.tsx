import React, { useMemo } from "react";
import { Habit } from "../../types/types";
import {
  Target,
  TrendingUp,
  Award,
  Flame,
  BarChart3,
  Users,
} from "lucide-react";

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
    if (percentile >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (percentile >= 75) return "text-blue-600 dark:text-blue-400";
    if (percentile >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRankBg = (percentile: number) => {
    if (percentile >= 90)
      return "from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30";
    if (percentile >= 75)
      return "from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30";
    if (percentile >= 50)
      return "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30";
    return "from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800/30";
  };

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
              Comparative Analysis
            </h3>
            <p className="text-sm text-text-secondary">
              Performance vs similar habits
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {analysisData.sameCategoryHabits.length + 1}
          </div>
          <div className="text-xs text-text-secondary">Total Compared</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Streak Comparison */}
        <div
          className={`relative overflow-hidden bg-gradient-to-br ${getRankBg(
            analysisData.currentStreakPercentile
          )} rounded-xl p-5 border`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    Current Streak
                  </span>
                  <div className="text-xs text-text-secondary">
                    {habit.currentStreak} days streak
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${getRankColor(
                    analysisData.currentStreakPercentile
                  )}`}
                >
                  {getRankLabel(analysisData.currentStreakPercentile)}
                </span>
                <div className="text-xs text-text-secondary">
                  {analysisData.currentStreakPercentile}th percentile
                </div>
              </div>
            </div>

            <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${analysisData.currentStreakPercentile}%` }}
              />
            </div>

            <div className="text-xs text-orange-700 dark:text-orange-300 mt-2 font-medium">
              Better than {analysisData.currentStreakPercentile}% of{" "}
              {habit.category} habits
            </div>
          </div>
        </div>

        {/* Completion Rate Comparison */}
        <div
          className={`relative overflow-hidden bg-gradient-to-br ${getRankBg(
            analysisData.completionRatePercentile
          )} rounded-xl p-5 border`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    Completion Rate
                  </span>
                  <div className="text-xs text-text-secondary">
                    {analysisData.completionRate}% success rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${getRankColor(
                    analysisData.completionRatePercentile
                  )}`}
                >
                  {getRankLabel(analysisData.completionRatePercentile)}
                </span>
                <div className="text-xs text-text-secondary">
                  {analysisData.completionRatePercentile}th percentile
                </div>
              </div>
            </div>

            <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${analysisData.completionRatePercentile}%` }}
              />
            </div>

            <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
              Outperforming {analysisData.completionRatePercentile}% in
              completion consistency
            </div>
          </div>
        </div>

        {/* Overall Consistency */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800/30">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    Overall Consistency
                  </span>
                  <div className="text-xs text-text-secondary">
                    Historical performance
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {analysisData.consistencyScore}/100
                </span>
                <div className="text-xs text-text-secondary">
                  Consistency Score
                </div>
              </div>
            </div>

            <div className="w-full bg-white/60 dark:bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-purple-400 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${analysisData.consistencyScore}%` }}
              />
            </div>

            <div className="text-xs text-purple-700 dark:text-purple-300 mt-2 font-medium">
              Based on daily completion patterns and streak maintenance
            </div>
          </div>
        </div>

        {/* Comparison Context */}
        {analysisData.sameCategoryHabits.length > 0 ? (
          <div className="bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/70 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  Compared against {analysisData.sameCategoryHabits.length}{" "}
                  other {habit.category} habits
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Rankings are calculated based on active habits in the same
                  category
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/70 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  You're the pioneer in the {habit.category} category!
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Be the first to set the standard for future habits
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
