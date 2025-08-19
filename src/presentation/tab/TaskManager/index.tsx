// src/presentation/tab/TaskManager/index.tsx - Fixed version with Google Tasks integration

import React from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "../../components/TaskManager/KanbanStyle/FolderCard";
import TaskGroupSidebar from "../../components/TaskManager/TaskGroupSidebar";
import TaskDialog from "../../components/TaskManager/TaskDialog";
import TaskHeader from "../../components/TaskManager/TasKHeader";
import ArchiveDrawer from "../../components/TaskManager/ArchiveDrawer";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import { Globe } from "lucide-react";
import { useTaskManager, folders } from "./useTaskManager";
import { createGoogleTask, deleteGoogleTask } from "../../../utils/GGTask";

const TaskManager: React.FC = () => {
  const {
    authState,
    groups,
    activeGroup,
    setActiveGroup,
    filteredLists,
    loading,
    error,
    setError,
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
    lists,
    setLists,
  } = useTaskManager();

  // Theme drawer state
  const [showThemeDrawer, setShowThemeDrawer] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);

  // Function to handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // Function to handle create new task - opens TaskDialog in create mode
  const handleCreateTask = () => {
    const newTask = {
      id: "",
      title: "",
      description: "",
      status: "todo" as const,
      priority: "medium" as const,
      startTime: null,
      dueTime: null,
      startDate: null,
      dueDate: null,
      completed: false,
      subtasks: [],
      attachments: [],
      tags: [],
      activityLog: [],
      createdAt: "",
      updatedAt: "",
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

  // Handle linked task click - opens linked task in dialog
  const handleLinkedTaskClick = (taskId: string) => {
    const allTasks = lists.flatMap((list) => list.tasks);
    const linkedTask = allTasks.find((task) => task.id === taskId);

    if (linkedTask) {
      setIsCreateMode(false);
      setSelectedTask(linkedTask);
      setIsDialogOpen(true);
    }
  };

  // Get all available tasks for linking
  const getAvailableTasks = () => {
    return lists
      .filter((list) => list.id !== "archive")
      .flatMap((list) => list.tasks)
      .filter((task) => task.id !== selectedTask?.id);
  };

  // Google Tasks integration functions with fallbacks
  const getFreshToken = async (): Promise<string> => {
    // First, try to use existing token from auth state
    if (authState.user?.accessToken) {
      console.log("Using existing token from auth state");
      return authState.user.accessToken;
    }

    // If no existing token, try Chrome identity API
    if (typeof chrome !== "undefined" && chrome.identity) {
      return new Promise((resolve, reject) => {
        console.log("Attempting to get fresh token via Chrome identity API...");

        // First try without interactive to see if we have cached token
        chrome.identity.getAuthToken(
          {
            interactive: false,
            scopes: [
              "openid",
              "email",
              "profile",
              "https://www.googleapis.com/auth/tasks",
              "https://www.googleapis.com/auth/tasks.readonly",
            ],
          },
          (result) => {
            if (result?.token) {
              console.log("Got cached token");
              resolve(result.token);
              return;
            }

            // If no cached token, try interactive
            console.log("No cached token, trying interactive auth...");
            chrome.identity.getAuthToken(
              {
                interactive: true,
                scopes: [
                  "openid",
                  "email",
                  "profile",
                  "https://www.googleapis.com/auth/tasks",
                  "https://www.googleapis.com/auth/tasks.readonly",
                ],
              },
              (interactiveResult) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Chrome identity error:",
                    chrome.runtime.lastError
                  );
                  reject(
                    new Error(
                      `Chrome identity error: ${chrome.runtime.lastError.message}`
                    )
                  );
                } else if (!interactiveResult?.token) {
                  console.error("No token received from Chrome identity API");
                  reject(
                    new Error(
                      "No token received from Chrome identity API. Please check extension permissions."
                    )
                  );
                } else {
                  console.log("Successfully got fresh token");
                  resolve(interactiveResult.token);
                }
              }
            );
          }
        );
      });
    }

    // If Chrome identity API is not available, throw descriptive error
    throw new Error(
      "Chrome identity API not available. This feature requires a Chrome extension context with proper OAuth2 configuration."
    );
  };

  const createGoogleTaskWrapper = async (
    token: string,
    taskData: any,
    activeGroup: string
  ) => {
    try {
      console.log("Creating Google task with token and data:", {
        hasToken: !!token,
        activeGroup,
        taskTitle: taskData?.title,
      });

      if (!token) {
        throw new Error("No authentication token provided");
      }

      if (!activeGroup) {
        throw new Error("No active task list selected");
      }

      const result = await createGoogleTask(token, taskData, activeGroup);
      console.log("Successfully created Google task:", result?.id);
      return result;
    } catch (error: any) {
      console.error("Error creating Google task:", error);

      // Re-throw with more context
      if (error.message?.includes("No token received")) {
        throw new Error(
          "Authentication failed while creating task. Please sign in again."
        );
      }

      throw error;
    }
  };

  const deleteGoogleTaskWrapper = async (
    token: string,
    taskId: string,
    activeGroup: string
  ) => {
    try {
      console.log("Deleting Google task:", {
        hasToken: !!token,
        taskId,
        activeGroup,
      });

      if (!token) {
        throw new Error("No authentication token provided");
      }

      if (!activeGroup) {
        throw new Error("No active task list selected");
      }

      await deleteGoogleTask(token, taskId, activeGroup);
      console.log("Successfully deleted Google task:", taskId);
    } catch (error: any) {
      console.error("Error deleting Google task:", error);

      // Re-throw with more context
      if (error.message?.includes("No token received")) {
        throw new Error(
          "Authentication failed while deleting task. Please sign in again."
        );
      }

      throw error;
    }
  };

  // Transition start function for React 18 concurrent features
  const startTransition = (callback: () => void) => {
    React.startTransition(callback);
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

      <ArchiveDrawer
        isOpen={showArchiveDrawer}
        onClose={() => setShowArchiveDrawer(false)}
        archivedTasks={archivedTasks}
        onRestoreTask={(taskId) => handleMoveTask(taskId, "todo")}
        onDeleteTask={handleDeleteTask}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ThemeDrawer
        isOpen={showThemeDrawer}
        onClose={() => setShowThemeDrawer(false)}
      />

      {/* Enhanced Task Dialog with Google Tasks integration props */}
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
        availableTasks={getAvailableTasks()}
        onTaskClick={handleLinkedTaskClick}
        // Google Tasks integration props
        getFreshToken={getFreshToken}
        createGoogleTask={createGoogleTaskWrapper}
        deleteGoogleTask={deleteGoogleTaskWrapper}
        activeGroup={activeGroup || ""}
        lists={lists}
        setLists={setLists}
        setError={setError}
        startTransition={startTransition}
        setSelectedTask={setSelectedTask}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};

export default TaskManager;
