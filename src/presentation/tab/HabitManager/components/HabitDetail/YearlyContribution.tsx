import React from "react";
import { Habit } from "../../types/types";

interface YearlyContributionProps {
  habit?: Habit;
  selectedDate: Date;
}

const YearlyContribution: React.FC<YearlyContributionProps> = ({
  habit,
  selectedDate,
}) => {
  const generateYearData = () => {
    const year = selectedDate.getFullYear();
    const data = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const completedDays = Math.floor(Math.random() * daysInMonth * 0.6); // Simulate data
      data.push({ month, completedDays, totalDays: daysInMonth });
    }

    return data;
  };

  const yearData = generateYearData();
  const totalCompleted = yearData.reduce(
    (sum, month) => sum + month.completedDays,
    0
  );
  const totalDays = yearData.reduce((sum, month) => sum + month.totalDays, 0);
  const yearlyCompletionRate = Math.round((totalCompleted / totalDays) * 100);

  if (!habit) {
    return (
      <div className="bg-card-background rounded-xl p-6 border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Yearly Overview
        </h3>
        <div className="text-center text-text-secondary">
          Select a habit to view yearly progress
        </div>
      </div>
    );
  }

  const currentYear = selectedDate.getFullYear();

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Yearly Overview
      </h3>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Yearly Completion</span>
          <span className="text-sm font-medium text-text-primary">
            {yearlyCompletionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${yearlyCompletionRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 mb-2">
        {yearData.map(({ month, completedDays, totalDays }) => {
          const completionRate = Math.round((completedDays / totalDays) * 100);
          const intensity = Math.min(4, Math.floor(completionRate / 25));

          return (
            <div key={month} className="text-center">
              <div
                className={`w-4 h-4 mx-auto mb-1 rounded-sm ${
                  intensity === 0
                    ? "bg-gray-100"
                    : intensity === 1
                    ? "bg-blue-200"
                    : intensity === 2
                    ? "bg-blue-400"
                    : intensity === 3
                    ? "bg-blue-600"
                    : "bg-blue-800"
                }`}
                title={`${new Date(currentYear, month).toLocaleString(
                  "default",
                  {
                    month: "short",
                  }
                )}: ${completionRate}%`}
              />
              <span className="text-xs text-text-secondary">
                {new Date(currentYear, month)
                  .toLocaleString("default", { month: "short" })
                  .charAt(0)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-text-secondary mt-2">
        <span>Jan</span>
        <span>Mar</span>
        <span>May</span>
        <span>Jul</span>
        <span>Sep</span>
        <span>Nov</span>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-text-secondary">
          <span className="font-medium text-blue-600">{totalCompleted}</span>{" "}
          days completed out of <span className="font-medium">{totalDays}</span>{" "}
          total days
        </div>
      </div>
    </div>
  );
};

export default YearlyContribution;
