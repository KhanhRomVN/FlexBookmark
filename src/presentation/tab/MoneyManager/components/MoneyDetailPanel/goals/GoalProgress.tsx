import React from "react";
import { SavingsGoal } from "../../../types/types";
import {
  formatCurrency,
  calculateSavingsProgress,
} from "../../../utils/moneyUtils";

interface GoalProgressProps {
  goal: SavingsGoal;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goal }) => {
  const { percentage, remaining, daysLeft } = calculateSavingsProgress(goal);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {goal.name}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(goal.currentAmount, goal.currency)} /{" "}
          {formatCurrency(goal.targetAmount, goal.currency)}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          {percentage.toFixed(1)}%
        </span>

        <div className="text-right">
          <div className="text-gray-600 dark:text-gray-300">
            {formatCurrency(remaining, goal.currency)} left
          </div>
          {daysLeft && daysLeft > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {daysLeft} days remaining
            </div>
          )}
        </div>
      </div>

      {goal.targetDate && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Target: {goal.targetDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default GoalProgress;
