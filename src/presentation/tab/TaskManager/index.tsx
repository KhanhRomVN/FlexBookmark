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
import ArchiveDrawer from "../../components/TaskManager/ArchiveDrawer";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import { Globe } from "lucide-react";
import { useTaskManager, folders } from "./useTaskManager";

const TaskManager: React.FC = () => {
  const {
    authState,
    groups,
    activeGroup,
    setActiveGroup,
    filteredLists,
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
    handleArchiveTasks,
    handleDeleteTasks,
    handleSortTasks,
    handleMoveTask,
    showArchiveDrawer,
    setShowArchiveDrawer,
    archivedTasks,
    handleClearFilters,
  } = useTaskManager();

  // Theme drawer state
  const [showThemeDrawer, setShowThemeDrawer] = React.useState(false);

  const [isCreateMode, setIsCreateMode] = React.useState(false);

  // Function to handle refresh
  const handleRefresh = () => {
    // Add your refresh logic here
    window.location.reload();
  };

  // Function to handle create new task - opens TaskDialog in create mode
  const handleCreateTask = () => {
    // Create a new empty task for create mode with proper types
    const newTask = {
      id: "",
      title: "",
      description: "",
      status: "todo" as const,
      priority: "medium" as const, // Fix: Use valid Priority type instead of empty string
      startTime: null,
      endTime: null,
      startDate: null,
      endDate: null,
      completed: false,
      subtasks: [],
      attachments: [],
      tags: [],
      activityLog: [],
      prevTaskId: null,
      nextTaskId: null,
      createdAt: "", // Fix: Add missing required property
      updatedAt: "", // Fix: Add missing required property
    };

    setSelectedTask(newTask);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
    setIsCreateMode(false);
  };

  // Handle task click - opens TaskDialog in edit mode
  const handleTaskClickWrapper = (task: any) => {
    setIsCreateMode(false);
    handleTaskClick(task);
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
        {/* Enhanced TaskHeader component */}
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
          filterTags={filterTags}
          setFilterTags={setFilterTags}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          setShowArchiveDrawer={setShowArchiveDrawer}
          onOpenTheme={() => setShowThemeDrawer(true)}
          onRefresh={handleRefresh}
          onCreateTask={handleCreateTask}
          onClearFilters={handleClearFilters}
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
                    onTaskClick={handleTaskClickWrapper}
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

      {/* Enhanced Archive Drawer */}
      <ArchiveDrawer
        isOpen={showArchiveDrawer}
        onClose={() => setShowArchiveDrawer(false)}
        archivedTasks={archivedTasks}
        onRestoreTask={(taskId) => handleMoveTask(taskId, "todo")}
        onDeleteTask={handleDeleteTask}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {/* Theme Drawer */}
      <ThemeDrawer
        isOpen={showThemeDrawer}
        onClose={() => setShowThemeDrawer(false)}
      />

      {/* Enhanced Task Dialog with Create/Edit modes */}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        task={selectedTask}
        folders={folders.filter((f) => f.id !== "archive")}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        onMove={handleMove}
        isCreateMode={isCreateMode}
      />
    </div>
  );
};

export default TaskManager;
