// src/presentation/components/TaskManager/GanttChartStyle/GanttTimelinePanel.tsx

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Task, Priority, Status } from "../../../types/task";

interface GanttTimelinePanelProps {
  allTasks: Task[];
  onTaskClick: (task: Task) => void;
  timeRange: string;
  containerWidth: number;
}

const STATUS_COLORS: Record<Status, string> = {
  backlog: "#6B7280",
  todo: "#3B82F6",
  "in-progress": "#F59E0B",
  done: "#10B981",
  overdue: "#EF4444",
  archive: "#374151",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#94A3B8",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

type TimeRange = "day" | "month" | "year";

interface TimelineHeaderProps {
  timeRange: TimeRange;
  startDate: Date;
  endDate: Date;
  containerWidth: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  timeRange,
  startDate,
  endDate,
  containerWidth,
}) => {
  const generateTimeUnits = () => {
    const units: Array<{ label: string; date: Date; width: number }> = [];
    const totalMs = endDate.getTime() - startDate.getTime();

    let current = new Date(startDate);

    while (current <= endDate) {
      let next = new Date(current);
      let label = "";

      switch (timeRange) {
        case "day":
          next.setDate(current.getDate() + 1);
          label = current.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          break;
        case "month":
          next.setMonth(current.getMonth() + 1);
          label = current.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
          break;
        case "year":
          next.setFullYear(current.getFullYear() + 1);
          label = current.getFullYear().toString();
          break;
      }

      const unitMs =
        Math.min(next.getTime(), endDate.getTime()) - current.getTime();
      const width = (unitMs / totalMs) * containerWidth;

      units.push({ label, date: new Date(current), width });
      current = next;
    }

    return units;
  };

  const timeUnits = generateTimeUnits();

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
      {timeUnits.map((unit, index) => (
        <div
          key={index}
          className="flex-shrink-0 px-2 py-3 border-r border-gray-200 dark:border-gray-600 text-center"
          style={{ width: Math.max(unit.width, 80) }}
        >
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const GanttTimelinePanel: React.FC<GanttTimelinePanelProps> = ({
  allTasks,
  onTaskClick,
  timeRange,
  containerWidth,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(800);

  // Group tasks by collection for rendering
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    allTasks.forEach((task) => {
      const collection = task.collection || "No Collection";
      if (!groups[collection]) {
        groups[collection] = [];
      }
      groups[collection].push(task);
    });

    return groups;
  }, [allTasks]);

  // Calculate timeline boundaries
  const { timelineStart, timelineEnd } = useMemo(() => {
    if (allTasks.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      return { timelineStart: start, timelineEnd: end };
    }

    const startDates = allTasks.map((task) => new Date(task.startDate!));
    const endDates = allTasks.map((task) => new Date(task.dueDate!));

    const minStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    // Add padding
    const padding = timeRange === "day" ? 7 : timeRange === "month" ? 30 : 90; // days
    const start = new Date(minStart);
    start.setDate(start.getDate() - padding);

    const end = new Date(maxEnd);
    end.setDate(end.getDate() + padding);

    return { timelineStart: start, timelineEnd: end };
  }, [allTasks, timeRange]);

  // Calculate task bar positions and dimensions
  const calculateTaskPosition = (task: Task) => {
    const startDate = new Date(task.startDate!);
    const startTime = new Date(task.startTime!);
    const dueDate = new Date(task.dueDate!);
    const dueTime = new Date(task.dueTime!);

    // Combine date and time
    const combinedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const combinedEnd = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      dueTime.getHours(),
      dueTime.getMinutes()
    );

    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    const taskStartMs = combinedStart.getTime() - timelineStart.getTime();
    const taskDurationMs = combinedEnd.getTime() - combinedStart.getTime();

    const left = (taskStartMs / totalMs) * timelineWidth;
    const width = Math.max((taskDurationMs / totalMs) * timelineWidth, 20);

    return { left, width };
  };

  // Task progress calculation
  const getTaskProgress = (task: Task) => {
    if (task.completed || task.status === "done") return 100;
    if (task.status === "in-progress") return 50;
    if (task.status === "todo") return 25;
    return 0;
  };

  const getTaskColor = (task: Task) => {
    return STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  };

  const getTaskPriorityIndicator = (task: Task) => {
    return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  };

  // Update timeline width
  useEffect(() => {
    setTimelineWidth(Math.max(containerWidth, 800));
  }, [containerWidth]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Timeline Header */}
      <TimelineHeader
        timeRange={timeRange as TimeRange}
        startDate={timelineStart}
        endDate={timelineEnd}
        containerWidth={timelineWidth}
      />

      {/* Timeline Content */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        <div
          className="relative"
          style={{ width: Math.max(timelineWidth, 800) }}
        >
          {Object.entries(groupedTasks).map(([collection, tasks]) => (
            <div key={collection}>
              {/* Collection Header Row */}
              {collection !== "No Collection" && (
                <div
                  className="border-b border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                  style={{ height: 40 }}
                >
                  <div className="h-full flex items-center px-4">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📁 {collection}
                    </span>
                  </div>
                </div>
              )}

              {/* Task Rows */}
              {tasks.map((task) => {
                const { left, width } = calculateTaskPosition(task);
                const progress = getTaskProgress(task);

                return (
                  <div
                    key={task.id}
                    className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ height: 60 }}
                  >
                    <div className="relative h-full py-3 px-2">
                      {/* Task Bar */}
                      <div
                        className="absolute rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all group"
                        style={{
                          left: Math.max(left, 0),
                          width: Math.max(width, 20),
                          top: "12px",
                          height: "36px",
                          backgroundColor: getTaskColor(task),
                        }}
                        onClick={() => onTaskClick(task)}
                      >
                        {/* Progress Bar */}
                        <div
                          className="absolute top-0 left-0 h-full rounded-md opacity-80"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: getTaskPriorityIndicator(task),
                          }}
                        />

                        {/* Task Label */}
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-white text-xs font-medium truncate">
                            {task.title}
                          </span>
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {task.title} ({progress}%)
                          <br />
                          {new Date(
                            task.startDate!
                          ).toLocaleDateString()} -{" "}
                          {new Date(task.dueDate!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttTimelinePanel;
