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
  User,
  MoreVertical,
  Archive,
} from "lucide-react";

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
  setShowArchiveDrawer: (show: boolean) => void;
  onRefresh: () => void;
  onCreateTask: () => void;
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
  totalTasks,
  completedTasks,
  urgentTasks,
  overdueTasks,
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
  setShowArchiveDrawer,
  onRefresh,
  onCreateTask,
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

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 shadow-lg">
      <div className="p-">
        {/* Top Row - User Info & Main Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4 items-center mb-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all duration-200 font-medium ${
                showAdvancedFilters || hasActiveFilters
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showAdvancedFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium"
              >
                Clear All
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="group p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200"
              disabled={loading}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-all duration-200 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCreateTask}
              className="relative flex overflow-hidden px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText border-border-default  rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 group"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden w-44 animate-in fade-in-0 zoom-in-95">
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => {
                      setShowArchiveDrawer(true);
                      setShowMenu(false);
                    }}
                  >
                    <Archive className="w-4 h-4" />
                    Archive ({archivedTasks.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 text-red-700 dark:text-red-400 rounded-2xl shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="flex-1 font-medium">{error}</span>
              <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/50 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Flag className="w-4 h-4" />
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">🌱 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">⚡ High</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4" />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
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
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Filter by tags..."
                  value={filterTags}
                  onChange={(e) => setFilterTags(e.target.value)}
                  className="w-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
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
                    className={`p-2.5 rounded-xl border transition-all duration-200 ${
                      sortOrder === "desc"
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortOrder === "desc" ? "rotate-180" : ""
                      } transition-transform`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskHeader;
