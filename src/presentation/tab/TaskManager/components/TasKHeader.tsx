// src/presentation/components/TaskManager/TaskHeader.tsx
// Updated with date filter mode support

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  ChevronDown,
  X,
  MoreVertical,
  Archive,
  Palette,
  LayoutGrid,
  Table,
} from "lucide-react";
import FilterSection from "./FilterSection";

export type LayoutType = "kanban" | "list" | "table";

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
  filterPriority: string[];
  setFilterPriority: (priority: string[]) => void;
  filterTags: string[];
  setFilterTags: (tags: string[]) => void;
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
  setShowArchiveDrawer: (show: boolean) => void;
  onRefresh: () => void;
  onCreateTask: () => void;
  onOpenTheme: () => void;
  onClearFilters: () => void;
  // Enhanced filter props
  lists?: any[];
  filterCollection?: string[];
  setFilterCollection?: (collections: string[]) => void;
  filterLocation?: string;
  setFilterLocation?: (location: string) => void;
  filterStartTime?: Date | null;
  setFilterStartTime?: (time: Date | null) => void;
  filterEndTime?: Date | null;
  setFilterEndTime?: (time: Date | null) => void;
  dateFilterMode?: "any" | "start" | "due" | "actual" | "created";
  setDateFilterMode?: (
    mode: "any" | "start" | "due" | "actual" | "created"
  ) => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  authState,
  archivedTasks,
  loading,
  searchTerm,
  setSearchTerm,
  filterPriority,
  setFilterPriority,
  filterTags,
  setFilterTags,
  layoutType,
  setLayoutType,
  setShowArchiveDrawer,
  onRefresh,
  onCreateTask,
  onOpenTheme,
  onClearFilters,
  // Enhanced filter props
  lists = [],
  filterCollection = [],
  setFilterCollection,
  filterLocation = "",
  setFilterLocation,
  filterStartTime,
  setFilterStartTime,
  filterEndTime,
  setFilterEndTime,
  dateFilterMode = "any",
  setDateFilterMode,
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

  // Check if any advanced filters are active
  const hasActiveFilters =
    searchTerm !== "" ||
    (Array.isArray(filterPriority) && filterPriority.length > 0) ||
    (Array.isArray(filterTags) && filterTags.length > 0) ||
    (filterCollection &&
      Array.isArray(filterCollection) &&
      filterCollection.length > 0) ||
    filterLocation !== "" ||
    filterStartTime !== null ||
    filterEndTime !== null ||
    dateFilterMode !== "any";

  // Calculate header height to match sidebar header (72px)
  const baseHeaderHeight = "72px";

  if (!authState.isAuthenticated) {
    return null;
  }

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

      {/* Filter Section */}
      <FilterSection
        showAdvancedFilters={showAdvancedFilters}
        searchTerm={searchTerm}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterTags={filterTags}
        setFilterTags={setFilterTags}
        filterCollection={filterCollection}
        setFilterCollection={setFilterCollection}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        filterStartTime={filterStartTime}
        setFilterStartTime={setFilterStartTime}
        filterEndTime={filterEndTime}
        setFilterEndTime={setFilterEndTime}
        dateFilterMode={dateFilterMode}
        setDateFilterMode={setDateFilterMode}
        lists={lists}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    </div>
  );
};

export default TaskHeader;
