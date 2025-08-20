// src/presentation/components/TaskManager/TaskDialog/components/LinkedTasksSection.tsx
import React from "react";
import { Link, ExternalLink } from "lucide-react";
import { Task } from "../../../../types/task";

interface LinkedTasksSectionProps {
  currentTask: Task;
  availableTasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

const LinkedTasksSection: React.FC<LinkedTasksSectionProps> = ({
  currentTask,
  availableTasks,
  onTaskClick,
}) => {
  // Find all tasks that link to this current task through subtasks
  const linkedFromTasks = availableTasks.filter((task) =>
    task.subtasks?.some((subtask) => subtask.linkedTaskId === currentTask.id)
  );

  if (linkedFromTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg text-text-default">Linked From</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These tasks have subtasks linked to this task:
        </p>

        {linkedFromTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
          >
            <Link size={16} className="text-blue-600 dark:text-blue-400" />

            <div className="flex-1">
              <div className="font-medium text-blue-700 dark:text-blue-300">
                {task.title}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {task.subtasks?.find((st) => st.linkedTaskId === currentTask.id)
                  ?.title || "Linked subtask"}
              </div>
            </div>

            {onTaskClick && (
              <button
                onClick={() => onTaskClick(task.id)}
                className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors"
                title="Go to task"
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinkedTasksSection;
