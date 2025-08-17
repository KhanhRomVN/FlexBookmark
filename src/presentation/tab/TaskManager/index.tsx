import React from "react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "../../components/TaskManager/FolderCard";
import TaskGroupSidebar from "../../components/TaskManager/TaskGroupSidebar";
import TaskDialog from "../../components/TaskManager/TaskDialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import {
  Search,
  Filter,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Globe,
} from "lucide-react";
import { useTaskManager, folders } from "./useTaskManager";

const TaskManager: React.FC = () => {
  const {
    authState,
    groups,
    activeGroup,
    setActiveGroup,
    lists,
    filteredLists,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    quickAddStatus,
    setQuickAddStatus,
    quickAddTitle,
    setQuickAddTitle,
    selectedTask,
    isDialogOpen,
    setIsDialogOpen,
    setSelectedTask,
    handleDragEnd,
    handleQuickAddTask,
    handleTaskClick,
    handleCreateGroup,
    handleDeleteTask,
    handleDuplicateTask,
    handleMove,
    handleSaveTaskDetail,
    totalTasks,
    completedTasks,
    urgentTasks,
  } = useTaskManager();

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md transform hover:scale-105 transition-all duration-300">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl shadow-blue-500/25">
              <Globe
                className="w-12 h-12 text-white animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            Welcome to TaskFlow
          </h3>
          <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            Connect with Google to sync and manage your tasks across all devices
          </p>
          <button
            onClick={() => authState.user && void 0}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          >
            <span className="flex items-center gap-3">
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              Connect with Google
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-background">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={setActiveGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 w-full min-h-screen overflow-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b border-border-default shadow-sm">
          <div className="p-6">
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
                <span className="text-gray-600 dark:text-gray-400">
                  completed
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg">
                  <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {urgentTasks}
                </span>
                <span className="text-gray-600 dark:text-gray-400">urgent</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => void handleDragEnd as any}
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

            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 text-red-700 dark:text-red-400 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-sm">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">🌱 Low</SelectItem>
                    <SelectItem value="medium">📋 Medium</SelectItem>
                    <SelectItem value="high">⚡ High</SelectItem>
                    <SelectItem value="urgent">🔥 Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-sm">
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.emoji} {f.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <DndContext
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd as unknown as any}
          >
            <div className="flex gap-6 flex-1 min-h-0 w-full items-start">
              {filteredLists.map((list) => (
                <SortableContext
                  key={list.id}
                  items={list.tasks.map((t) => t.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <FolderCard
                    id={list.id}
                    title={list.title}
                    emoji={list.emoji}
                    tasks={list.tasks}
                    onTaskClick={handleTaskClick}
                    isAdding={quickAddStatus === list.id}
                    newTaskTitle={
                      quickAddStatus === list.id ? quickAddTitle : ""
                    }
                    setNewTaskTitle={setQuickAddTitle}
                    onAddTask={() => {
                      setQuickAddStatus(list.id as any);
                      setQuickAddTitle("");
                    }}
                    onCancelAdd={() => setQuickAddStatus(null)}
                    onSubmitAdd={() => handleQuickAddTask(list.id as any)}
                  />
                </SortableContext>
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        folders={folders}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        onMove={handleMove}
      />
    </div>
  );
};

export default TaskManager;
