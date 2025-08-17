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
import { MoreHorizontal, Edit } from "lucide-react";

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

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const completedSubtasks =
    task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerUp={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-grab hover:shadow-md transition-all"
    >
      {/* Line 1: Date and Edit */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(task.endTime)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="h-4 w-4" />
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

      {/* Line 2: Title */}
      <h4
        onClick={onClick}
        className="font-medium text-gray-900 dark:text-white hover:underline mb-3 line-clamp-2"
      >
        {task.title}
      </h4>

      {/* Line 3: Subtasks and Priority */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {totalSubtasks > 0 && (
            <>
              <span className="bg-gray-200 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {completedSubtasks}/{totalSubtasks}
              </span>
              <span>Subtasks</span>
            </>
          )}
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
