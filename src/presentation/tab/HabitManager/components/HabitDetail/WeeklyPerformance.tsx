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

interface WeeklyPerformanceProps {
  habits: Habit[];
  selectedDate: Date;
}

const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({
  habits,
  selectedDate,
}) => {
  // Calculate weekly completion data for active habits
  const weekData = useMemo(() => {
    const activeHabits = habits.filter((habit) => !habit.isArchived);
    const today = new Date(selectedDate);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - 6 + i);
      const dayIndex = date.getDate() - 1;

      // Calculate completion rate for this day
      const completedHabits = activeHabits.filter(
        (habit) => habit.dailyCounts[dayIndex] > 0
      ).length;

      const completionRate =
        activeHabits.length > 0
          ? Math.round((completedHabits / activeHabits.length) * 100)
          : 0;

      return {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        completionRate,
        completedHabits,
        totalHabits: activeHabits.length,
      };
    });
  }, [habits, selectedDate]);

  const averageCompletion = Math.round(
    weekData.reduce((sum, day) => sum + day.completionRate, 0) /
      Math.max(1, weekData.length)
  );

  const chartData = {
    labels: weekData.map((day) => day.date),
    datasets: [
      {
        label: "Completion Rate",
        data: weekData.map((day) => day.completionRate),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
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
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex;
            return weekData[index].fullDate;
          },
          label: function (context: any) {
            const index = context.dataIndex;
            const dayData = weekData[index];
            return `${dayData.completedHabits}/${dayData.totalHabits} habits (${context.parsed.y}%)`;
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
            size: 12,
            weight: 500,
          },
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return value + "%";
          },
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
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Weekly Performance
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Last 7 days completion rate
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {averageCompletion}%
          </div>
          <div className="text-xs text-text-secondary">Average</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        <Line data={chartData} options={options} />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center pt-4 border-t border-border-default">
        <div className="flex space-x-6">
          <div className="text-center">
            <div className="text-sm font-medium text-text-primary">
              {Math.max(...weekData.map((d) => d.completionRate))}%
            </div>
            <div className="text-xs text-text-secondary">Best</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-text-primary">
              {Math.min(...weekData.map((d) => d.completionRate))}%
            </div>
            <div className="text-xs text-text-secondary">Lowest</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-xs text-text-secondary">Completion Rate</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPerformance;
