import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Habit } from "../../types/types";
import { Calendar, TrendingUp, Target, CheckCircle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyContributionProps {
  habit?: Habit;
  selectedDate: Date;
}

const MonthlyContribution: React.FC<MonthlyContributionProps> = ({
  habit,
  selectedDate,
}) => {
  if (!habit) return null;

  const generateMonthData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const count = habit.dailyCounts[i] || 0;
      const completed = count > 0;

      return {
        day,
        date,
        completed,
        completionValue: completed ? 1 : 0,
        count,
      };
    });
  };

  const monthData = generateMonthData();
  const completedDays = monthData.filter((d) => d.completed).length;
  const completionRate = Math.round((completedDays / monthData.length) * 100);
  const currentStreak = habit.currentStreak;
  const monthName = selectedDate.toLocaleString("default", { month: "long" });

  // Prepare chart data
  const chartData = {
    labels: monthData.map((d) => d.day.toString()),
    datasets: [
      {
        label: "Daily Completion",
        data: monthData.map((d) => d.completionValue),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: monthData.map((d) =>
          d.completed ? "rgb(16, 185, 129)" : "rgb(229, 231, 235)"
        ),
        pointBorderColor: monthData.map((d) =>
          d.completed ? "rgb(255, 255, 255)" : "rgb(156, 163, 175)"
        ),
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(16, 185, 129, 0.3)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex;
            const date = monthData[index].date;
            return date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });
          },
          label: function (context: any) {
            const index = context.dataIndex;
            const count = monthData[index].count;
            return count > 0 ? `✅ Completed (${count})` : "❌ Not completed";
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 10,
          },
          callback: function (value: any, index: number) {
            return (index + 1) % 5 === 0 ||
              index === 0 ||
              index === monthData.length - 1
              ? monthData[index]?.day
              : "";
          },
        },
      },
      y: {
        display: false,
        beginAtZero: true,
        max: 1,
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Monthly Progress
            </h3>
            <p className="text-sm text-text-secondary">
              {monthName} {selectedDate.getFullYear()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completionRate}%
          </div>
          <div className="text-xs text-text-secondary">Completion</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Completed Days */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              COMPLETED
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {completedDays}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            of {monthData.length} days
          </div>
        </div>

        {/* Current Streak */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 text-orange-600 dark:text-orange-400">
              🔥
            </div>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              STREAK
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {currentStreak}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            days current
          </div>
        </div>

        {/* Remaining Days */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              REMAINING
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {monthData.length - completedDays}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            days left
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary">
            Monthly Achievement
          </span>
          <span className="text-sm text-text-secondary">
            {completedDays}/{monthData.length} days
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-64 mb-4">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Bottom Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-border-default">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <TrendingUp className="w-4 h-4" />
          <span>
            {completionRate >= 80
              ? "Outstanding performance!"
              : completionRate >= 60
              ? "Great progress!"
              : completionRate >= 40
              ? "Good effort, keep going!"
              : "Room for improvement"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-xs text-text-secondary">Daily Completion</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyContribution;
