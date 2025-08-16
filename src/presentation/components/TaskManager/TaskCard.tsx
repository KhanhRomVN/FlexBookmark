import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, Priority } from "../../types/task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { status: task.status },
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-grab hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <h4
          onClick={onClick}
          className="font-medium text-gray-900 dark:text-white hover:underline flex-1 pr-2"
        >
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>Edit</DropdownMenuItem>
            <DropdownMenuItem>Move</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.endTime && (
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
          <span>{task.endTime.toLocaleDateString()}</span>
        </div>
      )}

      <div className="mt-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              task.completed ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-xs">
            {task.completed ? "Completed" : "Pending"}
          </span>
        </div>

        {task.priority && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
