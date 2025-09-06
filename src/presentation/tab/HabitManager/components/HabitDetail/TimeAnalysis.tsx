import React, { useMemo } from "react";
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
import { Clock } from "lucide-react";

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

interface TimeAnalysisProps {
  habits: Habit[];
}

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ habits }) => {
  const timeAnalysisData = useMemo(() => {
    const timeDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourLabel = `${hour.toString().padStart(2, "0")}:00`;

      const habitsAtThisHour = habits.filter((habit) => {
        if (!habit.startTime) return false;
        const habitHour = parseInt(habit.startTime.split(":")[0]);
        return habitHour === hour;
      }).length;

      return {
        hour,
        hourLabel,
        completionCount: habitsAtThisHour,
      };
    });

    const maxCompletions = Math.max(
      ...timeDistribution.map((item) => item.completionCount)
    );
    const totalCompletions = timeDistribution.reduce(
      (sum, item) => sum + item.completionCount,
      0
    );

    // Find peak hours
    const peakHour = timeDistribution.reduce(
      (max, item) => (item.completionCount > max.completionCount ? item : max),
      { completionCount: 0, hourLabel: "00:00" }
    );

    // Find morning vs evening distribution
    const morningHabits = timeDistribution
      .slice(6, 12)
      .reduce((sum, item) => sum + item.completionCount, 0);
    const eveningHabits = timeDistribution
      .slice(18, 24)
      .reduce((sum, item) => sum + item.completionCount, 0);

    return {
      timeDistribution,
      maxCompletions,
      totalCompletions,
      peakHour,
      morningHabits,
      eveningHabits,
    };
  }, [habits]);

  const chartData = {
    labels: timeAnalysisData.timeDistribution.map((item) => item.hourLabel),
    datasets: [
      {
        label: "Scheduled Habits",
        data: timeAnalysisData.timeDistribution.map(
          (item) => item.completionCount
        ),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
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
            const hour = timeAnalysisData.timeDistribution[index].hour;
            const nextHour = (hour + 1) % 24;
            return `${hour.toString().padStart(2, "0")}:00 - ${nextHour
              .toString()
              .padStart(2, "0")}:00`;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            return `${value} habit${value !== 1 ? "s" : ""} scheduled`;
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
          maxRotation: 45,
          callback: function (value: any, index: number) {
            return index % 3 === 0
              ? timeAnalysisData.timeDistribution[index].hourLabel
              : "";
          },
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
          stepSize: 1,
        },
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
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Time Distribution
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Habit scheduling throughout the day
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {timeAnalysisData.totalCompletions}
          </div>
          <div className="text-xs text-text-secondary">Total Scheduled</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <Line data={chartData} options={options} />
      </div>

      {/* Insights - 3 Cards in One Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Peak Hour Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">⏰</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                PEAK TIME
              </span>
            </div>
            <div className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
              {timeAnalysisData.peakHour.hourLabel}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              {timeAnalysisData.peakHour.completionCount} habits
            </div>
          </div>
        </div>

        {/* Morning vs Evening */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🌅</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                MORNING
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-1">
              {timeAnalysisData.morningHabits}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">
              vs {timeAnalysisData.eveningHabits} evening
            </div>
          </div>
        </div>

        {/* Average Per Hour */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📊</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                AVG/HOUR
              </span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
              {(timeAnalysisData.totalCompletions / 24).toFixed(1)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              habits per hour
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center mt-4 pt-4 border-t border-border-default">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-xs text-text-secondary">Scheduled Habits</span>
        </div>
      </div>
    </div>
  );
};

export default TimeAnalysis;
