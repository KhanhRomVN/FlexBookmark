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

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700";
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  }
};

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case "low":
      return "🌱";
    case "medium":
      return "📋";
    case "high":
      return "⚡";
    case "urgent":
      return "🔥";
    default:
      return "📋";
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
      className="bg-card-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
    >
      {/* 1. Due Date & Time + Edit Button */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">
            {formatDateTime(task.endDate, task.endTime) || "No due date"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
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

      {/* 2. Title with max 2 lines */}
      <h4
        onClick={onClick}
        className="font-semibold text-gray-900 dark:text-white mb-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 line-clamp-2 leading-5"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </h4>

      {/* 3. Additional Information */}
      <div className="space-y-2">
        {/* Subtasks */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckSquare className="w-4 h-4" />
            <span>
              {completedSubtasks}/{totalSubtasks} subtasks
            </span>
            {completedSubtasks === totalSubtasks && totalSubtasks > 0 && (
              <span className="text-green-600 dark:text-green-400">✓</span>
            )}
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Paperclip className="w-4 h-4" />
            <span>
              {task.attachments!.length} attachment
              {task.attachments!.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Priority Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                task.priority
              )}`}
            >
              <span>{getPriorityIcon(task.priority)}</span>
              <span className="font-medium capitalize">{task.priority}</span>
            </span>
          </div>

          {/* Completion Status Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                task.completed
                  ? "bg-green-500"
                  : task.status === "in-progress"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
