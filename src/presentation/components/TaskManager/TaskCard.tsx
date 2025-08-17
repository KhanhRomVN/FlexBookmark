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
import {
  MoreHorizontal,
  Edit,
  Calendar,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "low":
      return "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200/50 dark:from-green-900/30 dark:to-green-800/20 dark:text-green-300 dark:border-green-700/30";
    case "medium":
      return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200/50 dark:from-yellow-900/30 dark:to-yellow-800/20 dark:text-yellow-300 dark:border-yellow-700/30";
    case "high":
      return "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200/50 dark:from-orange-900/30 dark:to-orange-800/20 dark:text-orange-300 dark:border-orange-700/30";
    case "urgent":
      return "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200/50 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-300 dark:border-red-700/30";
    default:
      return "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200/50 dark:from-gray-700/30 dark:to-gray-600/20 dark:text-gray-300 dark:border-gray-600/30";
  }
};

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case "urgent":
      return "🔥";
    case "high":
      return "⚡";
    case "medium":
      return "📋";
    case "low":
      return "🌱";
    default:
      return "📝";
  }
};

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "";
  const today = new Date();
  const taskDate = new Date(date);
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return taskDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { status: task.status },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const completedSubtasks =
    task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const isOverdue = task.endTime && new Date(task.endTime) < new Date();
  const isDueSoon =
    task.endTime &&
    new Date(task.endTime).getTime() - new Date().getTime() <
      2 * 24 * 60 * 60 * 1000;

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
      className={`group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-gray-200/60 dark:border-gray-700/60 p-4 cursor-grab active:cursor-grabbing transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isDragging ? "opacity-50 rotate-3 scale-105" : ""
      } ${isOverdue ? "ring-2 ring-red-400/50" : ""} ${
        isDueSoon && !isOverdue ? "ring-2 ring-orange-400/50" : ""
      }`}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-gray-100/10 dark:from-gray-700/10 dark:to-gray-800/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Priority indicator line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          task.priority === "urgent"
            ? "bg-gradient-to-r from-red-500 to-red-600"
            : task.priority === "high"
            ? "bg-gradient-to-r from-orange-500 to-orange-600"
            : task.priority === "medium"
            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
            : task.priority === "low"
            ? "bg-gradient-to-r from-green-500 to-green-600"
            : "bg-gradient-to-r from-gray-400 to-gray-500"
        }`}
      ></div>

      {/* Header: Date and Actions */}
      <div className="relative flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {task.endTime && (
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                isOverdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : isDueSoon
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {formatDate(task.endTime)}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-full"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={onClick} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">📋 Move</DropdownMenuItem>
            <DropdownMenuItem className="gap-2">📄 Duplicate</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
              🗑️ Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Title */}
      <div className="relative">
        <h4
          onClick={onClick}
          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer mb-3 line-clamp-2 text-sm leading-relaxed transition-colors duration-200"
        >
          {task.title}
        </h4>
      </div>

      {/* Task Description Preview */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Progress
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${subtaskProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer: Subtasks and Priority */}
      <div className="relative flex justify-between items-center">
        <div className="flex items-center gap-2">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                {completedSubtasks === totalSubtasks ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">
                  {completedSubtasks}/{totalSubtasks} tasks
                </span>
              </div>
            </div>
          )}
        </div>

        {task.priority && (
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold border ${getPriorityColor(
              task.priority
            )} shadow-sm`}
          >
            <span className="text-sm">{getPriorityIcon(task.priority)}</span>
            <span className="capitalize tracking-wide">{task.priority}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-gray-100/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded-full font-medium"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 rounded-full">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Drag indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity duration-200">
        <div className="grid grid-cols-2 gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
