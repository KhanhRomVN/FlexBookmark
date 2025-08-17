import React from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "../../components/TaskManager/FolderCard";
import TaskGroupSidebar from "../../components/TaskManager/TaskGroupSidebar";
import TaskDialog from "../../components/TaskManager/TaskDialog";
import TaskHeader from "../../components/TaskManager/TasKHeader";
import { Globe, Archive, X } from "lucide-react";
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
    overdueTasks,
    handleCopyTasks,
    handleMoveTasks,
    handleArchiveTasks,
    handleDeleteTasks,
    handleSortTasks,
    handleEditTask,
    handleMoveTask,
    handleCopyTask,
    handleArchiveTask,
    showArchiveDrawer,
    setShowArchiveDrawer,
    archivedTasks,
  } = useTaskManager();

  // Function to handle refresh
  const handleRefresh = () => {
    // Add your refresh logic here
    window.location.reload();
  };

  // Function to handle create new task
  const handleCreateTask = () => {
    setQuickAddStatus("todo"); // Default to todo list
    setQuickAddTitle("");
  };

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

  // Filter lists to exclude archive for main board
  const mainBoardLists = filteredLists.filter((list) => list.id !== "archive");

  return (
    <div className="flex w-full min-h-screen bg-background">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={setActiveGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 w-full min-h-screen overflow-auto flex flex-col">
        {/* Use TaskHeader component instead of inline header */}
        <TaskHeader
          authState={authState}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          urgentTasks={urgentTasks}
          overdueTasks={overdueTasks}
          archivedTasks={archivedTasks}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          setShowArchiveDrawer={setShowArchiveDrawer}
          onRefresh={handleRefresh}
          onCreateTask={handleCreateTask}
        />

        <div className="flex-1 p-6">
          <DndContext
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd as unknown as any}
          >
            <div className="flex gap-6 flex-1 min-h-0 w-full items-start">
              {mainBoardLists.map((list) => (
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
                    onCopyTasks={handleCopyTasks}
                    onMoveTasks={handleMoveTasks}
                    onArchiveTasks={handleArchiveTasks}
                    onDeleteTasks={handleDeleteTasks}
                    onSortTasks={handleSortTasks}
                  />
                </SortableContext>
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* Archive Drawer */}
      {showArchiveDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowArchiveDrawer(false)}
          />

          {/* Drawer */}
          <div className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Archived Tasks
                  </h2>
                </div>
                <button
                  onClick={() => setShowArchiveDrawer(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {archivedTasks.length} archived tasks
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Archived •{" "}
                    {new Date(
                      task.updatedAt || task.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </p>
                </div>
              ))}

              {archivedTasks.length === 0 && (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No archived tasks yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        folders={folders.filter((f) => f.id !== "archive")}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        onMove={handleMove}
      />
    </div>
  );
};

export default TaskManager;
