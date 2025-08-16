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
} from "lucide-react";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  folders: { id: string; title: string; emoji: string }[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  folders,
  onSave,
  onDelete,
  onDuplicate,
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
  const attachmentRef = useRef<HTMLDivElement>(null);
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
  };

  const handleDeleteSubtask = (id: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter((st) => st.id !== id) || [],
    }));
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
  };

  const handleDeleteAttachment = (id: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      attachments: prev!.attachments?.filter((att) => att.id !== id) || [],
    }));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setEditedTask((prev) => ({
      ...prev!,
      tags: [...(prev!.tags || []), newTag],
    }));
    setNewTag("");
  };

  const handleDeleteTag = (tag: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      tags: prev!.tags?.filter((t) => t !== tag) || [],
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
    low: "bg-gray-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  const statusEmojis = {
    backlog: "📥",
    todo: "📋",
    "in-progress": "🚧",
    done: "✅",
    archive: "🗄️",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-dialog-background rounded-lg border border-border-default overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border-default flex justify-between items-center">
          <div className="flex items-center gap-3 w-full">
            <div className="relative w-full max-w-xs">
              <select
                value={editedTask.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as Status)
                }
                className="w-full bg-input-background rounded-lg p-3 border border-border-default appearance-none pr-8 text-text-primary font-medium"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.emoji} {folder.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <ChevronDown size={16} />
              </div>
            </div>

            <input
              value={editedTask.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="flex-1 text-2xl font-bold bg-transparent border-none focus:ring-0 text-text-primary"
              placeholder="Task title"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-button-second-bg-hover text-muted-foreground"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex p-6">
          {/* Left Column */}
          <div
            ref={leftPanelRef}
            className="w-2/3 pr-6 space-y-6 overflow-auto max-h-[calc(100vh-200px)]"
          >
            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-text-primary">
                Description
              </h3>
              <textarea
                value={editedTask.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full bg-input-background rounded-lg p-4 border border-border-default"
                placeholder="Add a detailed description..."
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-text-primary">
                  SUB-TASKS
                </h3>
                {(editedTask.subtasks?.length ?? 0) > 0 && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2 text-text-primary">
                      {completionPercentage}%
                    </span>
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {editedTask.subtasks?.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 bg-input-background hover:bg-button-second-bg-hover rounded-lg transition-all"
                  >
                    <button
                      onClick={() =>
                        handleSubtaskChange(
                          subtask.id,
                          "completed",
                          !subtask.completed
                        )
                      }
                      className={`h-5 w-5 rounded flex items-center justify-center transition-all ${
                        subtask.completed
                          ? "bg-green-500 text-white"
                          : "border border-border"
                      }`}
                    >
                      {subtask.completed && <Check size={12} />}
                    </button>
                    <input
                      value={subtask.title}
                      onChange={(e) =>
                        handleSubtaskChange(subtask.id, "title", e.target.value)
                      }
                      className="flex-1 bg-transparent border-none focus:ring-0 text-text-primary"
                      placeholder="Subtask title"
                    />
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-4">
                  <input
                    placeholder="Add new subtask"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="flex-1 bg-input-background rounded-lg p-3 border border-border-default text-text-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-text-primary">
                Attachment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editedTask.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-input-background rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="overflow-hidden">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-primary font-medium truncate block max-w-[140px] hover:underline"
                        >
                          {att.title || "Attachment"}
                        </a>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {att.url.substring(0, 30)}
                          {att.url.length > 30 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm mb-1 block text-muted-foreground">
                      Attachment Title
                    </label>
                    <input
                      placeholder="Title"
                      value={newAttachment.title}
                      onChange={(e) =>
                        setNewAttachment((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full bg-input-background rounded-lg p-3 border border-border-default text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block text-muted-foreground">
                      Type
                    </label>
                    <div className="relative" ref={attachmentRef}>
                      <button
                        className="w-full bg-input-background rounded-lg p-3 border border-border-default flex justify-between items-center text-text-primary"
                        onClick={() =>
                          setShowAttachmentOptions(!showAttachmentOptions)
                        }
                      >
                        <span className="capitalize">{newAttachment.type}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showAttachmentOptions && (
                        <div className="absolute z-10 w-full mt-1 bg-dropdown-background border border-border-default rounded-lg shadow-lg overflow-hidden">
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
                              className="w-full text-left p-3 hover:bg-dropdown-item-hover flex items-center gap-2 capitalize text-text-primary"
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
                  <label className="text-sm mb-1 block text-muted-foreground">
                    URL
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
                    className="w-full bg-input-background rounded-lg p-3 border border-border-default text-text-primary"
                  />
                </div>

                <button
                  onClick={handleAddAttachment}
                  className="flex items-center gap-1 w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  <Plus size={16} /> Add Attachment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-1/3 pl-6 space-y-6">
            {/* Attributes */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg text-text-primary">
                ATTRIBUTES
              </h3>

              <div className="space-y-4">
                {/* Priority */}
                <div>
                  <label className="block mb-2 text-muted-foreground">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={editedTask.priority}
                      onChange={(e) =>
                        handleChange("priority", e.target.value as Priority)
                      }
                      className="w-full bg-input-background rounded-lg p-3 border border-border-default appearance-none pr-8 text-text-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block mb-2 text-muted-foreground">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={
                      editedTask.dueDate
                        ? new Date(editedTask.dueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleChange("dueDate", new Date(e.target.value))
                    }
                    className="w-full bg-input-background rounded-lg p-3 border border-border-default text-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-text-primary">
                ACTIONS
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onDuplicate(editedTask)}
                  className="flex items-center gap-2 p-3 text-text-primary hover:bg-button-second-bg-hover rounded-lg transition-colors border border-border"
                >
                  <Copy size={16} />
                  Duplicate task
                </button>
                <button
                  onClick={() => editedTask.id && onDelete(editedTask.id)}
                  className="flex items-center gap-2 p-3 text-destructive hover:bg-button-second-bg-hover rounded-lg transition-colors border border-border"
                >
                  <Trash2 size={16} />
                  Delete task
                </button>
              </div>
            </div>

            {/* Responsive Section */}
            <div className="space-y-4 mt-auto pt-6">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-border-default rounded-lg hover:bg-button-second-bg-hover transition-colors text-text-primary"
                >
                  Discard
                </button>
                <button
                  onClick={() => onSave(editedTask)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Save task
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDialog;
