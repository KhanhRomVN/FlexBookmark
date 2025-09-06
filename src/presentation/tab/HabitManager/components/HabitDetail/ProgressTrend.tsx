import React, { useMemo } from "react";
import { Habit } from "../../types/types";
import { TrendingUp, TrendingDown } from "lucide-react";

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
      };
    });
  }, [habit, selectedDate]);

  const currentCompletion =
    progressData[progressData.length - 1]?.completionRate || 0;
  const previousCompletion = progressData[0]?.completionRate || 0;
  const trend = currentCompletion - previousCompletion;
  const isImproving = trend > 0;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Progress Trend
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentCompletion}%
          </div>
          <div
            className={`flex items-center gap-1 text-sm ${
              isImproving
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isImproving ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {Math.abs(trend)}% {isImproving ? "improvement" : "decline"} in 7
              days
            </span>
          </div>
        </div>
      </div>

      <div className="h-16 relative">
        <div className="absolute inset-0 flex items-end">
          {progressData.map((data, index) => {
            const height = (data.completionRate / 100) * 48;
            const isCurrent = index === progressData.length - 1;

            return (
              <div
                key={index}
                className={`flex-1 mx-0.5 ${
                  isCurrent ? "bg-blue-500" : "bg-blue-300 dark:bg-blue-600"
                } rounded-t transition-all duration-300`}
                style={{ height: `${height}px` }}
                title={`${data.date.toLocaleDateString()}: ${
                  data.completionRate
                }% (${data.count})`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          {progressData[0]?.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>Last 7 days</span>
        <span>
          {progressData[progressData.length - 1]?.date.toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          )}
        </span>
      </div>
    </div>
  );
};

export default ProgressTrend;
