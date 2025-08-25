// src/presentation/tab/TaskManager/layout/GanttChartLayout.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Task, Priority, Status } from "../../../types/task";
import {
  Calendar,
  Settings,
  Download,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GanttChartLayoutProps {
  filteredLists: {
    id: string;
    title: string;
    emoji: string;
    tasks: Task[];
  }[];
  onTaskClick: (task: Task) => void;
  onDragEnd?: (event: any) => void;
  quickAddStatus?: Status | null;
  setQuickAddStatus?: (status: Status | null) => void;
  quickAddTitle?: string;
  setQuickAddTitle?: (title: string) => void;
  handleQuickAddTask?: (status: Status) => Promise<void>;
  onArchiveTasks?: (folderId: string) => void;
  onDeleteTasks?: (folderId: string) => void;
  onSortTasks?: (folderId: string, sortType: string) => void;
  onStatusTransition?: (
    taskId: string,
    fromStatus: Status,
    toStatus: Status
  ) => void;
}

// Color schemes for status and priority
const STATUS_COLORS: Record<Status, string> = {
  backlog: "#6B7280", // Gray
  todo: "#3B82F6", // Blue
  "in-progress": "#F59E0B", // Amber
  done: "#10B981", // Emerald
  overdue: "#EF4444", // Red
  archive: "#374151", // Dark Gray
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#94A3B8", // Slate
  medium: "#3B82F6", // Blue
  high: "#F59E0B", // Amber
  urgent: "#EF4444", // Red
};

// Time range options
type TimeRange = "day" | "week" | "month" | "quarter" | "year";

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
        case "week":
          next.setDate(current.getDate() + 7);
          label = `Week ${Math.ceil(current.getDate() / 7)}`;
          break;
        case "month":
          next.setMonth(current.getMonth() + 1);
          label = current.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
          break;
        case "quarter":
          next.setMonth(current.getMonth() + 3);
          const quarter = Math.floor(current.getMonth() / 3) + 1;
          label = `Q${quarter} ${current.getFullYear()}`;
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

const GanttChartLayout: React.FC<GanttChartLayoutProps> = ({
  filteredLists,
  onTaskClick,
}) => {
  // State for view controls
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [showSettings, setShowSettings] = useState(false);
  const [taskListWidth, setTaskListWidth] = useState(300);

  // Scroll and navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all tasks from filtered lists and sort by start date/time
  const allTasks = useMemo(() => {
    const tasks = filteredLists.flatMap((list) => list.tasks);

    return tasks
      .filter((task) => {
        // Only include tasks that have both start and due dates
        return task.startDate && task.dueDate && task.startTime && task.dueTime;
      })
      .sort((a, b) => {
        // Sort by start date/time
        const aStart = new Date(a.startDate!);
        const bStart = new Date(b.startDate!);

        if (a.startTime && b.startTime) {
          const aTime = new Date(a.startTime);
          const bTime = new Date(b.startTime);

          // Combine date and time for accurate sorting
          const aCombined = new Date(
            aStart.getFullYear(),
            aStart.getMonth(),
            aStart.getDate(),
            aTime.getHours(),
            aTime.getMinutes()
          );

          const bCombined = new Date(
            bStart.getFullYear(),
            bStart.getMonth(),
            bStart.getDate(),
            bTime.getHours(),
            bTime.getMinutes()
          );

          return aCombined.getTime() - bCombined.getTime();
        }

        return aStart.getTime() - bStart.getTime();
      });
  }, [filteredLists]);

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

    // Add some padding
    const padding = timeRange === "day" ? 7 : timeRange === "week" ? 14 : 30; // days
    const start = new Date(minStart);
    start.setDate(start.getDate() - padding);

    const end = new Date(maxEnd);
    end.setDate(end.getDate() + padding);

    return { timelineStart: start, timelineEnd: end };
  }, [allTasks, timeRange]);

  // Calculate task bar positions and dimensions
  const calculateTaskPosition = (task: Task, containerWidth: number) => {
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

    const left = (taskStartMs / totalMs) * containerWidth;
    const width = Math.max((taskDurationMs / totalMs) * containerWidth, 20); // Minimum width of 20px

    return { left, width };
  };

  // Task progress calculation
  const getTaskProgress = (task: Task) => {
    if (task.completed || task.status === "done") return 100;
    if (task.status === "in-progress") return 50;
    if (task.status === "todo") return 25;
    return 0;
  };

  // Navigation functions
  const navigateTimeline = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (timeRange) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 28 : -28));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 3 : -3));
        break;
      case "quarter":
        newDate.setMonth(
          newDate.getMonth() + (direction === "next" ? 12 : -12)
        );
        break;
      case "year":
        newDate.setFullYear(
          newDate.getFullYear() + (direction === "next" ? 3 : -3)
        );
        break;
    }

    setCurrentDate(newDate);
  };

  // Get task bar color based on status and priority
  const getTaskColor = (task: Task) => {
    return STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  };

  const getTaskPriorityIndicator = (task: Task) => {
    return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  };

  // Handle timeline container width
  const [timelineWidth, setTimelineWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setTimelineWidth(Math.max(containerWidth - taskListWidth, 400));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [taskListWidth]);

  // Time range options
  const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
  ];

  if (allTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Gantt Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To use the Gantt chart view, tasks must have both start date/time
            and due date/time configured.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Add dates to your tasks to see them here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full flex flex-col bg-white dark:bg-gray-900"
    >
      {/* Header Controls */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        {/* Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                View:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Task List Width Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Task List Width:
              </label>
              <input
                type="range"
                min="200"
                max="500"
                value={taskListWidth}
                onChange={(e) => setTaskListWidth(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>

          {/* Timeline Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTimeline("prev")}
              className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateTimeline("next")}
              className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List Sidebar */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
          style={{ width: taskListWidth }}
        >
          <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              Tasks ({allTasks.length})
            </h4>
          </div>

          <div className="overflow-y-auto h-full">
            {allTasks.map((task, index) => (
              <div
                key={task.id}
                className="border-b border-gray-200 dark:border-gray-600 p-3 hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {/* Priority Indicator */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTaskPriorityIndicator(task) }}
                  />

                  {/* Task Title */}
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                    {task.title}
                  </div>

                  {/* Status Indicator */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTaskColor(task) }}
                  />
                </div>

                {/* Task Meta Info */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>
                    {new Date(task.startDate!).toLocaleDateString()} -{" "}
                    {new Date(task.dueDate!).toLocaleDateString()}
                  </div>
                  {task.collection && (
                    <div className="capitalize">📁 {task.collection}</div>
                  )}
                  <div className="capitalize">
                    {task.status.replace("-", " ")} • {task.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Header */}
          <TimelineHeader
            timeRange={timeRange}
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
              {allTasks.map((task, index) => {
                const { left, width } = calculateTaskPosition(
                  task,
                  timelineWidth
                );
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChartLayout;
