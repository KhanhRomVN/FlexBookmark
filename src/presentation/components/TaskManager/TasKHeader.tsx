// src/presentation/components/TaskManager/TaskHeader.tsx
// Updated with 1/4 height reduction

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  ChevronDown,
  X,
  Flag,
  Tag,
  CheckCircle,
  ArrowUpDown,
  MoreVertical,
  Archive,
  Palette,
  LayoutGrid,
  Workflow,
  Table,
} from "lucide-react";

export type LayoutType = "kanban" | "list" | "flowchart" | "table";

interface TaskHeaderProps {
  authState: {
    isAuthenticated: boolean;
    user: any;
  };
  totalTasks: number;
  completedTasks: number;
  urgentTasks: number;
  overdueTasks: number;
  archivedTasks: any[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterTags: string;
  setFilterTags: (tags: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
  setShowArchiveDrawer: (show: boolean) => void;
  onRefresh: () => void;
  onCreateTask: () => void;
  onOpenTheme: () => void;
  onClearFilters: () => void;
}

const folders = [
  { id: "backlog", title: "Backlog", emoji: "📥" },
  { id: "todo", title: "To Do", emoji: "📋" },
  { id: "in-progress", title: "In Progress", emoji: "🚧" },
  { id: "overdue", title: "Overdue", emoji: "⏰" },
  { id: "done", title: "Done", emoji: "✅" },
];

const TaskHeader: React.FC<TaskHeaderProps> = ({
  authState,
  archivedTasks,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  filterTags,
  setFilterTags,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  layoutType,
  setLayoutType,
  setShowArchiveDrawer,
  onRefresh,
  onCreateTask,
  onOpenTheme,
  onClearFilters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!authState.isAuthenticated) {
    return null;
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    filterPriority !== "all" ||
    filterStatus !== "all" ||
    filterTags !== "" ||
    sortBy !== "created-desc";

  // Calculate header height to match sidebar header (reduced from 96px to 72px = 1/4 reduction)
  const baseHeaderHeight = "72px";

  return (
    <div
      className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm"
      style={{
        minHeight: showAdvancedFilters ? "auto" : baseHeaderHeight,
      }}
    >
      {/* Main Header Content */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: baseHeaderHeight }}
      >
        {/* Left Section - Search and Controls */}
        <div className="flex items-center gap-3 flex-1 max-w-4xl">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-gray-50/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-0.5">
            <button
              onClick={() => setLayoutType("kanban")}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                layoutType === "kanban"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setLayoutType("flowchart")}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                layoutType === "flowchart"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Workflow className="w-3 h-3" />
              <span className="hidden sm:inline">Flow</span>
            </button>
            <button
              onClick={() => setLayoutType("table")}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                layoutType === "table"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Table className="w-3 h-3" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
              showAdvancedFilters || hasActiveFilters
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                : "bg-gray-50/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            )}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-2.5 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-all duration-200 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* New Task Button */}
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* More Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden w-36 animate-in fade-in-0 zoom-in-95">
                <button
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-300 transition-colors text-sm"
                  onClick={() => {
                    onOpenTheme();
                    setShowMenu(false);
                  }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Theme
                </button>

                <button
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-300 transition-colors text-sm"
                  onClick={() => {
                    setShowArchiveDrawer(true);
                    setShowMenu(false);
                  }}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-2 flex-1">
                    <span>Archive</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
                      {archivedTasks.length}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-3 p-2.5 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 text-red-700 dark:text-red-400 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <span className="flex-1 font-medium text-sm">{error}</span>
            <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/50 dark:to-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/60 dark:border-gray-700/60 shadow-sm animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Priority Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Flag className="w-3 h-3" />
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">🌱 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">⚡ High</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-3 h-3" />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="all">All Statuses</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.emoji} {f.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Tag className="w-3 h-3" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Filter by tags..."
                  value={filterTags}
                  onChange={(e) => setFilterTags(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Sort Options */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort By
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                  >
                    <option value="created-desc">Created (Newest)</option>
                    <option value="created-asc">Created (Oldest)</option>
                    <option value="priority-high">Priority (High-Low)</option>
                    <option value="priority-low">Priority (Low-High)</option>
                    <option value="due-date-asc">Due Date (Nearest)</option>
                    <option value="due-date-desc">Due Date (Farthest)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                    <option value="completion">Completion</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className={`p-1.5 rounded-md border transition-all duration-200 ${
                      sortOrder === "desc"
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <ArrowUpDown
                      className={`w-3.5 h-3.5 ${
                        sortOrder === "desc" ? "rotate-180" : ""
                      } transition-transform`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHeader;
