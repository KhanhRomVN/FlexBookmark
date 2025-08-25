// src/presentation/components/TaskManager/GanttChartStyle/TaskListPanel.tsx

import React, { useState, useRef, useEffect } from "react";
import { Task, Priority, Status } from "../../../types/task";
import { ChevronDown, GripVertical } from "lucide-react";
import CustomDropdown, { DropdownOption } from "../../common/CustomDropdown";

interface TaskListPanelProps {
  allTasks: Task[];
  groupedTasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  width: number;
  onWidthChange: (width: number) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  headerHeight: number;
  rowHeight: number;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#94A3B8",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

const STATUS_COLORS: Record<Status, string> = {
  backlog: "#6B7280",
  todo: "#3B82F6",
  "in-progress": "#F59E0B",
  done: "#10B981",
  overdue: "#EF4444",
  archive: "#374151",
};

const TaskListPanel: React.FC<TaskListPanelProps> = ({
  allTasks,
  groupedTasks,
  onTaskClick,
  width,
  onWidthChange,
  timeRange,
  onTimeRangeChange,
  headerHeight,
  rowHeight,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.max(200, Math.min(500, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onWidthChange]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // Time range dropdown options
  const timeRangeOptions: DropdownOption[] = [
    { value: "day", label: "Day" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
  ];

  const getTaskPriorityColor = (task: Task) => {
    return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  };

  const getTaskStatusColor = (task: Task) => {
    return STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  };

  return (
    <div
      ref={panelRef}
      className="flex-shrink-0 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 relative flex flex-col"
      style={{ width }}
    >
      {/* Header - Single row to match timeline header */}
      <div
        className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between px-3"
        style={{ height: headerHeight }}
      >
        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
          Tasks ({allTasks.length})
        </h4>

        {/* Time Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            <span className="capitalize">{timeRange}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <CustomDropdown
            options={timeRangeOptions}
            onSelect={(value) => {
              onTimeRangeChange(value);
              setShowTimeRangeDropdown(false);
            }}
            className={showTimeRangeDropdown ? "block" : "hidden"}
            align="right"
            width="w-24"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedTasks).map(([collection, tasks]) => (
          <div key={collection}>
            {/* Collection Header */}
            {collection !== "No Collection" && (
              <div
                className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 flex items-center px-3"
                style={{ height: rowHeight }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    📁 {collection}
                  </span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">
                    ({tasks.length})
                  </span>
                </div>
              </div>
            )}

            {/* Tasks in Collection */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border-b border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center px-3"
                style={{ height: rowHeight }}
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-2 w-full">
                  {/* Priority Indicator */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTaskPriorityColor(task) }}
                  />

                  {/* Task Title */}
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                    {task.title}
                  </div>

                  {/* Status Indicator */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTaskStatusColor(task) }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default TaskListPanel;
