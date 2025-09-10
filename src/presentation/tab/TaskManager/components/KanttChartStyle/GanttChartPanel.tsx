// src/presentation/tab/TaskManager/components/GanttChartPanel.tsx

import React, { useState, useMemo } from "react";
import { Task, Status, Priority } from "../../../../types/task";
import { Calendar } from "lucide-react";
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

interface GanttChartPanelProps {
  filteredLists: {
    id: string;
    title: string;
    emoji: string;
    tasks: Task[];
  }[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
}

// Color mappings
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

const GanttChartPanel: React.FC<GanttChartPanelProps> = ({
  filteredLists,
  onTaskClick,
  selectedTaskId,
}) => {
  // State for view controls
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

  // Get all tasks from filtered lists and convert to GanttTask format
  const ganttTasks = useMemo(() => {
    const tasks = filteredLists.flatMap((list) => list.tasks);

    const validTasks = tasks.filter((task) => {
      // Only include tasks that have both start and due dates
      return task.startDate && task.dueDate;
    });

    if (validTasks.length === 0) return [];

    const ganttTasks: GanttTask[] = [];
    const collections: Record<string, Task[]> = {};

    // Group tasks by collection
    validTasks.forEach((task) => {
      const collection = task.collection || "No Collection";
      if (!collections[collection]) {
        collections[collection] = [];
      }
      collections[collection].push(task);
    });

    // Convert to GanttTask format with collection headers
    Object.entries(collections).forEach(([collection, collectionTasks]) => {
      // Add collection header if not "No Collection"
      if (collection !== "No Collection") {
        const collectionStart = new Date(
          Math.min(
            ...collectionTasks.map((t) => new Date(t.startDate!).getTime())
          )
        );
        const collectionEnd = new Date(
          Math.max(
            ...collectionTasks.map((t) => new Date(t.dueDate!).getTime())
          )
        );

        ganttTasks.push({
          id: `collection-${collection}`,
          name: `📁 ${collection}`,
          start: collectionStart,
          end: collectionEnd,
          progress: 0,
          type: "project",
          hideChildren: false,
          displayOrder: ganttTasks.length,
        });
      }

      // Add tasks in this collection
      collectionTasks
        .sort(
          (a, b) =>
            new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
        )
        .forEach((task) => {
          const startDate = new Date(task.startDate!);
          const dueDate = new Date(task.dueDate!);

          // Combine date and time if available
          if (task.startTime) {
            const startTime = new Date(task.startTime);
            startDate.setHours(startTime.getHours(), startTime.getMinutes());
          }

          if (task.dueTime) {
            const dueTime = new Date(task.dueTime);
            dueDate.setHours(dueTime.getHours(), dueTime.getMinutes());
          }

          // Calculate progress based on status
          let progress = 0;
          if (task.completed || task.status === "done") progress = 100;
          else if (task.status === "in-progress") progress = 50;
          else if (task.status === "todo") progress = 25;

          ganttTasks.push({
            id: task.id,
            name: task.title,
            start: startDate,
            end: dueDate,
            progress: progress,
            type: "task",
            project:
              collection !== "No Collection"
                ? `collection-${collection}`
                : undefined,
            displayOrder: ganttTasks.length,
            styles: {
              backgroundColor: STATUS_COLORS[task.status] || STATUS_COLORS.todo,
              backgroundSelectedColor:
                PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium,
              progressColor: "rgba(255, 255, 255, 0.5)",
              progressSelectedColor: "rgba(255, 255, 255, 0.8)",
            },
          });
        });
    });

    return ganttTasks;
  }, [filteredLists]);

  // Handle task selection
  const handleSelect = (task: GanttTask, isSelected: boolean) => {
    if (isSelected && task.type === "task") {
      // Find the original task
      const originalTask = filteredLists
        .flatMap((list) => list.tasks)
        .find((t) => t.id === task.id);

      if (originalTask) {
        onTaskClick(originalTask);
      }
    }
  };

  // Handle task date changes (optional - you can implement task updates here)
  const handleDateChange = (task: GanttTask) => {
    // Implement task update logic here
  };

  // Handle progress changes (optional)
  const handleProgressChange = (task: GanttTask) => {
    // Implement progress update logic here
  };

  // Handle task deletion (optional)
  const handleDelete = (task: GanttTask) => {
    // Implement task deletion logic here
  };

  // Get column width based on view mode
  const getColumnWidth = (viewMode: ViewMode): number => {
    switch (viewMode) {
      case ViewMode.Hour:
        return 60;
      case ViewMode.QuarterDay:
        return 80;
      case ViewMode.HalfDay:
        return 100;
      case ViewMode.Day:
        return 65;
      case ViewMode.Week:
        return 100;
      case ViewMode.Month:
        return 120;
      case ViewMode.Year:
        return 200;
      default:
        return 100;
    }
  };

  if (ganttTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Gantt Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To use the Gantt chart view, tasks must have both start date and due
            date configured.
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
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Controls Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Gantt Chart ({ganttTasks.filter((t) => t.type === "task").length}{" "}
            tasks)
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              View:
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={ViewMode.Hour}>Hour</option>
              <option value={ViewMode.QuarterDay}>Quarter Day</option>
              <option value={ViewMode.HalfDay}>Half Day</option>
              <option value={ViewMode.Day}>Day</option>
              <option value={ViewMode.Week}>Week</option>
              <option value={ViewMode.Month}>Month</option>
              <option value={ViewMode.Year}>Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 min-h-0 w-full overflow-auto">
        <div className="h-full min-w-full">
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onSelect={handleSelect}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
            onDelete={handleDelete}
            columnWidth={getColumnWidth(viewMode)}
            listCellWidth="0px" // Completely hide the built-in task list since we have our own
            rowHeight={50}
            ganttHeight={window.innerHeight - 200} // Dynamic height based on window
            preStepsCount={2} // Show more months/periods before the first task
            fontSize="14"
            fontFamily="Inter, system-ui, sans-serif"
            barCornerRadius={6}
            handleWidth={8}
            timeStep={300000} // 5 minutes
            // Enable scrolling
            scrollX={true}
            scrollY={true}
            // Header configuration for better display
            viewDate={ganttTasks.length > 0 ? ganttTasks[0].start : new Date()}
            // Custom styling
            TooltipContent={({ task, fontSize, fontFamily }) => (
              <div className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-lg shadow-lg max-w-xs z-50">
                <div className="font-semibold text-sm mb-1">{task.name}</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Progress: {task.progress}%</div>
                  <div>Start: {task.start.toLocaleDateString("vi-VN")}</div>
                  <div>End: {task.end.toLocaleDateString("vi-VN")}</div>
                  <div>
                    Duration:{" "}
                    {Math.ceil(
                      (task.end.getTime() - task.start.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </div>
                </div>
              </div>
            )}
            // Custom header format for better display
            headerHeight={80} // Increase header height for two-row display
            columnHeaderContainer={{
              style: {
                backgroundColor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
              },
            }}
          />
        </div>
      </div>

      {/* Custom CSS for better Gantt display */}
      <style jsx global>{`
        .gantt-container {
          width: 100% !important;
          overflow-x: auto !important;
        }

        .gantt-table {
          width: 100% !important;
          min-width: 800px !important;
        }

        .gantt-header {
          background-color: #f8fafc !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }

        .gantt-header-cell {
          border-right: 1px solid #e2e8f0 !important;
          text-align: center !important;
          font-weight: 600 !important;
          color: #374151 !important;
        }

        .gantt-task-list {
          display: none !important;
        }

        .gantt-vertical-container {
          overflow-x: auto !important;
          width: 100% !important;
        }

        .gantt-grid-body {
          width: 100% !important;
        }

        .gantt-today-line {
          stroke: #ef4444 !important;
          stroke-width: 2 !important;
        }

        .gantt-task-bar {
          cursor: pointer !important;
        }

        .gantt-task-bar:hover {
          opacity: 0.8 !important;
        }

        .gantt-task-progress {
          opacity: 0.7 !important;
        }
      `}</style>
    </div>
  );
};

export default GanttChartPanel;
