// ListTaskCard.tsx
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  Clock,
  Paperclip,
  CheckSquare,
  Edit3,
  Archive,
  Trash2,
  Flag,
  Circle,
  CheckCircle2,
} from "lucide-react";

// Import predefined tags from TaskCard
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

interface ListTaskCardProps {
  task: Task;
  onClick: () => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case "low":
      return <Flag className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case "medium":
      return <Flag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    case "high":
      return <Flag className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    case "urgent":
      return <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />;
    default:
      return <Flag className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<
    string,
    { label: string; color: string; emoji: string }
  > = {
    backlog: {
      label: "Backlog",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      emoji: "📥",
    },
    todo: {
      label: "To Do",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      emoji: "📋",
    },
    "in-progress": {
      label: "In Progress",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      emoji: "🚧",
    },
    overdue: {
      label: "Overdue",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      emoji: "⏰",
    },
    done: {
      label: "Done",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      emoji: "✅",
    },
  };

  const config = statusConfig[status] || statusConfig.todo;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
};

const formatDateTime = (date?: Date | null, time?: Date | null) => {
  if (!date && !time) return null;

  const displayDate = date || new Date();
  const displayTime = time || new Date();

  const dateStr = displayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = displayTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
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

export const ListTaskCard: React.FC<ListTaskCardProps> = ({
  task,
  onClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
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
      case "toggle-complete":
        onToggleComplete?.(task.id);
        break;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-card-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {/* Complete Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMenuAction("toggle-complete");
          }}
          className="flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
          )}
        </button>

        {/* Priority */}
        <div className="flex-shrink-0">{getPriorityIcon(task.priority)}</div>

        {/* Task Title */}
        <div className="flex-1 min-w-0">
          <h4
            onClick={onClick}
            className={`font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 truncate ${
              task.completed ? "line-through opacity-60" : ""
            }`}
            title={task.title}
          >
            {task.title}
          </h4>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">{getStatusBadge(task.status)}</div>

        {/* Due Date */}
        <div className="flex-shrink-0 min-w-0">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {formatDateTime(task.dueDate, task.dueTime) || "No due date"}
            </span>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {task.tags.slice(0, 2).map((tag, index) => {
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
            {task.tags.length > 2 && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Subtasks & Attachments */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
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

          {hasAttachments && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Paperclip className="w-4 h-4" />
              <span className="text-xs">{task.attachments!.length}</span>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("toggle-complete");
                }}
              >
                {task.completed ? (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Mark Incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </DropdownMenuItem>

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
    </div>
  );
};
