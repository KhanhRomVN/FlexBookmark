// src/presentation/tab/HabitManager/components/HabitDetailPanel.tsx
import React from "react";
import { Habit } from "../types/types";
import MonthlyContribution from "./HabitDetail/MonthlyContribution";
import YearlyContribution from "./HabitDetail/YearlyContribution";

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
    <div className="w-2/5 p-6 border-l border-slate-200/50 h-full overflow-y-auto bg-gray-50/30">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {selectedHabit ? selectedHabit.name : "Habit Details"}
          </h2>
          {selectedHabit && (
            <p className="text-sm text-text-secondary mb-4">
              {selectedHabit.description || "No description available"}
            </p>
          )}
        </div>

        {/* Today's Overview */}
        <div className="bg-card-background rounded-xl p-6 border border-border-default">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Today's Overview
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {todayStats.completed}
              </div>
              <div className="text-sm text-text-secondary">Completed</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {todayStats.total}
              </div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">
                Today's Progress
              </span>
              <span className="text-sm font-medium text-text-primary">
                {Math.round(todayStats.completionRate)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${todayStats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="text-center text-sm text-text-secondary">
            {todayStats.remaining > 0
              ? `${todayStats.remaining} habits remaining today`
              : "All habits completed for today! 🎉"}
          </div>
        </div>

        {/* Selected Habit Info */}
        {selectedHabit && (
          <div className="bg-card-background rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Habit Information
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Type:</span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    selectedHabit.habitType === "good"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedHabit.habitType === "good"
                    ? "Good Habit"
                    : "Bad Habit"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Category:</span>
                <span className="text-sm font-medium text-text-primary capitalize">
                  {selectedHabit.category}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Difficulty:</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < selectedHabit.difficultyLevel
                          ? "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {selectedHabit.startTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Time:</span>
                  <span className="text-sm font-medium text-text-primary">
                    {selectedHabit.startTime}
                  </span>
                </div>
              )}

              {selectedHabit.goal && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Goal:</span>
                  <span className="text-sm font-medium text-text-primary">
                    {selectedHabit.goal} {selectedHabit.unit || ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly Contribution */}
        <MonthlyContribution
          habit={selectedHabit}
          selectedDate={selectedDate}
        />

        {/* Yearly Contribution */}
        <YearlyContribution habit={selectedHabit} selectedDate={selectedDate} />

        {/* Quick Actions */}
        {selectedHabit && (
          <div className="bg-card-background rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <button className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium">
                Mark as Completed
              </button>

              <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium">
                Edit Habit
              </button>

              <button className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                View History
              </button>
            </div>
          </div>
        )}

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="text-center">
            <div className="text-2xl mb-2">💪</div>
            <p className="text-sm text-blue-700 font-medium mb-1">
              "Success is the sum of small efforts repeated day in and day out."
            </p>
            <p className="text-xs text-blue-600">- Robert Collier</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailPanel;
