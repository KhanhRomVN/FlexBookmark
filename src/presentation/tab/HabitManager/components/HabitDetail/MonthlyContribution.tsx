import React from "react";
import { Habit } from "../../types/types";

interface MonthlyContributionProps {
  habit?: Habit;
  selectedDate: Date;
}

const MonthlyContribution: React.FC<MonthlyContributionProps> = ({
  habit,
  selectedDate,
}) => {
  const generateMonthData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      // Simulate some completion data (in real app, this would come from habit data)
      const completed = Math.random() > 0.7;
      data.push({ day, completed });
    }
    return data;
  };

  const monthData = generateMonthData();
  const completionRate = Math.round(
    (monthData.filter((d) => d.completed).length / monthData.length) * 100
  );

  if (!habit) {
    return (
      <div className="bg-card-background rounded-xl p-6 border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Monthly Progress
        </h3>
        <div className="text-center text-text-secondary">
          Select a habit to view monthly progress
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Monthly Progress
      </h3>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Completion Rate</span>
          <span className="text-sm font-medium text-text-primary">
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthData.map(({ day, completed }) => (
          <div
            key={day}
            className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
              completed
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
            title={`Day ${day}: ${completed ? "Completed" : "Not completed"}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between text-xs text-text-secondary">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
        <span>Sun</span>
      </div>
    </div>
  );
};

export default MonthlyContribution;
