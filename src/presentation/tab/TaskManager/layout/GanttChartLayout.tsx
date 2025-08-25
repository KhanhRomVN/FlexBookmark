// src/presentation/tab/TaskManager/layout/GanttChartLayout.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Task, Priority, Status } from "../../../types/task";
import { ChevronDown, ChevronRight, Calendar, Clock } from "lucide-react";

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

interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  collection: string;
  status: Status;
  priority: Priority;
  originalTask: Task;
}

interface CollectionGroup {
  collection: string;
  label: string;
  tasks: GanttTask[];
  isExpanded: boolean;
}

// Color schemes for collections, status, and priority
const COLLECTION_COLORS: Record<string, string> = {
  dashboard: "#8B5CF6", // Purple
  "mobile-app": "#3B82F6", // Blue
  feature: "#10B981", // Emerald
  bug: "#EF4444", // Red
  enhancement: "#F59E0B", // Amber
  default: "#6B7280", // Gray
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: "#6B7280", // Gray
  todo: "#3B82F6", // Blue
  "in-progress": "#F59E0B", // Amber
  done: "#10B981", // Emerald
  overdue: "#EF4444", // Red
  archive: "#374151", // Dark Gray
};

const PRIORITY_OPACITY: Record<Priority, number> = {
  low: 0.6,
  medium: 0.8,
  high: 0.9,
  urgent: 1.0,
};

// Move getCollectionLabel outside of component to avoid hoisting issues
const getCollectionLabel = (collection: string): string => {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    "mobile-app": "Mobile App",
    feature: "Feature",
    bug: "Bug",
    enhancement: "Enhancement",
    default: "Uncategorized",
  };
  return labels[collection] || collection;
};

const GanttChartLayout: React.FC<GanttChartLayoutProps> = ({
  filteredLists,
  onTaskClick,
}) => {
  const [collectionStates, setCollectionStates] = useState<
    Record<string, boolean>
  >({});
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const [scrollPosition, setScrollPosition] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter tasks that have both start and due dates
  const validGanttTasks = useMemo(() => {
    const tasks: GanttTask[] = [];

    filteredLists.forEach((list) => {
      list.tasks.forEach((task) => {
        // Only include tasks that have both start and due dates
        const hasStartDate = task.startDate && task.startTime;
        const hasDueDate = task.dueDate && task.dueTime;

        if (hasStartDate && hasDueDate) {
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

          // Only add if end is after start
          if (combinedEnd > combinedStart) {
            tasks.push({
              id: task.id,
              title: task.title,
              startDate: combinedStart,
              endDate: combinedEnd,
              collection: task.collection || "default",
              status: task.status,
              priority: task.priority,
              originalTask: task,
            });
          }
        }
      });
    });

    return tasks;
  }, [filteredLists]);

  // Check if we have any valid Gantt tasks
  const hasValidTasks = validGanttTasks.length > 0;

  // Group tasks by collection
  const collectionGroups = useMemo(() => {
    const groups: Record<string, GanttTask[]> = {};

    validGanttTasks.forEach((task) => {
      const collection = task.collection || "default";
      if (!groups[collection]) {
        groups[collection] = [];
      }
      groups[collection].push(task);
    });

    // Sort tasks within each collection by start date
    Object.keys(groups).forEach((collection) => {
      groups[collection].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
    });

    // Convert to collection groups array
    return Object.keys(groups)
      .sort() // Sort collection names alphabetically
      .map((collection) => ({
        collection,
        label: getCollectionLabel(collection), // Now this function is available
        tasks: groups[collection],
        isExpanded: collectionStates[collection] !== false, // Default to expanded
      }));
  }, [validGanttTasks, collectionStates]);

  // Calculate timeline range
  useEffect(() => {
    if (validGanttTasks.length === 0) return;

    const allDates = validGanttTasks.flatMap((task) => [
      task.startDate,
      task.endDate,
    ]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Add some padding to the timeline
    const padding = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
    setTimelineStart(new Date(minDate.getTime() - padding));
    setTimelineEnd(new Date(maxDate.getTime() + padding));
  }, [validGanttTasks]);

  // Generate timeline days
  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(timelineStart);

    while (current <= timelineEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [timelineStart, timelineEnd]);

  // Utility functions
  const getTaskColor = (task: GanttTask): string => {
    const collectionColor =
      COLLECTION_COLORS[task.collection] || COLLECTION_COLORS.default;
    return collectionColor;
  };

  const getTaskOpacity = (task: GanttTask): number => {
    return PRIORITY_OPACITY[task.priority];
  };

  const toggleCollection = (collection: string) => {
    setCollectionStates((prev) => ({
      ...prev,
      [collection]: !prev[collection],
    }));
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateShort = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
    }).format(date);
  };

  const calculateTaskPosition = (task: GanttTask) => {
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const taskStart = task.startDate.getTime() - timelineStart.getTime();
    const taskDuration = task.endDate.getTime() - task.startDate.getTime();

    const left = (taskStart / totalDuration) * 100;
    const width = Math.max((taskDuration / totalDuration) * 100, 0.5); // Minimum width

    return { left: `${left}%`, width: `${width}%` };
  };

  // Algorithm to avoid overlapping tasks
  const getTaskLanes = (tasks: GanttTask[]) => {
    const lanes: GanttTask[][] = [];

    // Sort tasks by start date
    const sortedTasks = [...tasks].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    sortedTasks.forEach((task) => {
      // Find the first lane where this task doesn't overlap
      let placedInLane = false;

      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const lastTaskInLane = lane[lane.length - 1];

        // Check if this task can be placed in this lane (no overlap)
        if (task.startDate >= lastTaskInLane.endDate) {
          lane.push(task);
          placedInLane = true;
          break;
        }
      }

      // If not placed in any existing lane, create a new one
      if (!placedInLane) {
        lanes.push([task]);
      }
    });

    return lanes;
  };

  // Handle synchronized scrolling
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollPosition(scrollTop);
    if (chartRef.current) {
      chartRef.current.scrollTop = scrollTop;
    }
  };

  const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollPosition(scrollTop);
    if (tableRef.current) {
      tableRef.current.scrollTop = scrollTop;
    }
  };

  // Early return if no valid tasks
  if (!hasValidTasks) {
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
    <div className="flex-1 h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Table Panel */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Table Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Task Schedule
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {validGanttTasks.length} tasks with timeline data
          </div>
        </div>

        {/* Column Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            <div className="col-span-5">Task</div>
            <div className="col-span-3">From</div>
            <div className="col-span-4">To</div>
          </div>
        </div>

        {/* Scrollable Task List */}
        <div
          ref={tableRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleTableScroll}
          style={{ scrollBehavior: "smooth" }}
        >
          {collectionGroups.map((group) => (
            <div
              key={group.collection}
              className="border-b border-gray-100 dark:border-gray-700"
            >
              {/* Collection Header */}
              <button
                onClick={() => toggleCollection(group.collection)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-750 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {group.isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        COLLECTION_COLORS[group.collection] ||
                        COLLECTION_COLORS.default,
                    }}
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {group.label}
                  </span>
                  <span className="text-sm text-gray-500 bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {group.tasks.length}
                  </span>
                </div>
              </button>

              {/* Collection Tasks */}
              {group.isExpanded && (
                <div>
                  {getTaskLanes(group.tasks).map((lane, laneIndex) => (
                    <div key={laneIndex}>
                      {lane.map((task) => (
                        <div
                          key={task.id}
                          className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-colors"
                          onClick={() => onTaskClick(task.originalTask)}
                        >
                          <div className="grid grid-cols-12 gap-2 text-sm">
                            <div className="col-span-5">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: getTaskColor(task),
                                    opacity: getTaskOpacity(task),
                                  }}
                                />
                                <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
                                  {task.title}
                                </span>
                              </div>
                            </div>
                            <div className="col-span-3 text-gray-600 dark:text-gray-400">
                              <div className="text-xs">
                                {formatDate(task.startDate)}
                              </div>
                            </div>
                            <div className="col-span-4 text-gray-600 dark:text-gray-400">
                              <div className="text-xs">
                                {formatDate(task.endDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Chart Panel */}
      <div className="flex-1 flex flex-col">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              Timeline: {formatDateShort(timelineStart)} -{" "}
              {formatDateShort(timelineEnd)}
            </div>
          </div>
        </div>

        {/* Timeline Days Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
          <div
            className="flex"
            style={{ minWidth: `${timelineDays.length * 60}px` }}
          >
            {timelineDays.map((day, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-center text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                style={{ width: "60px" }}
              >
                <div className="p-2">
                  <div className="font-medium">{formatDateShort(day)}</div>
                  <div className="text-xs opacity-75">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Gantt Chart */}
        <div
          ref={chartRef}
          className="flex-1 overflow-auto bg-white dark:bg-gray-800"
          onScroll={handleChartScroll}
        >
          <div
            className="relative"
            style={{
              minWidth: `${timelineDays.length * 60}px`,
              minHeight: "100%",
            }}
          >
            {/* Timeline Grid */}
            <div className="absolute inset-0 flex">
              {timelineDays.map((day, index) => (
                <div
                  key={index}
                  className="border-r border-gray-100 dark:border-gray-700 last:border-r-0"
                  style={{ width: "60px" }}
                />
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative">
              {collectionGroups.map((group) => (
                <div key={group.collection}>
                  {/* Collection Header Space */}
                  <div className="h-12 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750" />

                  {/* Collection Tasks */}
                  {group.isExpanded && (
                    <div>
                      {getTaskLanes(group.tasks).map((lane, laneIndex) => (
                        <div key={laneIndex} className="relative">
                          {lane.map((task) => {
                            const position = calculateTaskPosition(task);
                            return (
                              <div
                                key={task.id}
                                className="relative h-10 border-b border-gray-50 dark:border-gray-800"
                              >
                                <div
                                  className="absolute top-2 h-6 rounded cursor-pointer shadow-sm hover:shadow-md transition-shadow flex items-center px-2 text-white text-xs font-medium"
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    backgroundColor: getTaskColor(task),
                                    opacity: getTaskOpacity(task),
                                    minWidth: "60px",
                                  }}
                                  onClick={() => onTaskClick(task.originalTask)}
                                  title={`${task.title}\n${formatDate(
                                    task.startDate
                                  )} - ${formatDate(task.endDate)}`}
                                >
                                  <span className="truncate">{task.title}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChartLayout;
