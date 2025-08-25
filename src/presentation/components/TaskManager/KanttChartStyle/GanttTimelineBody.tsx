// src/presentation/components/TaskManager/KanttChartStyle/GanttTimelineBody.tsx

import React, { useRef, useEffect, useState } from "react";
import { Task, Priority, Status } from "../../../types/task";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GanttTimelineBodyProps {
  allTasks: Task[];
  groupedTasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  rowHeight: number;
  gridLines: number[];
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

const GanttTimelineBody: React.FC<GanttTimelineBodyProps> = ({
  allTasks,
  groupedTasks,
  onTaskClick,
  timelineStart,
  timelineEnd,
  timelineWidth,
  rowHeight,
  gridLines,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const calculateTaskPosition = (task: Task) => {
    const startDate = new Date(task.startDate!);
    const startTime = new Date(task.startTime!);
    const dueDate = new Date(task.dueDate!);
    const dueTime = new Date(task.dueTime!);

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

    return { left: Math.max(left, 0), width };
  };

  const getTaskProgress = (task: Task) => {
    if (task.completed || task.status === "done") return 100;
    if (task.status === "in-progress") return 50;
    if (task.status === "todo") return 25;
    return 0;
  };

  const getTaskColor = (task: Task) => {
    return STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  };

  const getTaskPriorityColor = (task: Task) => {
    return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  };

  const getTaskGradient = (task: Task) => {
    const baseColor = getTaskColor(task);
    const priorityColor = getTaskPriorityColor(task);

    return `linear-gradient(135deg, ${baseColor} 0%, ${priorityColor} 100%)`;
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 300;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll =
      direction === "left"
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleScrollUpdate = () => {
      if (!scrollContainerRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollUpdate);
      handleScrollUpdate();

      return () => {
        scrollContainer.removeEventListener("scroll", handleScrollUpdate);
      };
    }
  }, [timelineWidth]);

  return (
    <div className="flex-1 overflow-auto relative" ref={scrollContainerRef}>
      {/* Scroll Controls */}
      {(canScrollLeft || canScrollRight) && (
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-md ${
              canScrollLeft
                ? "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            } shadow-sm border border-gray-200 dark:border-gray-600 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded-md ${
              canScrollRight
                ? "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            } shadow-sm border border-gray-200 dark:border-gray-600 transition-colors`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gantt Chart Content */}
      <div style={{ width: timelineWidth }}>
        {Object.entries(groupedTasks).map(([collection, tasks]) => (
          <div key={collection}>
            {/* Collection Header Row */}
            {collection !== "No Collection" && (
              <div
                className="border-b border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 relative"
                style={{ height: rowHeight }}
              >
                <div className="h-full flex items-center px-4">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    📁 {collection}
                  </span>
                </div>
                {/* Grid lines for collection header */}
                {gridLines.map((position, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-blue-300 dark:bg-blue-600 opacity-40"
                    style={{ left: `${position}px` }}
                  />
                ))}
              </div>
            )}

            {/* Task Rows */}
            {tasks.map((task) => {
              const { left, width } = calculateTaskPosition(task);
              const progress = getTaskProgress(task);

              return (
                <div
                  key={task.id}
                  className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
                  style={{ height: rowHeight }}
                >
                  {/* Grid lines for task row */}
                  {gridLines.map((position, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-500 opacity-30"
                      style={{ left: `${position}px` }}
                    />
                  ))}

                  <div className="relative h-full py-3 px-2">
                    {/* Task Bar */}
                    <div
                      className="absolute rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all group"
                      style={{
                        left: left,
                        width: width,
                        top: "12px",
                        height: "36px",
                        background: getTaskGradient(task),
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {/* Progress Bar */}
                      <div
                        className="absolute top-0 left-0 h-full rounded-lg opacity-60"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: "rgba(255, 255, 255, 0.3)",
                        }}
                      />

                      {/* Task Label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-white text-xs font-medium truncate drop-shadow-sm">
                          {task.title}
                        </span>
                      </div>

                      {/* Priority indicator dot */}
                      <div
                        className="absolute top-1 right-1 w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getTaskPriorityColor(task),
                          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                        }}
                      />

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-gray-300">
                          Progress: {progress}% | Priority: {task.priority}
                        </div>
                        <div className="text-gray-300">
                          {new Date(task.startDate!).toLocaleDateString()} -{" "}
                          {new Date(task.dueDate!).toLocaleDateString()}
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
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
  );
};

export default GanttTimelineBody;
