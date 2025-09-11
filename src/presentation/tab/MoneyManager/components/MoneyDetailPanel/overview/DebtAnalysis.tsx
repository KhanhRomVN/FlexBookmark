import React from "react";
import { Debt } from "../../../types/types";
import {
  formatCurrency,
  calculateDebtProgress,
} from "../../../utils/moneyUtils";

interface DebtAnalysisProps {
  debts: Debt[];
}

const DebtAnalysis: React.FC<DebtAnalysisProps> = ({ debts }) => {
  const totalDebt = debts.reduce(
    (total, debt) => total + debt.currentAmount,
    0
  );
  const totalInitialDebt = debts.reduce(
    (total, debt) => total + debt.initialAmount,
    0
  );
  const progressPercentage =
    totalInitialDebt > 0
      ? ((totalInitialDebt - totalDebt) / totalInitialDebt) * 100
      : 0;

  const getDebtTypeColor = (type: string) => {
    return type === "borrowed"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-400";
  };

  const getDebtTypeLabel = (type: string) => {
    return type === "borrowed" ? "You owe" : "You are owed";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Debt Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">
            Total Debt
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totalDebt, "VND")}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
            Original Debt
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(totalInitialDebt, "VND")}
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">
            Progress
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {debts.map((debt) => {
          const { percentage, remaining } = calculateDebtProgress(debt);
          return (
            <div
              key={debt.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4"
              style={{
                borderLeftColor:
                  debt.type === "borrowed" ? "#ef4444" : "#10b981",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {debt.name}
                </h3>
                <span
                  className={`text-sm font-medium ${getDebtTypeColor(
                    debt.type
                  )}`}
                >
                  {getDebtTypeLabel(debt.type)}
                </span>
              </div>

              <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        debt.type === "borrowed" ? "#ef4444" : "#10b981",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Current
                  </div>
                  <div
                    className={
                      debt.type === "borrowed"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {formatCurrency(debt.currentAmount, "VND")}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Original
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {formatCurrency(debt.initialAmount, "VND")}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Progress
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Remaining
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {formatCurrency(remaining, "VND")}
                  </div>
                </div>
              </div>

              {debt.dueDate && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Due: {debt.dueDate.toLocaleDateString()}
                </div>
              )}

              {debt.interestRate && debt.interestRate > 0 && (
                <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  Interest: {debt.interestRate}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {debts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No debts tracked yet. Add your first debt to start monitoring!
        </div>
      )}
    </div>
  );
};

export default DebtAnalysis;
