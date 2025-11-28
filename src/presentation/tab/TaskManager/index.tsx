import React from "react";
import TaskGroupSidebar from "./components/TaskGroupSidebar";
import TaskDialog from "./components/TaskDialog";
import TaskHeader, { LayoutType } from "./components/TasKHeader";
import ArchiveDrawer from "./components/ArchiveDrawer";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import KanbanLayout from "./layout/KanbanLayout";
import TableLayout from "./layout/TableLayout";
import { useTask, folders } from "./hooks/useTask";
import {
  createGoogleTask,
  deleteGoogleTask,
  updateGoogleTaskList,
  deleteGoogleTaskList,
  createGoogleTaskList,
} from "./services/GoogleTaskService";
import { Status, Task } from "./types/task";

// Import dialog components for status transitions
import TransitionConfirmationDialog from "./components/TaskDialog/components/TransitionConfirmationDialog";
import DateTimeStatusDialog from "./components/TaskDialog/components/DateTimeStatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/presentation/components/common/PermissionGuard";

// Import transition utilities
import {
  getTransitionScenarios,
  executeStatusTransition,
} from "./components/TaskDialog/utils/taskTransitions";

const TaskManager: React.FC = () => {
  const { authState, getFreshToken } = useAuth(); // Use centralized auth

  const {
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
    filterCollection,
    setFilterCollection,
    filterLocation,
    setFilterLocation,
    filterTimeRange,
    setFilterTimeRange,
  } = useTask();

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
      linkedTasks: [],
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

  // Simplified Google Tasks integration - using centralized auth
  const createGoogleTaskWrapper = async (
    taskData: any,
    activeGroup: string
  ) => {
    try {
      const token = await getFreshToken(); // Use centralized auth
      if (!activeGroup) throw new Error("No active task list selected");

      const result = await createGoogleTask(token, taskData, activeGroup);
      return result;
    } catch (error: any) {
      console.error("Task creation failed:", error);
      throw error;
    }
  };

  const deleteGoogleTaskWrapper = async (
    taskId: string,
    activeGroup: string
  ) => {
    try {
      const token = await getFreshToken(); // Use centralized auth
      if (!activeGroup) throw new Error("No active task list selected");

      await deleteGoogleTask(token, taskId, activeGroup);
    } catch (error: any) {
      console.error("Task deletion failed:", error);
      throw error;
    }
  };

  // Enhanced group creation with Google Tasks API integration
  const handleCreateGroupWrapper = async (name: string) => {
    try {
      const token = await getFreshToken(); // Use centralized auth
      const newGroup = await createGoogleTaskList(token, name);

      await handleCreateGroup(name);
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
      const token = await getFreshToken(); // Use centralized auth
      await updateGoogleTaskList(token, id, newName);
      window.location.reload(); // Reload to reflect changes
    } catch (error: any) {
      console.error("Error renaming group:", error);
      setError(error.message || "Failed to rename task group");
      throw error;
    }
  };

  // Enhanced group delete handler
  const handleDeleteGroupWrapper = async (id: string) => {
    try {
      const token = await getFreshToken(); // Use centralized auth
      await deleteGoogleTaskList(token, id);

      // If we're deleting the active group, switch to the first available group
      if (activeGroup === id && groups.length > 1) {
        const remainingGroups = groups.filter((g) => g.id !== id);
        if (remainingGroups.length > 0) {
          setActiveGroup(remainingGroups[0].id);
        }
      }

      window.location.reload(); // Reload to reflect changes
    } catch (error: any) {
      console.error("Error deleting group:", error);
      setError(error.message || "Failed to delete task group");
      throw error;
    }
  };

  // Enhanced group selection handler that properly loads tasks for the selected group
  const handleGroupSelection = async (groupId: string) => {
    try {
      setActiveGroup(groupId);
      setLists([]); // Clear current lists to show loading state
      await loadTasks(); // This will use the new activeGroup
    } catch (error: any) {
      console.error("Error switching groups:", error);
      setError(error.message || "Failed to load tasks for selected group");
    }
  };

  // Enhanced clear filters to include new filter types
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
    if (setFilterCollection) setFilterCollection([]);
    if (setFilterLocation) setFilterLocation("");
    if (setFilterTimeRange) setFilterTimeRange({});
  };

  // Filter lists to exclude archive for main board
  const mainBoardLists = filteredLists.filter((list) => list.id !== "archive");

  // Get all tasks for list view
  const allTasks = mainBoardLists.flatMap((list) => list.tasks);

  return (
    <PermissionGuard>
      <div className="flex w-full h-screen bg-background overflow-hidden">
        <TaskGroupSidebar
          groups={groups}
          activeGroup={activeGroup || ""}
          onSelectGroup={handleGroupSelection}
          onCreateGroup={handleCreateGroupWrapper}
          onRenameGroup={handleRenameGroupWrapper}
          onDeleteGroup={handleDeleteGroupWrapper}
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

        {/* Enhanced Task Dialog with centralized auth */}
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
          // Simplified Google Tasks integration props
          createGoogleTask={createGoogleTaskWrapper}
          deleteGoogleTask={deleteGoogleTaskWrapper}
          activeGroup={activeGroup || ""}
          lists={lists}
          setLists={setLists}
          setError={setError}
          startTransition={React.startTransition}
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
    </PermissionGuard>
  );
};

export default TaskManager;
