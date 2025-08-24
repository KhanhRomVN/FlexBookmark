// src/presentation/components/TaskManager/TaskDialog/index.tsx - Added auto-expanding height and character counter
import React, { useState, useRef, useEffect } from "react";
import { Task, Status } from "../../../types/task";
import {
  X,
  Trash2,
  Copy,
  MoreVertical,
  Move,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { calculateTaskMetadataSize } from "../../../../utils/GGTask";
import {
  TransitionConfirmationDialog,
  StatusBar,
  PrioritySection,
  DateTimeSection,
  TagsSection,
  SubtasksSection,
  AttachmentsSection,
  ActivityLogSection,
  DateTimeStatusDialog,
} from "./components";
import CollectionSection from "./components/CollectionSection";
import LocationSection from "./components/LocationSection";
import { useTaskState } from "./hooks/useTaskState";
import { useSubtasks } from "./hooks/useSubtasks";
import { useAttachments } from "./hooks/useAttachments";
import { useTags } from "./hooks/useTags";
import { useActivityLog } from "./hooks/useActivityLog";
import { useStatusTransitions } from "./hooks/useStatusTransitions";
import { useGoogleTasksIntegration } from "./hooks/useGoogleTasksIntegration";
import LinkedTasksSection from "./components/LinkedTasksSection";
import RestoreConfirmationDialog from "./components/RestoreConfirmationDialog";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  folders: { id: string; title: string; emoji: string }[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onMove: (taskId: string, newStatus: Status) => void;
  isCreateMode?: boolean;
  availableTasks?: Task[];
  onTaskClick?: (taskId: string) => void;
  // Google Tasks integration props
  getFreshToken?: () => Promise<string>;
  createGoogleTask?: (
    token: string,
    taskData: Task,
    activeGroup: string
  ) => Promise<any>;
  deleteGoogleTask?: (
    token: string,
    taskId: string,
    activeGroup: string
  ) => Promise<any>;
  activeGroup?: string;
  lists?: any[];
  setLists?: React.Dispatch<React.SetStateAction<any[]>>;
  setError?: (error: string) => void;
  startTransition?: (callback: () => void) => void;
  setSelectedTask?: (task: Task | null) => void;
  setIsDialogOpen?: (isOpen: boolean) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  onDuplicate,
  onMove,
  isCreateMode = false,
  availableTasks = [],
  onTaskClick,
  // Google Tasks integration props
  getFreshToken,
  createGoogleTask,
  deleteGoogleTask,
  activeGroup,
  lists,
  setLists,
  setError,
  startTransition,
  setSelectedTask,
  setIsDialogOpen,
}) => {
  // Use hooks for state management
  const {
    editedTask,
    setEditedTask,
    handleChange,
    handleSystemStatusChange,
    suggestedStatus,
    getEffectiveStatus,
  } = useTaskState(task, isCreateMode);

  const { addActivityLog } = useActivityLog(
    editedTask,
    setEditedTask,
    isCreateMode
  );

  // DEBUG: Monitor handleChange function
  const debugHandleChange = (field: keyof Task, value: any) => {
    // Call the original handleChange
    const result = handleChange(field, value);

    return result;
  };

  const {
    newSubtask,
    setNewSubtask,
    handleSubtaskChange,
    handleAddSubtask,
    handleDeleteSubtask,
  } = useSubtasks(editedTask, debugHandleChange, addActivityLog); // Use debug version

  const {
    newAttachment,
    setNewAttachment,
    handleAddAttachment,
    handleDeleteAttachment,
  } = useAttachments(editedTask, setEditedTask, addActivityLog);
  const { newTag, setNewTag, handleAddTag, handleDeleteTag } = useTags(
    editedTask,
    handleChange,
    addActivityLog
  );
  const {
    pendingTransition,
    showTransitionDialog,
    setShowTransitionDialog,
    setPendingTransition,
    handleStatusChange,
    executeStatusTransition,
  } = useStatusTransitions(
    editedTask,
    setEditedTask,
    onSave,
    isCreateMode,
    getEffectiveStatus
  );
  const {
    showRestoreDialog,
    pendingRestoreStatus,
    setShowRestoreDialog,
    setPendingRestoreStatus,
    handleRestoreConfirm,
    handleRestoreCancel,
  } = useGoogleTasksIntegration(
    editedTask,
    onClose,
    getFreshToken,
    createGoogleTask,
    deleteGoogleTask,
    activeGroup,
    lists,
    setLists,
    setError,
    startTransition,
    setSelectedTask,
    setIsDialogOpen
  );

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDateTimeDialog, setShowDateTimeDialog] = useState(false);
  const [pendingDateTimeStatus, setPendingDateTimeStatus] =
    useState<Status | null>(null);

  const [pendingTransitionWithDialog, setPendingTransitionWithDialog] =
    useState<{
      from: Status;
      to: Status;
      selectedOptions: Record<string, string>;
    } | null>(null);

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function for textareas
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set the height to match the scroll height (content height)
    textarea.style.height = textarea.scrollHeight + "px";
  };

  // Title character count
  const titleCharCount = editedTask?.title?.length || 0;
  const titleMaxChar = 1023;
  const isTitleOverLimit = titleCharCount > titleMaxChar;

  // Handle title change with character limit
  const handleTitleChange = (value: string) => {
    if (value.length <= titleMaxChar) {
      handleChange("title", value);
    }
  };

  // Auto-resize textareas on content change
  useEffect(() => {
    if (titleTextareaRef.current) {
      autoResizeTextarea(titleTextareaRef.current);
    }
  }, [editedTask?.title]);

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      autoResizeTextarea(descriptionTextareaRef.current);
    }
  }, [editedTask?.description]);

  // Handle task click for linked tasks
  const handleLinkedTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  const debugOnSave = (task: Task) => {
    return onSave(task);
  };

  if (!isOpen || !editedTask) {
    return null;
  }

  // Filter available tasks (exclude current task)
  const filteredAvailableTasks = availableTasks.filter(
    (t) => t.id !== editedTask.id
  );

  const metadataInfo = calculateTaskMetadataSize(editedTask);

  const handleTransitionConfirm = async (
    selectedOptions: Record<string, string>
  ) => {
    if (!pendingTransition) return;

    const requiresDateTimeDialog =
      Object.values(selectedOptions).includes("adjust_time");

    if (requiresDateTimeDialog) {
      setPendingTransitionWithDialog({
        from: pendingTransition.from,
        to: pendingTransition.to,
        selectedOptions,
      });
      setShowDateTimeDialog(true);
      setPendingDateTimeStatus(pendingTransition.to);
      setShowTransitionDialog(false);
      setPendingTransition(null);
      return;
    }

    // Check if this is a Google Tasks restore scenario
    const isGoogleTasksRestore =
      pendingTransition.from === "done" &&
      pendingTransition.to !== "done" &&
      Object.values(selectedOptions).includes("google_tasks_warning");

    if (isGoogleTasksRestore) {
      // Close the transition dialog first
      setShowTransitionDialog(false);
      setPendingTransition(null);

      // Now trigger the Google Tasks restore process
      setPendingRestoreStatus(pendingTransition.to);
      setShowRestoreDialog(true);
      return;
    }

    // Handle normal transitions
    executeStatusTransition(
      pendingTransition.from,
      pendingTransition.to,
      selectedOptions,
      false
    );
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleTransitionCancel = () => {
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleDateTimeConfirm = (
    startDate: Date | null,
    dueDate: Date | null,
    status: Status
  ) => {
    if (!editedTask || !pendingTransitionWithDialog) return;

    const updatedTask = {
      ...editedTask,
      startDate,
      dueDate,
      status,
      startTime: startDate,
      dueTime: dueDate,
    };

    // Update UI state but don't save to API yet
    executeStatusTransition(
      pendingTransitionWithDialog.from,
      pendingTransitionWithDialog.to,
      pendingTransitionWithDialog.selectedOptions,
      false // Don't save to API yet
    );

    setEditedTask(updatedTask);
    setShowDateTimeDialog(false);
    setPendingTransitionWithDialog(null);
    setPendingDateTimeStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <TransitionConfirmationDialog
        isOpen={showTransitionDialog}
        transition={pendingTransition}
        onConfirm={handleTransitionConfirm}
        onCancel={handleTransitionCancel}
      />

      <DateTimeStatusDialog
        isOpen={showDateTimeDialog}
        onClose={() => setShowDateTimeDialog(false)}
        onConfirm={handleDateTimeConfirm}
        currentTask={editedTask!}
        targetStatus={pendingDateTimeStatus!}
      />

      {/* Google Tasks Restore Confirmation Dialog */}
      {pendingRestoreStatus && (
        <RestoreConfirmationDialog
          isOpen={showRestoreDialog}
          taskTitle={editedTask?.title || ""}
          targetStatus={pendingRestoreStatus}
          onConfirm={handleRestoreConfirm}
          onCancel={handleRestoreCancel}
        />
      )}

      <div className="w-full max-w-5xl max-h-[95vh] bg-dialog-background rounded-lg border border-border-default overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex justify-between items-center">
          <div className="flex items-center gap-4 w-full">
            {!isCreateMode && (
              <StatusBar
                currentStatus={editedTask.status}
                suggestedStatus={suggestedStatus}
                effectiveStatus={getEffectiveStatus()}
                onStatusChange={handleStatusChange}
                task={editedTask}
              />
            )}
            {!isCreateMode && (
              <div className="ml-auto flex items-center gap-2 text-sm">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    metadataInfo.isOverLimit
                      ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : metadataInfo.characterCount > 7000
                      ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {metadataInfo.isOverLimit && <AlertTriangle size={14} />}
                  <span>
                    {metadataInfo.characterCount.toLocaleString()} / 4095
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {!isCreateMode && (
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
                >
                  <MoreVertical size={20} />
                </button>

                {showActionMenu && (
                  <div className="absolute z-20 right-0 mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden w-44 animate-in fade-in-0 zoom-in-95">
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => setShowActionMenu(false)}
                    >
                      <Move size={16} />
                      Move
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        onDuplicate(editedTask);
                        setShowActionMenu(false);
                      }}
                    >
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        onMove(editedTask.id, "archive");
                        setShowActionMenu(false);
                      }}
                    >
                      <Archive size={16} />
                      Archive
                    </button>
                    <div className="border-t border-border-default">
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 transition-colors"
                        onClick={() => {
                          if (editedTask.id) onDelete(editedTask.id);
                          setShowActionMenu(false);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-auto flex ${
            isCreateMode ? "justify-center" : ""
          }`}
        >
          {/* Left Column - Main Content */}
          <div
            ref={leftPanelRef}
            className={`${
              isCreateMode ? "w-full max-w-4xl" : "w-2/3"
            } p-6 space-y-8 overflow-auto max-h-[calc(100vh-200px)]`}
          >
            {/* Title */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  ref={titleTextareaRef}
                  value={editedTask.title}
                  onChange={(e) => {
                    handleTitleChange(e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="What needs to be done?"
                  rows={1}
                  className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all resize-none"
                  style={{
                    minHeight: "3.5rem",
                    lineHeight: "1.2",
                    overflow: "hidden",
                  }}
                />
                {/* Character counter for title */}
                <div className="absolute -bottom-6 right-0 text-xs text-gray-500 dark:text-gray-400">
                  <span className={isTitleOverLimit ? "text-red-500" : ""}>
                    {titleCharCount}/{titleMaxChar}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Description
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>
              <textarea
                ref={descriptionTextareaRef}
                value={editedTask.description || ""}
                onChange={(e) => {
                  handleChange("description", e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  autoResizeTextarea(e.currentTarget);
                }}
                rows={4}
                className="w-full text-base bg-input-background rounded-lg p-4 border border-border-default text-text-primary resize-none"
                style={{
                  minHeight: "6rem",
                  overflow: "hidden",
                }}
                placeholder="Add detailed description, notes, or context..."
              />
            </div>

            {/* Attributes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Attributes
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="space-y-6">
                <PrioritySection
                  editedTask={editedTask}
                  handleChange={handleChange}
                />
                <CollectionSection
                  editedTask={editedTask}
                  handleChange={handleChange}
                  availableTasks={availableTasks}
                />
                <DateTimeSection
                  editedTask={editedTask}
                  handleChange={handleChange}
                  handleSystemStatusChange={handleSystemStatusChange}
                  isCreateMode={isCreateMode}
                />
                <LocationSection
                  editedTask={editedTask}
                  handleChange={handleChange}
                />
                <TagsSection
                  editedTask={editedTask}
                  handleChange={handleChange}
                  newTag={newTag}
                  setNewTag={setNewTag}
                  handleAddTag={handleAddTag}
                  handleDeleteTag={handleDeleteTag}
                />
              </div>
            </div>

            <SubtasksSection
              editedTask={editedTask}
              newSubtask={newSubtask}
              setNewSubtask={setNewSubtask}
              handleSubtaskChange={handleSubtaskChange}
              handleAddSubtask={handleAddSubtask}
              handleDeleteSubtask={handleDeleteSubtask}
              availableTasks={filteredAvailableTasks}
              onTaskClick={handleLinkedTaskClick}
            />

            <AttachmentsSection
              editedTask={editedTask}
              newAttachment={newAttachment}
              setNewAttachment={setNewAttachment}
              handleAddAttachment={handleAddAttachment}
              handleDeleteAttachment={handleDeleteAttachment}
            />
          </div>

          {/* Right Column - Activity Log */}
          {!isCreateMode && (
            <div className="w-1/3 p-6 border-l border-border-default space-y-6">
              <LinkedTasksSection
                currentTask={editedTask}
                availableTasks={filteredAvailableTasks}
                onTaskClick={handleLinkedTaskClick}
              />

              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Activity Log
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>
              <ActivityLogSection editedTask={editedTask} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isCreateMode ? "Creating new task" : "Editing task"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => debugOnSave(editedTask)}
              className="px-6 py-2.5 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg font-medium"
            >
              {isCreateMode ? "Create Task" : "Save Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDialog;
