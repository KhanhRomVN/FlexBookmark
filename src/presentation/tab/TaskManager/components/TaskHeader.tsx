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
  // Group selector props
  groups?: any[];
  activeGroup?: string;
  onSelectGroup?: (groupId: string) => void;
  onCreateGroup?: (name: string) => void;
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
      className="sticky top-0 z-10 backdrop-blur-md border-b shadow-sm"
      style={{
        minHeight: showAdvancedFilters ? "auto" : baseHeaderHeight,
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-text-primary placeholder-text-secondary text-sm"
              style={{
                backgroundColor: "var(--input-background)",
                borderColor: "var(--border)",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-text-secondary" />
              </button>
            )}
          </div>

          {/* Layout Toggle */}
          <div
            className="flex items-center rounded-lg border p-0.5"
            style={{
              backgroundColor: "var(--input-background)",
              borderColor: "var(--border)",
            }}
          >
            <button
              onClick={() => setLayoutType("kanban")}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                layoutType === "kanban"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setLayoutType("table")}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                layoutType === "table"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
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
                ? "bg-primary/10 border-primary/50 text-primary"
                : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            style={{
              backgroundColor:
                showAdvancedFilters || hasActiveFilters
                  ? "var(--primary)" + "1a"
                  : "var(--input-background)",
              borderColor:
                showAdvancedFilters || hasActiveFilters
                  ? "var(--primary)" + "80"
                  : "var(--border)",
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <div className="w-1 h-1 bg-primary rounded-full"></div>
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
              className="px-2.5 py-2 text-text-secondary hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium text-sm"
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
              className={`w-4 h-4 text-text-secondary group-hover:text-text-primary transition-all duration-200 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* New Task Button */}
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-lg font-medium shadow-md shadow-primary/25 hover:shadow-primary/40 transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm"
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
              <MoreVertical className="w-4 h-4 text-text-secondary group-hover:text-text-primary" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 border rounded-lg shadow-xl overflow-hidden w-36 animate-in fade-in-0 zoom-in-95"
                style={{
                  backgroundColor: "var(--dropdown-background)",
                  borderColor: "var(--border)",
                }}
              >
                <button
                  className="w-full text-left px-3 py-2.5 hover:bg-dropdown-item-hover flex items-center gap-2.5 text-text-primary transition-colors text-sm"
                  onClick={() => {
                    onOpenTheme();
                    setShowMenu(false);
                  }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Theme
                </button>

                <button
                  className="w-full text-left px-3 py-2.5 hover:bg-dropdown-item-hover flex items-center gap-2.5 text-text-primary transition-colors text-sm"
                  onClick={() => {
                    setShowArchiveDrawer(true);
                    setShowMenu(false);
                  }}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-2 flex-1">
                    <span>Archive</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: "var(--input-background)",
                      }}
                    >
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
