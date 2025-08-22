import React from "react";
import { Task, Priority } from "../../../types/task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import {
  MoreHorizontal,
  Calendar,
  Paperclip,
  CheckSquare,
  Edit3,
  Archive,
  Trash2,
} from "lucide-react";

// Predefined tags with hex colors
export const PREDEFINED_TAGS = [
  { name: "urgent", color: "#ef4444", textColor: "#ffffff" },
  { name: "important", color: "#f97316", textColor: "#ffffff" },
  { name: "work", color: "#3b82f6", textColor: "#ffffff" },
  { name: "personal", color: "#8b5cf6", textColor: "#ffffff" },
  { name: "meeting", color: "#06b6d4", textColor: "#ffffff" },
  { name: "deadline", color: "#dc2626", textColor: "#ffffff" },
  { name: "review", color: "#059669", textColor: "#ffffff" },
  { name: "bug", color: "#b91c1c", textColor: "#ffffff" },
  { name: "feature", color: "#7c3aed", textColor: "#ffffff" },
  { name: "research", color: "#0891b2", textColor: "#ffffff" },
  { name: "documentation", color: "#65a30d", textColor: "#ffffff" },
  { name: "testing", color: "#ca8a04", textColor: "#000000" },
  { name: "design", color: "#e11d48", textColor: "#ffffff" },
  { name: "planning", color: "#7c2d12", textColor: "#ffffff" },
  { name: "client", color: "#be123c", textColor: "#ffffff" },
  { name: "internal", color: "#4338ca", textColor: "#ffffff" },
  { name: "low-priority", color: "#6b7280", textColor: "#ffffff" },
  { name: "waiting", color: "#f59e0b", textColor: "#000000" },
  { name: "blocked", color: "#991b1b", textColor: "#ffffff" },
  { name: "optional", color: "#9ca3af", textColor: "#000000" },
];

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
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

// Helper function to get tag color information
const getTagStyle = (tagName: string) => {
  const predefinedTag = PREDEFINED_TAGS.find(
    (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
  );

  if (predefinedTag) {
    return {
      backgroundColor: predefinedTag.color,
      color: predefinedTag.textColor,
    };
  }

  // Default style for custom tags
  return {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  };
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
}) => {
  const completedSubtasks =
    task.subtasks?.filter((subtask) => subtask.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasAttachments = task.attachments && task.attachments.length > 0;

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "edit":
        onEditTask?.(task);
        break;
      case "archive":
        onArchiveTask?.(task.id);
        break;
      case "delete":
        onDeleteTask?.(task.id);
        break;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-card-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 min-h-[120px] flex flex-col"
    >
      {/* 1. Due Date & Time + Edit Button */}
      <div className="flex justify-between items-start mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium truncate">
            {formatDateTime(task.dueDate, task.dueTime) || "No due date"}
          </span>
        </div>

        <div className="relative">
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
                  handleMenuAction("edit");
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("archive");
                }}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("delete");
                }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Title with proper word wrapping and max 3 lines */}
      <div className="flex-1 mb-3 min-h-0">
        <h4
          onClick={onClick}
          className="font-semibold text-gray-900 dark:text-white leading-5 break-words hyphens-auto cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
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

      {/* 3. Tags with predefined colors */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => {
            const tagStyle = getTagStyle(tag);
            return (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={tagStyle}
                title={tag}
              >
                {tag.length > 8 ? `${tag.substring(0, 8)}...` : tag}
              </span>
            );
          })}
          {task.tags.length > 3 && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 4. Additional Information - All in one horizontal line */}
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
                : task.status === "overdue"
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
            title={
              task.completed
                ? "Completed"
                : task.status === "in-progress"
                ? "In Progress"
                : task.status === "overdue"
                ? "Overdue"
                : "Pending"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
