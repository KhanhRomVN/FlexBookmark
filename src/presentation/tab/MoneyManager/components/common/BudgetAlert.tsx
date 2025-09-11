import React from "react";
import { AlertCircle, X } from "lucide-react";
import { Budget } from "../../types/types";

interface BudgetAlertProps {
  budget: Budget;
  currentSpending: number;
  percentage: number;
  onDismiss: () => void;
}

export const BudgetAlert: React.FC<BudgetAlertProps> = ({
  budget,
  currentSpending,
  percentage,
  onDismiss,
}) => {
  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isOverBudget
          ? "bg-red-50 border-red-200"
          : isWarning
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle
            className={`w-5 h-5 mt-0.5 ${
              isOverBudget ? "text-red-500" : "text-yellow-500"
            }`}
          />
          <div className="flex-1">
            <h4 className="font-medium text-sm">
              {isOverBudget ? "Budget Exceeded" : "Budget Warning"}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {budget.categoryId ? "Category" : "Account"} has spent{" "}
              {currentSpending.toLocaleString()}({percentage.toFixed(0)}%) of{" "}
              {budget.amount.toLocaleString()} budget
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
