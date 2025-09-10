import React, { useState, useRef, useEffect } from "react";
import TaskCard from "./TaskCard";
import type { Task } from "../../types/task";
import { MoreVertical, ArrowUpDown, Archive, Trash2 } from "lucide-react";

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
}) => {
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

  return (
    <div className="bg-card-background rounded-xl w-full max-h-full flex flex-col shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden">
      {/* Header - Fixed height */}
      <div className="p-4 border-b border-border-default flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            <span className="flex-1">{title}</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Task Count Badge */}
            <div className="text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm bg-gradient-to-r from-blue-500 to-indigo-500">
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
      </div>

      {/* Scrollable Content Area - Takes remaining height với strict overflow control */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
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
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
