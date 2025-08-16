import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../tab/TaskAndEvent";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { folder: task.folder },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {task.title}
        </h4>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      {task.due && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{task.due.toLocaleDateString()}</span>
        </div>
      )}

      <div className="mt-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              task.completed ? "bg-green-500" : "bg-yellow-500"
            }`}
          ></span>
          <span className="text-xs">
            {task.completed ? "Completed" : "Pending"}
          </span>
        </div>

        <div className="flex -space-x-1">
          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800"></div>
          <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800"></div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
