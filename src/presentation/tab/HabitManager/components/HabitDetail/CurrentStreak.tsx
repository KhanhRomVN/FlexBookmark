import React from "react";
import { Habit } from "../../types/types";

interface CurrentStreakProps {
  habit?: Habit;
}

const CurrentStreak: React.FC<CurrentStreakProps> = ({ habit }) => {
  if (!habit) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4 p-6 pb-0">
        Current Streak
      </h3>

      <div className="p-6 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-600">
              {habit.currentStreak}
            </div>
            <div className="text-sm text-blue-500 mt-1">Current</div>
          </div>

          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-600">
              {habit.longestStreak}
            </div>
            <div className="text-sm text-green-500 mt-1">Longest</div>
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-3 border border-border-default">
          <div className="text-sm text-text-secondary">
            {habit.currentStreak > 0 ? (
              <span className="text-green-600 font-medium">
                🔥 On a {habit.currentStreak}-day streak!
              </span>
            ) : (
              <span>Start your streak today!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentStreak;
