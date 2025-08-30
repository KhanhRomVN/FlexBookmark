// src/presentation/tab/HabitManager/components/HabitDetailPanel.tsx
import React from "react";
import ContributionStreak from "./HabitDetail/ContributionStreak";
import { Habit } from "../types/habit";

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
    <div className="w-2/5 p-6 border-l border-slate-200/50 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Today's Overview */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Today's Overview
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Completed:</span>
              <span className="font-bold text-green-600">
                {todayStats.completed} / {todayStats.total}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Remaining:</span>
              <span className="font-bold text-orange-600">
                {todayStats.remaining}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Success Rate:</span>
              <span className="font-bold text-blue-600">
                {todayStats.completionRate}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-100 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${todayStats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Contribution Streak */}
        <ContributionStreak />

        {/* Selected Date Info */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Date Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Selected Date:</span>
              <span className="font-medium">
                {selectedDate.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Day of Week:</span>
              <span className="font-medium">
                {selectedDate.toLocaleDateString("vi-VN", { weekday: "long" })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Week of Month:</span>
              <span className="font-medium">
                Week {Math.ceil(selectedDate.getDate() / 7)}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Habit Details */}
        {selectedHabit && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Habit Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedHabit.colorCode }}
                ></div>
                {selectedHabit.emoji && (
                  <span className="text-2xl">{selectedHabit.emoji}</span>
                )}
                <h4 className="font-semibold text-slate-900">
                  {selectedHabit.name}
                </h4>
              </div>

              {selectedHabit.description && (
                <p className="text-sm text-slate-600">
                  {selectedHabit.description}
                </p>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Type:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedHabit.habitType === "good"
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                    }`}
                  >
                    {selectedHabit.habitType === "good" ? "Good" : "Bad"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Difficulty:</span>
                  <span className="font-medium">
                    Level {selectedHabit.difficultyLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Current Streak:</span>
                  <span className="font-bold text-green-600">
                    {selectedHabit.currentStreak} days
                  </span>
                </div>

                {selectedHabit.goal && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Daily Goal:</span>
                    <span className="font-medium">
                      {selectedHabit.goal} {selectedHabit.unit || ""}
                    </span>
                  </div>
                )}

                {selectedHabit.limit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Daily Limit:</span>
                    <span className="font-medium">
                      {selectedHabit.limit} {selectedHabit.unit || ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>

          <div className="space-y-3">
            <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium transition-colors">
              View Calendar
            </button>

            <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-medium transition-colors">
              Export Data
            </button>

            <button className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 py-3 px-4 rounded-xl font-medium transition-colors">
              Set Reminders
            </button>
          </div>
        </div>

        {/* Placeholder for future features */}
        <div className="bg-white/30 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center p-12">
          <div className="text-center text-slate-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">More features coming</p>
            <p className="text-sm">
              Charts, analytics, and detailed insights will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailPanel;
