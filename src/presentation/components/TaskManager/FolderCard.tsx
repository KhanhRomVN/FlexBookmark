import React, { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import type { Task } from "../../types/task";
import {
  MoreVertical,
  Plus,
  Copy,
  Move,
  ArrowUpDown,
  Archive,
  Trash2,
} from "lucide-react";

interface FolderCardProps {
  id: string;
  title: string;
  emoji?: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isAdding?: boolean;
  newTaskTitle?: string;
  setNewTaskTitle?: (title: string) => void;
  onAddTask: () => void;
  onCancelAdd?: () => void;
  onSubmitAdd?: () => void;
  onCopyTasks?: (folderId: string) => void;
  onMoveTasks?: (folderId: string, targetFolderId: string) => void;
  onArchiveTasks?: (folderId: string) => void;
  onDeleteTasks?: (folderId: string) => void;
  onSortTasks?: (folderId: string, sortType: string) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  id,
  title,
  emoji,
  tasks,
  onTaskClick,
  isAdding = false,
  newTaskTitle = "",
  setNewTaskTitle,
  onAddTask,
  onCancelAdd,
  onSubmitAdd,
  onCopyTasks,
  onMoveTasks,
  onArchiveTasks,
  onDeleteTasks,
  onSortTasks,
}) => {
  const { setNodeRef } = useDroppable({ id });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Available folders for moving tasks
  const availableFolders = [
    { id: "backlog", title: "Backlog", emoji: "📥" },
    { id: "todo", title: "To Do", emoji: "📋" },
    { id: "in-progress", title: "In Progress", emoji: "🚧" },
    { id: "overdue", title: "Overdue", emoji: "⏰" },
    { id: "done", title: "Done", emoji: "✅" },
  ].filter((folder) => folder.id !== id);

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
      if (
        moveMenuRef.current &&
        !moveMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoveMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = (action: string, value?: string) => {
    switch (action) {
      case "add":
        onAddTask();
        break;
      case "copy":
        onCopyTasks?.(id);
        break;
      case "move":
        if (value) onMoveTasks?.(id, value);
        break;
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
    setShowMoveMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      className="bg-card-background rounded-xl w-full flex flex-col min-h-[600px] shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            <span className="flex-1">{title}</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Task Count Badge */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
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
                  <button
                    onClick={() => handleMenuAction("add")}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>

                  <button
                    onClick={() => handleMenuAction("copy")}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    disabled={tasks.length === 0}
                  >
                    <Copy size={16} />
                    Copy Tasks
                  </button>

                  {/* Move Tasks Submenu */}
                  <div className="relative" ref={moveMenuRef}>
                    <button
                      onClick={() => setShowMoveMenu(!showMoveMenu)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      disabled={tasks.length === 0}
                    >
                      <Move size={16} />
                      Move Tasks
                    </button>

                    {showMoveMenu && (
                      <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-44 animate-in fade-in-0 zoom-in-95">
                        {availableFolders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleMenuAction("move", folder.id)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <span>{folder.emoji}</span>
                            {folder.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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
      </div>

      <div className="overflow-y-auto p-3 space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}

        {isAdding ? (
          <div className="w-full flex gap-2">
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmitAdd?.();
                }
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
              autoFocus
            />
            <button
              onClick={onSubmitAdd}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancelAdd}
              className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onAddTask}
            className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add task
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
