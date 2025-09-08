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
import YearlyCalendarContribute from "./HabitDetail/YearlyCalendarContribute";

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
            <YearlyCalendarContribute habit={selectedHabit} habits={habits} />
            <MonthlyContribution
              habit={selectedHabit}
              selectedDate={selectedDate}
            />
            <TimeAnalysis habits={[selectedHabit]} />
            <ComparativeAnalysis habit={selectedHabit} habits={habits} />
          </>
        )}
      </div>
    </div>
  );
};

export default HabitDetailPanel;
