import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "../../ui/textarea";
import { Task, Status, Subtask, Attachment } from "../../../types/task";
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
} from "./components";
import {
  getTransitionScenarios,
  executeStatusTransition as executeTransition,
} from "./utils/taskTransitions";

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
  availableTasks?: Task[]; // Thêm prop cho available tasks
  onTaskClick?: (taskId: string) => void; // Thêm callback cho task click
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  folders,
  onSave,
  onDelete,
  onDuplicate,
  onMove,
  isCreateMode = false,
  availableTasks = [],
  onTaskClick,
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newSubtask, setNewSubtask] = useState("");
  const [newAttachment, setNewAttachment] = useState({
    title: "",
    url: "",
    type: "file" as "image" | "video" | "audio" | "file" | "other",
  });
  const [newTag, setNewTag] = useState("");
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    from: Status;
    to: Status;
    scenarios: any[];
  } | null>(null);

  const attachmentRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentRef.current &&
        !attachmentRef.current.contains(event.target as Node)
      ) {
        setShowAttachmentOptions(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev!, [field]: value }));
  };

  const handleSubtaskChange = (
    id: string,
    field: keyof Subtask,
    value: any
  ) => {
    setEditedTask((prev) => ({
      ...prev!,
      subtasks:
        prev!.subtasks?.map((st) =>
          st.id === id ? { ...st, [field]: value } : st
        ) || [],
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
    };
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: [...(prev!.subtasks || []), newSub],
    }));
    setNewSubtask("");
    addActivityLog("subtask_added", `Added subtask: "${newSubtask}"`);
  };

  const handleDeleteSubtask = (id: string) => {
    if (!editedTask) return;
    const subtask = editedTask.subtasks?.find((st) => st.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter((st) => st.id !== id) || [],
    }));
    if (subtask) {
      addActivityLog("subtask_removed", `Removed subtask: "${subtask.title}"`);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachment.url.trim()) return;
    const newAtt: Attachment = {
      id: Date.now().toString(),
      title: newAttachment.title || "Attachment",
      url: newAttachment.url,
      type: newAttachment.type,
    };
    setEditedTask((prev) => ({
      ...prev!,
      attachments: [...(prev!.attachments || []), newAtt],
    }));
    setNewAttachment({ title: "", url: "", type: "file" });
    addActivityLog(
      "attachment_added",
      `Added attachment: "${newAtt.title}" (${newAtt.type})`
    );
  };

  const handleDeleteAttachment = (id: string) => {
    if (!editedTask) return;
    const attachment = editedTask.attachments?.find((att) => att.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      attachments: prev!.attachments?.filter((att) => att.id !== id) || [],
    }));
    if (attachment) {
      addActivityLog(
        "attachment_removed",
        `Removed attachment: "${attachment.title}"`
      );
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setEditedTask((prev) => ({
      ...prev!,
      tags: [...(prev!.tags || []), newTag],
    }));
    setNewTag("");
    addActivityLog("tag_added", `Added tag: "${newTag}"`);
  };

  const handleDeleteTag = (tag: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      tags: prev!.tags?.filter((t) => t !== tag) || [],
    }));
    addActivityLog("tag_removed", `Removed tag: "${tag}"`);
  };

  const addActivityLog = (action: string, details: string) => {
    if (isCreateMode) return;
    const now = new Date();
    const activityEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
      details,
      action,
      userId: "user",
      timestamp: now,
    };
    setEditedTask((prev) => ({
      ...prev!,
      activityLog: [...(prev!.activityLog || []), activityEntry],
    }));
  };

  const handleStatusChange = (newStatus: Status) => {
    if (!editedTask) return;

    const scenarios = getTransitionScenarios(
      editedTask.status,
      newStatus,
      editedTask
    );

    if (scenarios.length > 0) {
      setPendingTransition({
        from: editedTask.status,
        to: newStatus,
        scenarios,
      });
      setShowTransitionDialog(true);
      return;
    }

    executeStatusTransition(editedTask.status, newStatus, {});
  };

  const executeStatusTransition = (
    oldStatus: Status,
    newStatus: Status,
    selectedOptions: Record<string, string>
  ) => {
    if (!editedTask) return;

    const updatedTask = executeTransition(
      editedTask,
      oldStatus,
      newStatus,
      selectedOptions,
      isCreateMode
    );

    setEditedTask(updatedTask);
    onSave(updatedTask);
  };

  const handleTransitionConfirm = (selectedOptions: Record<string, string>) => {
    if (!pendingTransition) return;
    executeStatusTransition(
      pendingTransition.from,
      pendingTransition.to,
      selectedOptions
    );
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleTransitionCancel = () => {
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  // Handle task click for linked tasks
  const handleLinkedTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  if (!isOpen || !editedTask) return null;

  // Filter available tasks (exclude current task)
  const filteredAvailableTasks = availableTasks.filter(
    (t) => t.id !== editedTask.id
  );

  const metadataInfo = calculateTaskMetadataSize(editedTask);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <TransitionConfirmationDialog
        isOpen={showTransitionDialog}
        transition={pendingTransition}
        onConfirm={handleTransitionConfirm}
        onCancel={handleTransitionCancel}
      />

      <div className="w-full max-w-5xl max-h-[95vh] bg-dialog-background rounded-lg border border-border-default overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex justify-between items-center">
          <div className="flex items-center gap-4 w-full">
            {!isCreateMode && (
              <StatusBar
                currentStatus={editedTask.status}
                onStatusChange={handleStatusChange}
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
              <Textarea
                value={editedTask.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="What needs to be done?"
                rows={1}
                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all resize-none overflow-hidden"
                style={{ minHeight: "3.5rem", maxHeight: "10rem" }}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
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
                value={editedTask.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full bg-input-background rounded-lg p-4 border border-border-default text-text-primary resize-none"
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
                <DateTimeSection
                  editedTask={editedTask}
                  handleChange={handleChange}
                  isCreateMode={isCreateMode}
                />
                <TagsSection
                  editedTask={editedTask}
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
            <div className="w-1/3 p-6 border-l border-border-default">
              <div className="flex items-center gap-2 mb-6">
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
              onClick={() => onSave(editedTask)}
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
