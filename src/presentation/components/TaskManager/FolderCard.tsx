import React from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import type { Task } from "../../types/task";

interface FolderCardProps {
  id: string;
  title: string;
  emoji?: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isAdding?: boolean;
  newTaskTitle?: string;
  setNewTaskTitle?: (title: string) => void;
  onAddTask: () => void;
  onCancelAdd?: () => void;
  onSubmitAdd?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  id,
  title,
  emoji,
  tasks,
  onTaskClick,
  isAdding = false,
  newTaskTitle = "",
  setNewTaskTitle,
  onAddTask,
  onCancelAdd,
  onSubmitAdd,
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 dark:bg-gray-700 rounded-xl shadow w-full flex flex-col"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          <span className="flex-1">{title}</span>
          <span className="bg-gray-200 dark:bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="overflow-y-auto p-3 space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}

        {isAdding ? (
          <div className="w-full flex gap-2">
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmitAdd?.();
                }
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
            />
            <button
              onClick={onSubmitAdd}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={onCancelAdd}
              className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onAddTask}
            className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
