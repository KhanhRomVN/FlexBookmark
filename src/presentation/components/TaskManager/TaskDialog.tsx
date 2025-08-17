import React, { useState, useEffect, useRef } from "react";
import { Task, Priority, Status, Subtask, Attachment } from "../../types/task";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Paperclip,
  Calendar,
  Clock,
  File,
  Image,
  Video,
  Radio,
  FileText,
  ChevronDown,
  Circle,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Move,
  Archive,
  Star,
  Flag,
  Link,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { calculateTaskMetadataSize } from "../../../utils/GGTask";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  folders: { id: string; title: string; emoji: string }[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onMove: (taskId: string, newStatus: Status) => void;
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
  const [showPrevTaskList, setShowPrevTaskList] = useState(false);
  const [showNextTaskList, setShowNextTaskList] = useState(false);
  const attachmentRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const prevTaskRef = useRef<HTMLDivElement>(null);
  const nextTaskRef = useRef<HTMLDivElement>(null);
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
      if (
        prevTaskRef.current &&
        !prevTaskRef.current.contains(event.target as Node)
      ) {
        setShowPrevTaskList(false);
      }
      if (
        nextTaskRef.current &&
        !nextTaskRef.current.contains(event.target as Node)
      ) {
        setShowNextTaskList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!editedTask) return null;

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

    // Add activity log entry
    const now = new Date();
    const activityEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
      details: `Added subtask: "${newSubtask}"`,
      action: "subtask_added",
      userId: "user",
      timestamp: now,
    };
    setEditedTask((prev) => ({
      ...prev!,
      activityLog: [...(prev!.activityLog || []), activityEntry],
    }));
  };

  const handleDeleteSubtask = (id: string) => {
    const subtask = editedTask.subtasks?.find((st) => st.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter((st) => st.id !== id) || [],
    }));

    // Add activity log entry
    if (subtask) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Removed subtask: "${subtask.title}"`,
        action: "subtask_removed",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
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

    // Add activity log entry
    const now = new Date();
    const activityEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
      details: `Added attachment: "${newAtt.title}" (${newAtt.type})`,
      action: "attachment_added",
      userId: "user",
      timestamp: now,
    };
    setEditedTask((prev) => ({
      ...prev!,
      activityLog: [...(prev!.activityLog || []), activityEntry],
    }));
  };

  const handleDeleteAttachment = (id: string) => {
    const attachment = editedTask.attachments?.find((att) => att.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      attachments: prev!.attachments?.filter((att) => att.id !== id) || [],
    }));

    // Add activity log entry
    if (attachment) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Removed attachment: "${attachment.title}"`,
        action: "attachment_removed",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setEditedTask((prev) => ({
      ...prev!,
      tags: [...(prev!.tags || []), newTag],
    }));
    setNewTag("");

    // Add activity log entry
    const now = new Date();
    const activityEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
      details: `Added tag: "${newTag}"`,
      action: "tag_added",
      userId: "user",
      timestamp: now,
    };
    setEditedTask((prev) => ({
      ...prev!,
      activityLog: [...(prev!.activityLog || []), activityEntry],
    }));
  };

  const handleDeleteTag = (tag: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      tags: prev!.tags?.filter((t) => t !== tag) || [],
    }));

    // Add activity log entry
    const now = new Date();
    const activityEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
      details: `Removed tag: "${tag}"`,
      action: "tag_removed",
      userId: "user",
      timestamp: now,
    };
    setEditedTask((prev) => ({
      ...prev!,
      activityLog: [...(prev!.activityLog || []), activityEntry],
    }));
  };

  const completionPercentage =
    editedTask.subtasks && editedTask.subtasks.length > 0
      ? Math.round(
          (editedTask.subtasks.filter((st) => st.completed).length /
            editedTask.subtasks.length) *
            100
        )
      : 0;

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image size={16} className="text-emerald-500" />;
      case "video":
        return <Video size={16} className="text-amber-500" />;
      case "audio":
        return <Radio size={16} className="text-indigo-500" />;
      case "file":
        return <File size={16} className="text-blue-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const priorityColors = {
    low: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md",
    medium:
      "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md",
    high: "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md",
    urgent: "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md",
  };

  const priorityIcons = {
    low: <Flag size={14} />,
    medium: <Flag size={14} />,
    high: <Flag size={14} />,
    urgent: <Star size={14} />,
  };

  // Calculate metadata size for character counter
  const metadataInfo = calculateTaskMetadataSize(editedTask);

  // Mock available tasks for linking (in real app, this would come from props)
  const availableTasks = [
    { id: "task1", title: "Review designs", status: "in-progress" },
    { id: "task2", title: "Update documentation", status: "todo" },
    { id: "task3", title: "Testing phase", status: "backlog" },
  ].filter((t) => t.id !== editedTask.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[95vh] bg-dialog-background rounded-lg border border-border-default overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default bg-dialog-background flex justify-between items-center">
          <div className="flex items-center gap-4 w-full">
            <div className="relative">
              <select
                value={editedTask.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as Status)
                }
                className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-600 appearance-none pr-10 text-gray-800 dark:text-gray-200 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.emoji} {folder.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Character Counter */}
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
                  {metadataInfo.characterCount.toLocaleString()} / 8,192
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
              >
                <MoreVertical size={20} />
              </button>

              {showActionMenu && (
                <div className="absolute z-20 right-0 mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-xl shadow-xl overflow-hidden w-44 animate-in fade-in-0 zoom-in-95">
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
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex">
          {/* Left Column */}
          <div
            ref={leftPanelRef}
            className="w-2/3 p-6 space-y-8 overflow-auto max-h-[calc(100vh-200px)]"
          >
            {/* Title */}
            <div className="space-y-2">
              <textarea
                value={editedTask.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all resize-none overflow-hidden"
                placeholder="What needs to be done?"
                rows={1}
                style={{
                  minHeight: "3.5rem",
                  maxHeight: "10rem",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                  Description
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>
              <textarea
                value={editedTask.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-sm"
                placeholder="Add detailed description, notes, or context..."
              />
            </div>

            {/* Task Linking */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                  Task Linking
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Previous Task */}
                <div className="space-y-2">
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Link size={16} />
                    Previous Task
                  </label>
                  <div className="relative" ref={prevTaskRef}>
                    <button
                      className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default flex justify-between items-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      onClick={() => setShowPrevTaskList(!showPrevTaskList)}
                    >
                      <span className="truncate">
                        {editedTask.prevTaskId
                          ? availableTasks.find(
                              (t) => t.id === editedTask.prevTaskId
                            )?.title || "Unknown Task"
                          : "Select previous task..."}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {showPrevTaskList && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-gray-700"
                          onClick={() => {
                            handleChange("prevTaskId", null);
                            setShowPrevTaskList(false);
                          }}
                        >
                          <span className="text-gray-500">None</span>
                        </button>
                        {availableTasks.map((task) => (
                          <button
                            key={task.id}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            onClick={() => {
                              handleChange("prevTaskId", task.id);
                              setShowPrevTaskList(false);
                            }}
                          >
                            <div className="truncate">{task.title}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {task.status.replace("-", " ")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Task */}
                <div className="space-y-2">
                  <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Link size={16} />
                    Next Task
                  </label>
                  <div className="relative" ref={nextTaskRef}>
                    <button
                      className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default flex justify-between items-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      onClick={() => setShowNextTaskList(!showNextTaskList)}
                    >
                      <span className="truncate">
                        {editedTask.nextTaskId
                          ? availableTasks.find(
                              (t) => t.id === editedTask.nextTaskId
                            )?.title || "Unknown Task"
                          : "Select next task..."}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {showNextTaskList && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-gray-700"
                          onClick={() => {
                            handleChange("nextTaskId", null);
                            setShowNextTaskList(false);
                          }}
                        >
                          <span className="text-gray-500">None</span>
                        </button>
                        {availableTasks.map((task) => (
                          <button
                            key={task.id}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            onClick={() => {
                              handleChange("nextTaskId", task.id);
                              setShowNextTaskList(false);
                            }}
                          >
                            <div className="truncate">{task.title}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {task.status.replace("-", " ")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                  Attributes
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="space-y-6">
                {/* Priority Buttons */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Priority Level
                  </label>
                  <div className="flex items-center gap-3">
                    {(["low", "medium", "high", "urgent"] as Priority[]).map(
                      (level) => (
                        <button
                          key={level}
                          onClick={() => handleChange("priority", level)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                            editedTask.priority === level
                              ? priorityColors[level]
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border-default hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {priorityIcons[level]}
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Date & Time Fields */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar size={16} />
                      Start Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={
                          editedTask.startDate
                            ? new Date(editedTask.startDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            "startDate",
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                      <input
                        type="time"
                        value={
                          editedTask.startTime
                            ? new Date(editedTask.startTime)
                                .toISOString()
                                .slice(11, 16)
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            "startTime",
                            e.target.value
                              ? new Date("1970-01-01T" + e.target.value)
                              : null
                          )
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Clock size={16} />
                      Due Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={
                          editedTask.endDate
                            ? new Date(editedTask.endDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            "endDate",
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                      <input
                        type="time"
                        value={
                          editedTask.endTime
                            ? new Date(editedTask.endTime)
                                .toISOString()
                                .slice(11, 16)
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            "endTime",
                            e.target.value
                              ? new Date("1970-01-01T" + e.target.value)
                              : null
                          )
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-xl p-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editedTask.tags?.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
                        >
                          {tag}
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-border-default text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      />
                      <button
                        onClick={handleAddTag}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    Subtasks
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                </div>
                {(editedTask.subtasks?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {completionPercentage}% Complete
                    </span>
                    <div className="w-24 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {editedTask.subtasks?.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70 rounded-xl transition-all duration-200 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <button
                      onClick={() =>
                        handleSubtaskChange(
                          subtask.id,
                          "completed",
                          !subtask.completed
                        )
                      }
                      className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        subtask.completed
                          ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                          : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                      }`}
                    >
                      {subtask.completed && <Check size={14} />}
                    </button>
                    <input
                      value={subtask.title}
                      onChange={(e) =>
                        handleSubtaskChange(subtask.id, "title", e.target.value)
                      }
                      className={`flex-1 bg-transparent border-none focus:ring-0 transition-all ${
                        subtask.completed
                          ? "text-gray-500 dark:text-gray-400 line-through"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                      placeholder="Subtask title"
                    />
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-3 mt-4">
                  <input
                    placeholder="Add new subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-md font-medium"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                  Attachments
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedTask.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-border-default shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-2.5 rounded-lg">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-800 dark:text-gray-200 font-medium truncate block hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {att.title || "Attachment"}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {att.url.substring(0, 40)}
                          {att.url.length > 40 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-border-default">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-2 block font-medium text-gray-600 dark:text-gray-400">
                      Title
                    </label>
                    <input
                      placeholder="Attachment name"
                      value={newAttachment.title}
                      onChange={(e) =>
                        setNewAttachment((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-2 block font-medium text-gray-600 dark:text-gray-400">
                      Type
                    </label>
                    <div className="relative" ref={attachmentRef}>
                      <button
                        className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default flex justify-between items-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        onClick={() =>
                          setShowAttachmentOptions(!showAttachmentOptions)
                        }
                      >
                        <span className="capitalize flex items-center gap-2">
                          {getAttachmentIcon(newAttachment.type)}
                          {newAttachment.type}
                        </span>
                        <ChevronDown size={16} />
                      </button>
                      {showAttachmentOptions && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-xl shadow-xl overflow-hidden">
                          {(
                            [
                              "image",
                              "video",
                              "audio",
                              "file",
                              "other",
                            ] as const
                          ).map((type) => (
                            <button
                              key={type}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 capitalize text-gray-700 dark:text-gray-300 transition-colors"
                              onClick={() => {
                                setNewAttachment((prev) => ({ ...prev, type }));
                                setShowAttachmentOptions(false);
                              }}
                            >
                              {getAttachmentIcon(type)}
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-2 block font-medium text-gray-600 dark:text-gray-400">
                    URL or Link
                  </label>
                  <input
                    placeholder="https://example.com/file.pdf"
                    value={newAttachment.url}
                    onChange={(e) =>
                      setNewAttachment((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    className="w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-border-default text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={handleAddAttachment}
                  className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md font-medium justify-center"
                >
                  <Paperclip size={16} />
                  Add Attachment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Activity Log */}
          <div className="w-1/3 p-6 bg-dialog-background border-l border-border-default">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                Activity Log
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {editedTask.activityLog && editedTask.activityLog.length > 0 ? (
                editedTask.activityLog
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Activity
                              size={12}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm capitalize">
                            {activity.action.replace("_", " ")}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {new Date(activity.timestamp).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {activity.details}
                      </p>
                      {activity.userId && activity.userId !== "system" && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          by {activity.userId}
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No activity recorded yet
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Changes will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-dialog-background flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {editedTask.id ? "Editing task" : "Creating new task"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedTask)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md font-medium"
            >
              Save Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDialog;
