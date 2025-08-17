import React from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Globe,
  Clock,
  Archive,
  Plus,
  Settings,
  Download,
  Upload,
  BarChart3,
  Calendar,
  User,
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
  setShowArchiveDrawer: (show: boolean) => void;
  onRefresh: () => void;
  onCreateTask: () => void;
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
  setShowArchiveDrawer,
  onRefresh,
  onCreateTask,
}) => {
  if (!authState.isAuthenticated) {
    return null;
  }

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border-default shadow-sm">
      <div className="p-6">
        {/* Top Row - User Info & Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  TaskFlow Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {authState.user?.name || "User"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreateTask}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalTasks}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              total tasks
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {completedTasks}
            </span>
            <span className="text-gray-600 dark:text-gray-400">completed</span>
            <div className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
              {completionRate}%
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg">
              <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {overdueTasks}
            </span>
            <span className="text-gray-600 dark:text-gray-400">overdue</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
              <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {urgentTasks}
            </span>
            <span className="text-gray-600 dark:text-gray-400">urgent</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowArchiveDrawer(true)}
              className="group flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                Archive ({archivedTasks.length})
              </span>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

            <button
              onClick={onRefresh}
              className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 text-red-700 dark:text-red-400 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => {
                  /* Handle error dismiss */
                }}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters Row */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200"
            >
              <option value="all">All Priorities</option>
              <option value="low">🌱 Low</option>
              <option value="medium">📋 Medium</option>
              <option value="high">⚡ High</option>
              <option value="urgent">🔥 Urgent</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200"
            >
              <option value="all">All Statuses</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
