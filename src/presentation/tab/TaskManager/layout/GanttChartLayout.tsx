// src/presentation/tab/TaskManager/layout/GanttChartLayout.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Task, Status } from "../../../types/task";
import { Calendar } from "lucide-react";
import TaskListPanel from "../../../components/TaskManager/KanttChartStyle/TaskListPanel";
import GanttTimelinePanel from "../../../components/TaskManager/KanttChartStyle/GanttTimelinePanel";

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

const GanttChartLayout: React.FC<GanttChartLayoutProps> = ({
  filteredLists,
  onTaskClick,
}) => {
  // State for view controls
  const [timeRange, setTimeRange] = useState<string>("month");
  const [taskListWidth, setTaskListWidth] = useState(300);

  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(800);

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

  // Handle timeline container width
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

  // Handle width change from TaskListPanel
  const handleTaskListWidthChange = (newWidth: number) => {
    setTaskListWidth(newWidth);
  };

  // Handle time range change from TaskListPanel
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

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
      className="flex-1 h-full flex bg-white dark:bg-gray-900"
    >
      {/* Task List Panel */}
      <TaskListPanel
        allTasks={allTasks}
        onTaskClick={onTaskClick}
        width={taskListWidth}
        onWidthChange={handleTaskListWidthChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      {/* Timeline Panel */}
      <GanttTimelinePanel
        allTasks={allTasks}
        onTaskClick={onTaskClick}
        timeRange={timeRange}
        containerWidth={timelineWidth}
      />
    </div>
  );
};

export default GanttChartLayout;
