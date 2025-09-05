import React from "react";
import { Habit } from "../../types/types";

interface CurrentStreakProps {
  habit?: Habit;
}

const CurrentStreak: React.FC<CurrentStreakProps> = ({ habit }) => {
  if (!habit) {
    return (
      <div className="bg-card-background rounded-xl p-6 border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Current Streak
        </h3>
        <div className="text-center text-text-secondary">
          Select a habit to view streak details
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Current Streak
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {habit.currentStreak}
          </div>
          <div className="text-sm text-blue-500 mt-1">Current Streak</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {habit.longestStreak}
          </div>
          <div className="text-sm text-green-500 mt-1">Longest Streak</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-text-secondary">
          {habit.currentStreak > 0 ? (
            <span className="text-green-600 font-medium">
              🔥 On a {habit.currentStreak}-day streak!
            </span>
          ) : (
            <span className="text-text-secondary">
              Start your streak today!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentStreak;
