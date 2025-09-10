// src/presentation/tab/TaskManager/index.tsx
// Updated with enhanced filter support and proper group management

import React from "react";
import TaskGroupSidebar from "../../components/TaskManager/TaskGroupSidebar";
import TaskDialog from "./components/TaskDialog";
import TaskHeader, {
  LayoutType,
} from "../../components/TaskManager/TasKHeader";
import ArchiveDrawer from "../../components/TaskManager/ArchiveDrawer";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import KanbanLayout from "./layout/KanbanLayout";
import TableLayout from "./layout/TableLayout";
import GanttChartLayout from "./layout/GanttChartLayout";
import FlowchartLayout from "./layout/FlowchartLayout";
import { Globe } from "lucide-react";
import { useTaskManager, folders } from "./useTaskManager";
import {
  createGoogleTask,
  deleteGoogleTask,
  fetchGoogleTasks,
  updateGoogleTaskList,
  deleteGoogleTaskList,
} from "../../../utils/GGTask";
import { createGoogleTaskList } from "../../../utils/GGTask";
import { Status, Task } from "@/presentation/types/task";

// Import dialog components for status transitions
import TransitionConfirmationDialog from "./components/TaskDialog/components/TransitionConfirmationDialog";
import DateTimeStatusDialog from "./components/TaskDialog/components/DateTimeStatusDialog";

// Import transition utilities
import {
  getTransitionScenarios,
  executeStatusTransition,
} from "./components/TaskDialog/utils/taskTransitions";

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
    loadTasks,
    // Add enhanced filter states
    filterCollection,
    setFilterCollection,
    filterLocation,
    setFilterLocation,
    filterTimeRange,
    setFilterTimeRange,
  } = useTaskManager();

  // Layout state
  const [layoutType, setLayoutType] = React.useState<LayoutType>("kanban");

  // Theme drawer state
  const [showThemeDrawer, setShowThemeDrawer] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);

  // Status transition dialog states for drag-and-drop
  const [dragTransitionDialog, setDragTransitionDialog] = React.useState<{
    isOpen: boolean;
    task: Task | null;
    fromStatus: Status | null;
    toStatus: Status | null;
  }>({
    isOpen: false,
    task: null,
    fromStatus: null,
    toStatus: null,
  });

  const [dragDateTimeDialog, setDragDateTimeDialog] = React.useState<{
    isOpen: boolean;
    task: Task | null;
    targetStatus: Status | null;
  }>({
    isOpen: false,
    task: null,
    targetStatus: null,
  });

  // Function to handle refresh
  const handleRefresh = () => {
    if (activeGroup) {
      loadTasks();
    } else {
      window.location.reload();
    }
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

  // Handle toggle complete for list view
  const handleToggleComplete = (taskId: string) => {
    const allTasks = lists.flatMap((list) => list.tasks);
    const task = allTasks.find((t) => t.id === taskId);

    if (task) {
      const updatedTask = { ...task, completed: !task.completed };
      handleSaveTaskDetail(updatedTask);
    }
  };

  // Enhanced status transition handler that shows confirmation dialogs
  const handleStatusTransition = (
    taskId: string,
    fromStatus: Status,
    toStatus: Status
  ) => {
    const allTasks = lists.flatMap((list) => list.tasks);
    const task = allTasks.find((t) => t.id === taskId);

    if (!task) {
      console.error("Task not found for transition:", taskId);
      return;
    }

    // If same status, no transition needed
    if (fromStatus === toStatus) {
      return;
    }

    // Check if this transition needs confirmation dialog
    const transitionScenarios = getTransitionScenarios(
      fromStatus,
      toStatus,
      task
    );

    if (
      transitionScenarios.length > 0 &&
      transitionScenarios[0].options[0].value !== "confirm"
    ) {
      // Show confirmation dialog for drag-and-drop transition
      setDragTransitionDialog({
        isOpen: true,
        task,
        fromStatus,
        toStatus,
      });
      return;
    }

    // Check if transition requires date/time input (for in-progress transitions)
    if (toStatus === "in-progress" && (!task.startDate || !task.startTime)) {
      setDragDateTimeDialog({
        isOpen: true,
        task,
        targetStatus: toStatus,
      });
      return;
    }

    // Direct transition without confirmation
    executeDirectStatusTransition(task, fromStatus, toStatus, {});
  };

  // Execute status transition directly (after confirmation or for simple transitions)
  const executeDirectStatusTransition = (
    task: Task,
    fromStatus: Status,
    toStatus: Status,
    selectedOptions: Record<string, string>
  ) => {
    const transitionResult = executeStatusTransition(
      task,
      fromStatus,
      toStatus,
      selectedOptions,
      false // not create mode
    );

    if ("error" in transitionResult) {
      setError(transitionResult.error);
      return;
    }

    // Save the updated task
    handleSaveTaskDetail(transitionResult);
  };

  // Handle drag transition confirmation
  const handleDragTransitionConfirm = (
    selectedOptions: Record<string, string>
  ) => {
    if (
      !dragTransitionDialog.task ||
      !dragTransitionDialog.fromStatus ||
      !dragTransitionDialog.toStatus
    ) {
      return;
    }

    // Check for cancel option
    if (Object.values(selectedOptions).includes("cancel")) {
      setDragTransitionDialog({
        isOpen: false,
        task: null,
        fromStatus: null,
        toStatus: null,
      });
      return;
    }

    // Check for invalid option
    if (Object.values(selectedOptions).includes("invalid")) {
      setError("Cannot perform this transition with current task data");
      setDragTransitionDialog({
        isOpen: false,
        task: null,
        fromStatus: null,
        toStatus: null,
      });
      return;
    }

    // Check for date/time adjustment options
    const needsDateTimeDialog = Object.values(selectedOptions).some(
      (value) =>
        value === "adjust_time" ||
        value === "set_start" ||
        value === "update_start"
    );

    if (needsDateTimeDialog) {
      setDragDateTimeDialog({
        isOpen: true,
        task: dragTransitionDialog.task,
        targetStatus: dragTransitionDialog.toStatus,
      });
      setDragTransitionDialog({
        isOpen: false,
        task: null,
        fromStatus: null,
        toStatus: null,
      });
      return;
    }

    executeDirectStatusTransition(
      dragTransitionDialog.task,
      dragTransitionDialog.fromStatus,
      dragTransitionDialog.toStatus,
      selectedOptions
    );

    setDragTransitionDialog({
      isOpen: false,
      task: null,
      fromStatus: null,
      toStatus: null,
    });
  };

  // Handle drag transition cancel
  const handleDragTransitionCancel = () => {
    setDragTransitionDialog({
      isOpen: false,
      task: null,
      fromStatus: null,
      toStatus: null,
    });
  };

  // Handle date/time dialog confirm for drag transitions
  const handleDragDateTimeConfirm = (
    startDate: Date | null,
    dueDate: Date | null,
    finalStatus: Status
  ) => {
    if (!dragDateTimeDialog.task) return;

    const updatedTask = {
      ...dragDateTimeDialog.task,
      startDate,
      dueDate,
      status: finalStatus,
      startTime: startDate,
      dueTime: dueDate,
    };

    handleSaveTaskDetail(updatedTask);
    setDragDateTimeDialog({ isOpen: false, task: null, targetStatus: null });
  };

  // Handle date/time dialog cancel for drag transitions
  const handleDragDateTimeCancel = () => {
    setDragDateTimeDialog({ isOpen: false, task: null, targetStatus: null });
  };

  // Google Tasks integration functions with fallbacks
  const getFreshToken = async (): Promise<string> => {
    if (authState.user?.accessToken) {
      return authState.user.accessToken;
    }

    if (typeof chrome !== "undefined" && chrome.identity) {
      return new Promise((resolve, reject) => {
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
              resolve(result.token);
              return;
            }
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
                  reject(
                    new Error(
                      `Chrome identity error: ${chrome.runtime.lastError.message}`
                    )
                  );
                } else if (!interactiveResult?.token) {
                  reject(
                    new Error(
                      "No token received from Chrome identity API. Please check extension permissions."
                    )
                  );
                } else {
                  resolve(interactiveResult.token);
                }
              }
            );
          }
        );
      });
    }

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
      if (!token) throw new Error("No authentication token provided");
      if (!activeGroup) throw new Error("No active task list selected");

      const result = await createGoogleTask(token, taskData, activeGroup);
      return result;
    } catch (error: any) {
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
      if (!token) throw new Error("No authentication token provided");
      if (!activeGroup) throw new Error("No active task list selected");

      await deleteGoogleTask(token, taskId, activeGroup);
    } catch (error: any) {
      if (error.message?.includes("No token received")) {
        throw new Error(
          "Authentication failed while deleting task. Please sign in again."
        );
      }
      throw error;
    }
  };

  // Enhanced group creation with Google Tasks API integration
  const handleCreateGroupWrapper = async (name: string) => {
    try {
      if (!authState.user?.accessToken) {
        throw new Error("Authentication required to create task groups");
      }

      const token = await getFreshToken();
      const newGroup = await createGoogleTaskList(token, name);

      // Trigger group reload in useTaskManager
      await handleCreateGroup(name);

      // Set the new group as active and load its tasks
      setActiveGroup(newGroup.id);

      return newGroup;
    } catch (error: any) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create task group");
      throw error;
    }
  };

  // Enhanced group rename handler
  const handleRenameGroupWrapper = async (id: string, newName: string) => {
    try {
      if (!authState.user?.accessToken) {
        throw new Error("Authentication required to rename task groups");
      }

      const token = await getFreshToken();
      await updateGoogleTaskList(token, id, newName);

      // Reload groups to reflect the change
      // This would typically trigger a refresh in useTaskGroups
      // For now, we'll just reload the page or implement a group refresh
      window.location.reload();
    } catch (error: any) {
      console.error("Error renaming group:", error);
      setError(error.message || "Failed to rename task group");
      throw error;
    }
  };

  // Enhanced group delete handler
  const handleDeleteGroupWrapper = async (id: string) => {
    try {
      if (!authState.user?.accessToken) {
        throw new Error("Authentication required to delete task groups");
      }

      const token = await getFreshToken();
      await deleteGoogleTaskList(token, id);

      // If we're deleting the active group, switch to the first available group
      if (activeGroup === id && groups.length > 1) {
        const remainingGroups = groups.filter((g) => g.id !== id);
        if (remainingGroups.length > 0) {
          setActiveGroup(remainingGroups[0].id);
        }
      }

      // Reload groups to reflect the change
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting group:", error);
      setError(error.message || "Failed to delete task group");
      throw error;
    }
  };

  // Enhanced group selection handler that properly loads tasks for the selected group
  const handleGroupSelection = async (groupId: string) => {
    try {
      // Set the active group immediately for UI feedback
      setActiveGroup(groupId);

      // Clear current lists to show loading state
      setLists([]);

      // Load tasks for the selected group
      if (authState.user?.accessToken) {
        const token = await getFreshToken();
        const tasks = await fetchGoogleTasks(token, groupId);

        // Organize tasks into folders/lists
        const organizedLists = folders.map((folder) => ({
          id: folder.id,
          title: folder.title,
          emoji: folder.emoji,
          tasks: tasks.filter((task: Task) => task.status === folder.id),
        }));

        setLists(organizedLists);
      }
    } catch (error: any) {
      console.error("Error switching groups:", error);
      setError(error.message || "Failed to load tasks for selected group");
    }
  };

  // Transition start function for React 18 concurrent features
  const startTransition = (callback: () => void) => {
    React.startTransition(callback);
  };

  // Enhanced clear filters to include new filter types
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
    if (setFilterCollection) setFilterCollection([]);
    if (setFilterLocation) setFilterLocation("");
    if (setFilterTimeRange) setFilterTimeRange({});
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

  // Get all tasks for list view
  const allTasks = mainBoardLists.flatMap((list) => list.tasks);

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={handleGroupSelection}
        onCreateGroup={handleCreateGroupWrapper}
        onRenameGroup={handleRenameGroupWrapper}
        onDeleteGroup={handleDeleteGroupWrapper}
        getFreshToken={getFreshToken}
        createGoogleTaskList={createGoogleTaskList}
      />

      <div className="flex-1 h-full overflow-hidden flex flex-col">
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
          layoutType={layoutType}
          setLayoutType={setLayoutType}
          setShowArchiveDrawer={setShowArchiveDrawer}
          onOpenTheme={() => setShowThemeDrawer(true)}
          onRefresh={handleRefresh}
          onCreateTask={handleCreateTask}
          onClearFilters={handleClearFiltersWrapper}
          // Enhanced filter props
          lists={lists}
          filterCollection={filterCollection}
          setFilterCollection={setFilterCollection}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterTimeRange={filterTimeRange}
          setFilterTimeRange={setFilterTimeRange}
        />

        <div className="flex-1 min-h-0 overflow-hidden">
          {layoutType === "table" ? (
            <TableLayout
              tasks={allTasks}
              onTaskClick={handleTaskClickWrapper}
              onEditTask={handleTaskClickWrapper}
              onArchiveTask={(taskId) => handleMoveTask(taskId, "archive")}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          ) : layoutType === "kanban" ? (
            <KanbanLayout
              filteredLists={mainBoardLists}
              onTaskClick={handleTaskClickWrapper}
              onDragEnd={handleDragEnd}
              quickAddStatus={quickAddStatus}
              setQuickAddStatus={(status) =>
                setQuickAddStatus(status as Status | null)
              }
              quickAddTitle={quickAddTitle}
              setQuickAddTitle={setQuickAddTitle}
              handleQuickAddTask={async (status) => {
                await handleQuickAddTask(status as Status);
              }}
              onArchiveTasks={handleArchiveTasks}
              onDeleteTasks={handleDeleteTasks}
              onSortTasks={handleSortTasks}
              onStatusTransition={handleStatusTransition}
            />
          ) : layoutType === "gantt" ? (
            <GanttChartLayout
              filteredLists={mainBoardLists}
              onTaskClick={handleTaskClickWrapper}
              onDragEnd={handleDragEnd}
              quickAddStatus={quickAddStatus}
              setQuickAddStatus={(status) =>
                setQuickAddStatus(status as Status | null)
              }
              quickAddTitle={quickAddTitle}
              setQuickAddTitle={setQuickAddTitle}
              handleQuickAddTask={async (status) => {
                await handleQuickAddTask(status as Status);
              }}
              onArchiveTasks={handleArchiveTasks}
              onDeleteTasks={handleDeleteTasks}
              onSortTasks={handleSortTasks}
              onStatusTransition={handleStatusTransition}
            />
          ) : (
            <FlowchartLayout
              filteredLists={mainBoardLists}
              onTaskClick={handleTaskClickWrapper}
              onDragEnd={handleDragEnd}
              quickAddStatus={quickAddStatus}
              setQuickAddStatus={(status) =>
                setQuickAddStatus(status as Status | null)
              }
              quickAddTitle={quickAddTitle}
              setQuickAddTitle={setQuickAddTitle}
              handleQuickAddTask={async (status) => {
                await handleQuickAddTask(status as Status);
              }}
              onArchiveTasks={handleArchiveTasks}
              onDeleteTasks={handleDeleteTasks}
              onSortTasks={handleSortTasks}
              onStatusTransition={handleStatusTransition}
            />
          )}
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

      {/* Drag-and-Drop Transition Confirmation Dialog */}
      <TransitionConfirmationDialog
        isOpen={dragTransitionDialog.isOpen}
        transition={
          dragTransitionDialog.task &&
          dragTransitionDialog.fromStatus &&
          dragTransitionDialog.toStatus
            ? {
                from: dragTransitionDialog.fromStatus,
                to: dragTransitionDialog.toStatus,
                scenarios: getTransitionScenarios(
                  dragTransitionDialog.fromStatus,
                  dragTransitionDialog.toStatus,
                  dragTransitionDialog.task
                ),
              }
            : null
        }
        onConfirm={handleDragTransitionConfirm}
        onCancel={handleDragTransitionCancel}
      />

      {/* Drag-and-Drop Date/Time Dialog */}
      <DateTimeStatusDialog
        isOpen={dragDateTimeDialog.isOpen}
        onClose={handleDragDateTimeCancel}
        onConfirm={handleDragDateTimeConfirm}
        currentTask={dragDateTimeDialog.task || ({} as Task)}
        targetStatus={dragDateTimeDialog.targetStatus || "todo"}
      />
    </div>
  );
};

export default TaskManager;
