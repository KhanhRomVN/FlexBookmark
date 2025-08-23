import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Check,
  Link,
  ExternalLink,
  Search,
  Lock,
  Smile,
} from "lucide-react";
import { Subtask, Task } from "../../../../types/task";

interface SubtasksSectionProps {
  editedTask: Task;
  newSubtask: string;
  setNewSubtask: React.Dispatch<React.SetStateAction<string>>;
  handleSubtaskChange: (id: string, field: keyof Subtask, value: any) => void;
  handleAddSubtask: (subtaskData?: Partial<Subtask>) => void;
  handleDeleteSubtask: (id: string) => void;
  availableTasks?: Task[];
  onTaskClick?: (taskId: string) => void;
}

interface NewSubtaskForm {
  title: string;
  description: string;
  linkedTaskId: string | null;
  requiredCompleted: boolean;
  emoji: string;
}

// Common emojis for subtasks
const SUBTASK_EMOJIS = [
  "✅",
  "📝",
  "🎯",
  "💡",
  "🔧",
  "📋",
  "⚡",
  "🚀",
  "💼",
  "📱",
  "💻",
  "📊",
  "📞",
  "✉️",
  "🎨",
  "🔍",
  "📚",
  "🎵",
  "🏃",
  "🍕",
  "☕",
  "🌟",
  "🔥",
  "💪",
];

const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  editedTask,
  newSubtask,
  setNewSubtask,
  handleSubtaskChange,
  handleAddSubtask,
  handleDeleteSubtask,
  availableTasks = [],
  onTaskClick,
}) => {
  const [newSubtaskForm, setNewSubtaskForm] = useState<NewSubtaskForm>({
    title: "",
    description: "",
    linkedTaskId: null,
    requiredCompleted: false,
    emoji: "",
  });

  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTaskDropdown, setEditingTaskDropdown] = useState<string | null>(
    null
  );
  const [editingSearchQuery, setEditingSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingEmojiPicker, setEditingEmojiPicker] = useState<string | null>(
    null
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const editingDropdownRef = useRef<HTMLDivElement>(null);
  const linkedTaskSearchRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editingEmojiPickerRef = useRef<HTMLDivElement>(null);

  const completionPercentage =
    editedTask.subtasks && editedTask.subtasks.length > 0
      ? Math.round(
          (editedTask.subtasks.filter((st) => st.completed).length /
            editedTask.subtasks.length) *
            100
        )
      : 0;

  // Filter available tasks
  const filteredTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEditingTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(editingSearchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(editingSearchQuery.toLowerCase())
  );

  const handleFormChange = (
    field: keyof NewSubtaskForm,
    value: string | null | boolean
  ) => {
    setNewSubtaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewSubtaskForm((prev) => ({ ...prev, emoji }));
    setShowEmojiPicker(false);
  };

  const handleEditingEmojiSelect = (subtaskId: string, emoji: string) => {
    const currentTitle =
      editedTask.subtasks?.find((st) => st.id === subtaskId)?.title || "";
    const titleWithoutEmoji = currentTitle.replace(/^[^\w\s]+\s*/, "");
    const newTitle = emoji
      ? `${emoji} ${titleWithoutEmoji}`
      : titleWithoutEmoji;

    handleSubtaskChange(subtaskId, "title", newTitle);
    setEditingEmojiPicker(null);
  };

  const extractEmoji = (
    title: string
  ): { emoji: string; titleWithoutEmoji: string } => {
    const emojiMatch = title.match(/^([^\w\s]+)\s*/);
    if (emojiMatch) {
      return {
        emoji: emojiMatch[1],
        titleWithoutEmoji: title.replace(/^[^\w\s]+\s*/, ""),
      };
    }
    return { emoji: "", titleWithoutEmoji: title };
  };

  const handleLinkedTaskSearch = (value: string) => {
    setSearchQuery(value);
    setShowTaskDropdown(value.length > 0);
  };

  const handleTaskSelect = (task: Task) => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: task.id }));
    setSearchQuery(task.title);
    setShowTaskDropdown(false);
  };

  const handleClearLinkedTask = () => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: null }));
    setSearchQuery("");
  };

  // Enhanced add subtask function
  const handleEnhancedAddSubtask = () => {
    if (!newSubtaskForm.title.trim()) {
      console.warn("⚠️ No title in form");
      return;
    }

    const fullTitle = newSubtaskForm.emoji
      ? `${newSubtaskForm.emoji} ${newSubtaskForm.title.trim()}`
      : newSubtaskForm.title.trim();

    // Use the hook's handleAddSubtask with all data
    handleAddSubtask({
      title: fullTitle,
      description: newSubtaskForm.description,
      linkedTaskId: newSubtaskForm.linkedTaskId,
      requiredCompleted: newSubtaskForm.requiredCompleted,
    });

    // Reset form
    setNewSubtaskForm({
      title: "",
      description: "",
      linkedTaskId: null,
      requiredCompleted: false,
      emoji: "",
    });
    setSearchQuery("");
  };

  const handleEditingTaskSearch = (subtaskId: string, value: string) => {
    setEditingSearchQuery(value);
    setEditingTaskDropdown(subtaskId);
  };

  const handleEditingTaskSelect = (subtaskId: string, task: Task) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", task.id);
    setEditingTaskDropdown(null);
    setEditingSearchQuery("");
  };

  const handleClearEditingLinkedTask = (subtaskId: string) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", undefined);
    setEditingSearchQuery("");
  };

  const getLinkedTask = (linkedTaskId?: string) => {
    if (!linkedTaskId) return null;
    return availableTasks.find((task) => task.id === linkedTaskId);
  };

  const getSelectedLinkedTask = () => {
    if (!newSubtaskForm.linkedTaskId) return null;
    return availableTasks.find(
      (task) => task.id === newSubtaskForm.linkedTaskId
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        linkedTaskSearchRef.current &&
        !linkedTaskSearchRef.current.contains(event.target as Node)
      ) {
        setShowTaskDropdown(false);
      }
      if (
        editingDropdownRef.current &&
        !editingDropdownRef.current.contains(event.target as Node)
      ) {
        setEditingTaskDropdown(null);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        editingEmojiPickerRef.current &&
        !editingEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setEditingEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-text-default">Subtasks</h3>
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

      {/* Subtasks Display */}
      <div className="space-y-3">
        {editedTask.subtasks && editedTask.subtasks.length > 0 ? (
          editedTask.subtasks.map((subtask) => {
            const linkedTask = getLinkedTask(subtask.linkedTaskId);
            const { emoji, titleWithoutEmoji } = extractEmoji(subtask.title);

            return (
              <div
                key={subtask.id}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                {/* Checkbox with required indicator */}
                <div className="flex flex-col items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      handleSubtaskChange(
                        subtask.id,
                        "completed",
                        !subtask.completed
                      );
                    }}
                    className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      subtask.completed
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                        : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                    }`}
                  >
                    {subtask.completed && <Check size={16} />}
                  </button>
                  {subtask.requiredCompleted && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Lock size={10} />
                      <span>Required</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  {/* Title with emoji */}
                  <div className="flex items-center gap-2">
                    {/* Emoji picker button */}
                    <div className="relative" ref={editingEmojiPickerRef}>
                      <button
                        onClick={() =>
                          setEditingEmojiPicker(
                            editingEmojiPicker === subtask.id
                              ? null
                              : subtask.id
                          )
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center text-sm transition-colors ${
                          emoji
                            ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                            : "border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                        title="Add or change emoji"
                      >
                        {emoji || <Smile size={12} className="text-gray-400" />}
                      </button>

                      {editingEmojiPicker === subtask.id && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border-default z-20 w-48">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Choose emoji:
                          </div>
                          <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto">
                            <button
                              onClick={() =>
                                handleEditingEmojiSelect(subtask.id, "")
                              }
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs border border-dashed"
                              title="Remove emoji"
                            >
                              <X size={8} />
                            </button>
                            {SUBTASK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() =>
                                  handleEditingEmojiSelect(subtask.id, emoji)
                                }
                                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      value={titleWithoutEmoji}
                      onChange={(e) => {
                        const newTitle = emoji
                          ? `${emoji} ${e.target.value}`
                          : e.target.value;
                        handleSubtaskChange(subtask.id, "title", newTitle);
                      }}
                      className={`flex-1 bg-transparent border-none focus:ring-0 font-medium transition-all ${
                        subtask.completed
                          ? "text-text-secondary line-through"
                          : "text-text-default"
                      }`}
                      placeholder="Subtask title"
                    />

                    <button
                      onClick={() => {
                        handleSubtaskChange(
                          subtask.id,
                          "requiredCompleted",
                          !subtask.requiredCompleted
                        );
                      }}
                      className={`p-1 rounded-lg transition-colors ${
                        subtask.requiredCompleted
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      }`}
                      title={
                        subtask.requiredCompleted
                          ? "Remove required completion"
                          : "Mark as required completion"
                      }
                    >
                      <Lock size={14} />
                    </button>
                  </div>

                  {/* Description */}
                  <div>
                    <textarea
                      value={subtask.description || ""}
                      onChange={(e) => {
                        handleSubtaskChange(
                          subtask.id,
                          "description",
                          e.target.value
                        );
                      }}
                      className="w-full text-sm bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-400 resize-none"
                      placeholder="Add description..."
                      rows={2}
                      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                        const target = e.currentTarget;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                  </div>

                  {/* Linked Task Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Linked Task:
                      </span>
                    </div>

                    {linkedTask ? (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {linkedTask.title}
                          </div>
                          {linkedTask.description && (
                            <div className="text-xs text-blue-500 dark:text-blue-300 truncate">
                              {linkedTask.description.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {onTaskClick && (
                            <button
                              onClick={() => onTaskClick(linkedTask.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleClearEditingLinkedTask(subtask.id)
                            }
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center gap-2 p-2 border border-border-default rounded-lg">
                          <Search size={14} className="text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search and select a task to link..."
                            value={
                              editingTaskDropdown === subtask.id
                                ? editingSearchQuery
                                : ""
                            }
                            onChange={(e) =>
                              handleEditingTaskSearch(
                                subtask.id,
                                e.target.value
                              )
                            }
                            onFocus={() => setEditingTaskDropdown(subtask.id)}
                            className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-text-default"
                          />
                        </div>

                        {editingTaskDropdown === subtask.id && (
                          <div
                            ref={editingDropdownRef}
                            className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                          >
                            {filteredEditingTasks.length > 0 ? (
                              filteredEditingTasks.slice(0, 5).map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() =>
                                    handleEditingTaskSelect(subtask.id, task)
                                  }
                                  className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      task.priority === "urgent"
                                        ? "bg-red-500"
                                        : task.priority === "high"
                                        ? "bg-orange-500"
                                        : task.priority === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                  ></div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {task.title}
                                    </div>
                                    {task.description && (
                                      <div className="text-xs text-gray-500 truncate">
                                        {task.description.substring(0, 50)}...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No tasks found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors mt-1"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-2">
              📋
            </div>
            <p className="text-sm">
              No subtasks yet. Add your first subtask below!
            </p>
          </div>
        )}

        {/* New Subtask Form */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Add New Subtask
            </span>
          </div>

          {/* Title with Emoji */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                  newSubtaskForm.emoji
                    ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                    : "border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
                title="Add emoji"
              >
                {newSubtaskForm.emoji || (
                  <Smile size={14} className="text-gray-400" />
                )}
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border-default z-20 w-48">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Choose emoji:
                  </div>
                  <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto">
                    <button
                      onClick={() => handleEmojiSelect("")}
                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs border border-dashed"
                      title="No emoji"
                    >
                      <X size={8} />
                    </button>
                    {SUBTASK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="What needs to be done?"
              value={newSubtaskForm.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-border-default text-text-default focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <textarea
            placeholder="Add description..."
            value={newSubtaskForm.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            rows={2}
            className="w-full bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-border-default text-text-default focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
          />

          {/* Options */}
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() =>
                handleFormChange(
                  "requiredCompleted",
                  !newSubtaskForm.requiredCompleted
                )
              }
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                newSubtaskForm.requiredCompleted
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              }`}
            >
              <Lock size={12} />
              <span className="text-sm">Required</span>
            </button>
          </div>

          {/* Linked Task */}
          {getSelectedLinkedTask() ? (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {getSelectedLinkedTask()!.title}
                </div>
              </div>
              <button
                onClick={handleClearLinkedTask}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="relative mb-3">
              <div className="flex items-center gap-2 p-2 border border-border-default rounded-lg">
                <Search size={14} className="text-gray-400" />
                <input
                  ref={linkedTaskSearchRef}
                  type="text"
                  placeholder="Link to task..."
                  value={searchQuery}
                  onChange={(e) => handleLinkedTaskSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-text-default text-sm"
                />
              </div>

              {showTaskDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto"
                >
                  {filteredTasks.length > 0 ? (
                    filteredTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskSelect(task)}
                        className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <div className="text-sm font-medium">{task.title}</div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No tasks found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleEnhancedAddSubtask}
              disabled={!newSubtaskForm.title.trim()}
              className="flex items-center gap-2 bg-button-bg hover:bg-button-bgHover disabled:bg-gray-400 disabled:cursor-not-allowed text-button-bgText px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
            <button
              onClick={() => {
                setNewSubtaskForm({
                  title: "",
                  description: "",
                  linkedTaskId: null,
                  requiredCompleted: false,
                  emoji: "",
                });
                setSearchQuery("");
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtasksSection;
