import React from "react";
import { Habit } from "../types/types";
import MonthlyContribution from "./HabitDetail/MonthlyContribution";
import CurrentStreak from "./HabitDetail/CurrentStreak";
import TodayOverview from "./HabitDetail/TodayOverview";
import OverallStatistics from "./HabitDetail/OverallStatistics";
import WeeklyPerformance from "./HabitDetail/WeeklyPerformance";
import CategoryDistribution from "./HabitDetail/CategoryDistribution";
import TimeAnalysis from "./HabitDetail/TimeAnalysis";
import ConsistencyScore from "./HabitDetail/ConsistencyScore";
import ProgressTrend from "./HabitDetail/ProgressTrend";
import ComparativeAnalysis from "./HabitDetail/ComparativeAnalysis";
import { Edit3, CheckCircle } from "lucide-react";

interface HabitDetailPanelProps {
  selectedHabit?: Habit;
  selectedDate: Date;
  todayStats?: {
    completed: number;
    total: number;
    remaining: number;
    completionRate: number;
  };
  habits: Habit[];
  onToggleHabitComplete: (habitId: string) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
}

const HabitDetailPanel: React.FC<HabitDetailPanelProps> = ({
  selectedHabit,
  selectedDate,
  todayStats,
  habits,
  onToggleHabitComplete,
  onEditHabit,
}) => {
  // Tạo todayStats mặc định nếu không được cung cấp
  const defaultTodayStats = {
    completed: 0,
    total: 0,
    remaining: 0,
    completionRate: 0,
  };

  const safeTodayStats = todayStats || defaultTodayStats;

  return (
    <div className="w-[576px] bg-background border-l border-border-default h-full overflow-y-auto">
      <div className="space-y-6 p-6">
        {!selectedHabit ? (
          /* DEFAULT MODE - Overview of all habits */
          <>
            <TodayOverview todayStats={safeTodayStats} habits={habits} />
            <WeeklyPerformance habits={habits} selectedDate={selectedDate} />
            <CategoryDistribution habits={habits} />
            <TimeAnalysis habits={habits} />
            <ConsistencyScore
              habits={habits}
              todayStats={{
                completed: 0,
                total: 0,
                remaining: 0,
                completionRate: 0,
              }}
            />
            <OverallStatistics habits={habits} />
          </>
        ) : (
          /* FOCUS MODE - Detailed view of selected habit */
          <>
            <CurrentStreak habit={selectedHabit} />
            <ProgressTrend habit={selectedHabit} selectedDate={selectedDate} />
            <MonthlyContribution
              habit={selectedHabit}
              selectedDate={selectedDate}
            />
            <TimeAnalysis habits={[selectedHabit]} />
            <ComparativeAnalysis habit={selectedHabit} habits={habits} />

            {/* Quick Actions */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => onToggleHabitComplete(selectedHabit.id)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </button>
                <button
                  onClick={() => onEditHabit(selectedHabit)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-colors text-sm font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Habit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HabitDetailPanel;
