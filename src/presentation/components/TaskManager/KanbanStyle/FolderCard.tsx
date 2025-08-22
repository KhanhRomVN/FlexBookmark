import React, { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import type { Task, Status } from "../../../types/task";
import {
  MoreVertical,
  ArrowUpDown,
  Archive,
  Trash2,
  Target,
  X,
} from "lucide-react";

interface FolderCardProps {
  id: string;
  title: string;
  emoji?: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isAdding: boolean;
  newTaskTitle: string;
  setNewTaskTitle: React.Dispatch<React.SetStateAction<string>>;
  onAddTask: () => void;
  onCancelAdd: () => void;
  onSubmitAdd: () => void;
  onArchiveTasks?: (folderId: string) => void;
  onDeleteTasks?: (folderId: string) => void;
  onSortTasks?: (folderId: string, sortType: string) => void;
  // New props for drag-and-drop
  acceptsDrops?: boolean;
  targetStatus?: Status;
}

const FolderCard: React.FC<FolderCardProps> = ({
  id,
  title,
  emoji,
  tasks,
  onTaskClick,
  onArchiveTasks,
  onDeleteTasks,
  onSortTasks,
  acceptsDrops = false,
  targetStatus,
}) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    data: {
      type: "folder",
      status: targetStatus,
      accepts: ["task"],
    },
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { id: "priority-high", label: "Priority (High to Low)" },
    { id: "priority-low", label: "Priority (Low to High)" },
    { id: "due-date-asc", label: "Due Date (Earliest First)" },
    { id: "due-date-desc", label: "Due Date (Latest First)" },
    { id: "title-asc", label: "Title (A to Z)" },
    { id: "title-desc", label: "Title (Z to A)" },
    { id: "created-asc", label: "Created Date (Oldest First)" },
    { id: "created-desc", label: "Created Date (Newest First)" },
    { id: "completion", label: "Completion Status" },
    { id: "tag-count", label: "Tag Count" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = (action: string, value?: string) => {
    switch (action) {
      case "sort":
        if (value) onSortTasks?.(id, value);
        break;
      case "archive":
        onArchiveTasks?.(id);
        break;
      case "delete":
        onDeleteTasks?.(id);
        break;
    }
    setShowDropdown(false);
    setShowSortMenu(false);
  };

  // Determine if this is a valid drop target
  const isDraggedTaskDifferentStatus =
    active?.data?.current?.status !== targetStatus;
  const canAcceptDrop = acceptsDrops && active && isDraggedTaskDifferentStatus;
  const isValidDropTarget = canAcceptDrop && isOver;
  const isHoveringButInvalid = isOver && !canAcceptDrop;

  // Status color mapping for visual feedback
  const getStatusColor = (status?: Status) => {
    switch (status) {
      case "backlog":
        return "border-slate-500 bg-slate-50 dark:bg-slate-900/20";
      case "todo":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "in-progress":
        return "border-amber-500 bg-amber-50 dark:bg-amber-900/20";
      case "done":
        return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
      case "overdue":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      default:
        return "border-gray-200 dark:border-gray-700";
    }
  };

  const baseClasses =
    "bg-card-background rounded-xl w-full flex flex-col min-h-[600px] shadow-sm border transition-all duration-200";
  const dropClasses = isValidDropTarget
    ? `${getStatusColor(
        targetStatus
      )} border-2 shadow-lg transform scale-[1.02]`
    : isHoveringButInvalid
    ? "border-red-300 bg-red-50 dark:bg-red-900/10 border-2"
    : canAcceptDrop
    ? `${getStatusColor(targetStatus)} border-dashed border-2 opacity-80`
    : "border-gray-200 dark:border-gray-700";

  return (
    <div ref={setNodeRef} className={`${baseClasses} ${dropClasses}`}>
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            <span className="flex-1">{title}</span>
            {/* Drop indicator */}
            {isValidDropTarget && (
              <Target className="w-5 h-5 text-green-500 animate-pulse" />
            )}
            {isHoveringButInvalid && <X className="w-5 h-5 text-red-500" />}
          </h3>

          <div className="flex items-center gap-2">
            {/* Task Count Badge */}
            <div
              className={`text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm transition-all duration-200 ${
                isValidDropTarget
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              }`}
            >
              {tasks.length}
            </div>

            {/* Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200"
              >
                <MoreVertical size={18} />
              </button>

              {showDropdown && (
                <div className="absolute z-20 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-48 animate-in fade-in-0 zoom-in-95">
                  {/* Sort Tasks Submenu */}
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      disabled={tasks.length === 0}
                    >
                      <ArrowUpDown size={16} />
                      Sort Tasks
                    </button>

                    {showSortMenu && (
                      <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-52 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95">
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleMenuAction("sort", option.id)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-sm"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleMenuAction("archive")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      disabled={tasks.length === 0}
                    >
                      <Archive size={16} />
                      Archive Tasks
                    </button>

                    <button
                      onClick={() => handleMenuAction("delete")}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 transition-colors"
                      disabled={tasks.length === 0}
                    >
                      <Trash2 size={16} />
                      Delete Tasks
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drop zone indicator */}
        {canAcceptDrop && (
          <div className="mt-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {isValidDropTarget ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Drop to move to {title}
                </span>
              ) : (
                <span>Drop task here to change status</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-y-auto p-3 space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">{emoji}</div>
            <p className="text-sm">
              {canAcceptDrop ? "Drop tasks here" : "No tasks yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
