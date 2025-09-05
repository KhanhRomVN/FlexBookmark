// src/presentation/tab/HabitManager/components/HabitDetailPanel.tsx
import React from "react";
import { Habit } from "../types/types";

interface HabitDetailPanelProps {
  selectedHabit?: Habit;
  selectedDate: Date;
  todayStats: {
    completed: number;
    total: number;
    remaining: number;
    completionRate: number;
  };
}

const HabitDetailPanel: React.FC<HabitDetailPanelProps> = ({
  selectedHabit,
  selectedDate,
  todayStats,
}) => {
  return (
    <div className="w-2/5 p-6 border-l border-slate-200/50 h-full overflow-y-auto"></div>
  );
};

export default HabitDetailPanel;
