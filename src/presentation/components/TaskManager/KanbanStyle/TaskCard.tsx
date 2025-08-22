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

// Animated Priority Indicator Component
const PriorityIndicator: React.FC<{ priority: Priority }> = ({ priority }) => {
  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case "low":
        return {
          color: "#10b981", // green
          shape: "circle",
          animation: "none",
        };
      case "medium":
        return {
          color: "#f59e0b", // yellow
          shape: "diamond",
          animation: "none",
        };
      case "high":
        return {
          color: "#f97316", // orange
          shape: "triangle",
          animation: "none",
        };
      case "urgent":
        return {
          color: "#ef4444", // red
          shape: "exclamation",
          animation: "none",
        };
      default:
        return {
          color: "#6b7280", // gray
          shape: "circle",
          animation: "none",
        };
    }
  };

  const config = getPriorityConfig(priority);

  const renderShape = () => {
    const baseClasses = "transition-all duration-300";

    switch (config.shape) {
      case "circle":
        return (
          <div
            className={`w-3 h-3 rounded-full ${baseClasses} ${
              config.animation === "pulse" ? "animate-pulse" : ""
            }`}
            style={{ backgroundColor: config.color }}
          />
        );

      case "diamond":
        return (
          <div
            className={`w-3 h-3 transform rotate-45 ${baseClasses} ${
              config.animation === "bounce" ? "animate-bounce" : ""
            }`}
            style={{ backgroundColor: config.color }}
          />
        );

      case "triangle":
        return (
          <div className={`relative ${baseClasses}`}>
            <div
              className={`w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent ${
                config.animation === "pulse-fast" ? "animate-pulse" : ""
              }`}
              style={{
                borderBottomColor: config.color,
                animationDuration:
                  config.animation === "pulse-fast" ? "1s" : undefined,
              }}
            />
          </div>
        );

      case "exclamation":
        return (
          <div className={`relative flex flex-col items-center ${baseClasses}`}>
            <div
              className={`w-1 h-2 rounded-sm ${
                config.animation === "flash" ? "animate-ping" : ""
              }`}
              style={{ backgroundColor: config.color }}
            />
            <div
              className={`w-1 h-1 rounded-full mt-0.5 ${
                config.animation === "flash" ? "animate-ping" : ""
              }`}
              style={{
                backgroundColor: config.color,
                animationDelay:
                  config.animation === "flash" ? "0.2s" : undefined,
              }}
            />
          </div>
        );

      default:
        return (
          <div
            className={`w-3 h-3 rounded-full ${baseClasses}`}
            style={{ backgroundColor: config.color }}
          />
        );
    }
  };

  return (
    <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
      {renderShape()}
    </div>
  );
};

const formatDateRange = (startDate?: Date | null, dueDate?: Date | null) => {
  if (!startDate && !dueDate) return "No dates set";

  const currentYear = new Date().getFullYear();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: year !== currentYear ? "numeric" : undefined,
    });
  };

  if (startDate && dueDate) {
    return `${formatDate(startDate)} - ${formatDate(dueDate)}`;
  } else if (startDate && !dueDate) {
    return `${formatDate(startDate)} - ???`;
  } else if (!startDate && dueDate) {
    return `??? - ${formatDate(dueDate)}`;
  }

  return "No dates set";
};

// Helper function to get tag color information

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
      className="bg-card-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 min-h-[120px] flex flex-col group"
    >
      {/* 1. Due Date & Time + Priority + Edit Button with border-bottom */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Priority Indicator */}
          <PriorityIndicator priority={task.priority} />

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium truncate">
              {formatDateRange(task.startDate, task.dueDate)}
            </span>
          </div>
        </div>

        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
          className="font-semibold text-base text-text-primary hover:text-text-secondary break-words hyphens-auto cursor-pointer transition-colors duration-200"
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

          {/* Collection (if exists) */}
          {task.collection && (
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="font-medium text-xs truncate text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full"
                title={task.collection} // Show full collection on hover
              >
                {task.collection}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
