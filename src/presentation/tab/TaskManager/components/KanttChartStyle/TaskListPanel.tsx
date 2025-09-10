// src/presentation/tab/TaskManager/components/TaskListPanel.tsx

import React from "react";
import { Task, Status } from "../../../../types/task";
import { Folder, Calendar } from "lucide-react";

interface TaskListPanelProps {
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

const TaskListPanel: React.FC<TaskListPanelProps> = ({
  filteredLists,
  onTaskClick,
  selectedTaskId,
}) => {
  // Get all tasks with dates and group by collection
  const tasksWithDates = filteredLists
    .flatMap((list) => list.tasks)
    .filter((task) => task.startDate && task.dueDate);

  const collections = tasksWithDates.reduce((acc, task) => {
    const collection = task.collection || "No Collection";
    if (!acc[collection]) {
      acc[collection] = [];
    }
    acc[collection].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (tasksWithDates.length === 0) {
    return (
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Task List
          </h3>
        </div>
        <div className="p-4 text-center">
          <div className="text-4xl mb-2 opacity-50">📋</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No tasks with dates available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Task List ({tasksWithDates.length} tasks)
        </h3>
      </div>

      {/* Task List - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {Object.entries(collections).map(([collection, collectionTasks]) => (
          <div key={collection} className="mb-1">
            {/* Collection Header */}
            {collection !== "No Collection" && (
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {collection}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    ({collectionTasks.length})
                  </span>
                </div>
              </div>
            )}

            {/* Tasks in Collection */}
            {collectionTasks
              .sort(
                (a, b) =>
                  new Date(a.startDate!).getTime() -
                  new Date(b.startDate!).getTime()
              )
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`px-3 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedTaskId === task.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Indicator */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[task.status] || STATUS_COLORS.todo,
                      }}
                    />

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <div
                        className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${
                          task.completed ? "line-through opacity-60" : ""
                        }`}
                        title={task.title} // Show full title on hover
                      >
                        {task.title}
                      </div>

                      {/* Task Dates */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            {new Date(task.startDate!).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <span className="flex-shrink-0">→</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            {new Date(task.dueDate!).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{
                              width: `${
                                task.completed || task.status === "done"
                                  ? 100
                                  : task.status === "in-progress"
                                  ? 50
                                  : task.status === "todo"
                                  ? 25
                                  : 0
                              }%`,
                              backgroundColor:
                                STATUS_COLORS[task.status] ||
                                STATUS_COLORS.todo,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskListPanel;
