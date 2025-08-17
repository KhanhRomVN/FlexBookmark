import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, Priority } from "../../types/task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  MoreHorizontal,
  Calendar,
  Clock,
  Paperclip,
  CheckSquare,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const getPriorityTextColor = (priority: Priority) => {
  switch (priority) {
    case "low":
      return "text-green-600 dark:text-green-400";
    case "medium":
      return "text-yellow-600 dark:text-yellow-400";
    case "high":
      return "text-orange-600 dark:text-orange-400";
    case "urgent":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const formatDateTime = (date?: Date | null, time?: Date | null) => {
  if (!date && !time) return null;

  const displayDate = date || new Date();
  const displayTime = time || new Date();

  const dateStr = displayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const timeStr = displayTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} ${timeStr}`;
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
    task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasAttachments = task.attachments && task.attachments.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onPointerUp={onClick}
      className="bg-card-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 min-h-[120px] flex flex-col"
    >
      {/* 1. Due Date & Time + Edit Button */}
      <div className="flex justify-between items-start mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium truncate">
            {formatDateTime(task.endDate, task.endTime) || "No due date"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              Move To...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              className="text-red-600 dark:text-red-400"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Title with proper word wrapping and max 3 lines */}
      <div className="flex-1 mb-3 min-h-0">
        <h4
          onClick={onClick}
          className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 leading-5 break-words hyphens-auto"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
          }}
          title={task.title} // Show full title on hover
        >
          {task.title}
        </h4>
      </div>

      {/* 3. Additional Information - All in one horizontal line */}
      <div className="flex items-center justify-between gap-2 text-sm flex-shrink-0 mt-auto">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 flex-shrink-0">
              <CheckSquare className="w-4 h-4" />
              <span className="text-xs">
                {completedSubtasks}/{totalSubtasks}
              </span>
              {completedSubtasks === totalSubtasks && totalSubtasks > 0 && (
                <span className="text-green-600 dark:text-green-400 text-xs">
                  ✓
                </span>
              )}
            </div>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 flex-shrink-0">
              <Paperclip className="w-4 h-4" />
              <span className="text-xs">{task.attachments!.length}</span>
            </div>
          )}

          {/* Priority Level - Simple text with color */}
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`font-medium capitalize text-xs truncate ${getPriorityTextColor(
                task.priority
              )}`}
              title={task.priority} // Show full priority on hover
            >
              {task.priority}
            </span>
          </div>
        </div>

        {/* Completion Status Indicator */}
        <div className="flex items-center flex-shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              task.completed
                ? "bg-green-500"
                : task.status === "in-progress"
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
            title={
              task.completed
                ? "Completed"
                : task.status === "in-progress"
                ? "In Progress"
                : "Pending"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
