// src/presentation/tab/TaskManager/layout/GanttChartLayout.tsx

import React, { useState } from "react";
import { Task, Status } from "../../../types/task";
import TaskListPanel from "../components/KanttChartStyle/TaskListPanel";
import GanttChartPanel from "../components/KanttChartStyle/GanttChartPanel";

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [showTaskList, setShowTaskList] = useState<boolean>(true);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    onTaskClick(task);
  };

  const toggleTaskList = () => {
    setShowTaskList(!showTaskList);
  };

  return (
    <div className="flex-1 h-full flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Left Panel - Task List (Collapsible) */}
      {showTaskList && (
        <div className="flex-shrink-0">
          <TaskListPanel
            filteredLists={filteredLists}
            onTaskClick={handleTaskClick}
            selectedTaskId={selectedTaskId}
          />
        </div>
      )}

      {/* Toggle Button */}
      <div className="flex-shrink-0 w-8 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-600 flex items-center justify-center">
        <button
          onClick={toggleTaskList}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={showTaskList ? "Hide task list" : "Show task list"}
        >
          <svg
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform ${
              showTaskList ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Right Panel - Gantt Chart */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <GanttChartPanel
          filteredLists={filteredLists}
          onTaskClick={handleTaskClick}
          selectedTaskId={selectedTaskId}
        />
      </div>
    </div>
  );
};

export default GanttChartLayout;
