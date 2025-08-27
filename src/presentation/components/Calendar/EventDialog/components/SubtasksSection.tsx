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
import { Subtask, CalendarEvent } from "../../../../types/calendar";

interface SubtasksSectionProps {
  editedEvent: CalendarEvent;
  newSubtask: string;
  setNewSubtask: React.Dispatch<React.SetStateAction<string>>;
  handleSubtaskChange: (id: string, field: keyof Subtask, value: any) => void;
  handleAddSubtask: (subtaskData?: Partial<Subtask>) => void;
  handleDeleteSubtask: (id: string) => void;
  availableTasks?: CalendarEvent[];
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
  editedEvent,
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
    editedEvent.subtasks && editedEvent.subtasks.length > 0
      ? Math.round(
          (editedEvent.subtasks.filter((st) => st.completed).length /
            editedEvent.subtasks.length) *
            100
        )
      : 0;

  // Filter available events/tasks
  const filteredTasks = availableTasks.filter(
    (event) =>
      event.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEditingTasks = availableTasks.filter(
    (event) =>
      event.summary.toLowerCase().includes(editingSearchQuery.toLowerCase()) ||
      event.description
        ?.toLowerCase()
        .includes(editingSearchQuery.toLowerCase())
  );

  // Check if linked event/task is confirmed
  const isLinkedTaskCompleted = (linkedTaskId?: string): boolean => {
    if (!linkedTaskId) return false;
    const linkedTask = availableTasks.find(
      (event) => event.id === linkedTaskId
    );
    return linkedTask?.status === "confirmed";
  };

  // Handle subtask completion with validation
  const handleSubtaskCompletion = (subtask: Subtask, completed: boolean) => {
    if (completed && subtask.requiredCompleted && subtask.linkedTaskId) {
      const linkedTaskCompleted = isLinkedTaskCompleted(subtask.linkedTaskId);
      if (!linkedTaskCompleted) {
        alert(
          "Cannot complete this subtask until the linked event is confirmed."
        );
        return;
      }
    }
    handleSubtaskChange(subtask.id, "completed", completed);
  };

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
      editedEvent.subtasks?.find((st) => st.id === subtaskId)?.title || "";
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

  const handleTaskSelect = (event: CalendarEvent) => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: event.id }));
    setSearchQuery(event.summary);
    setShowTaskDropdown(false);
  };

  const handleClearLinkedTask = () => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: null }));
    setSearchQuery("");
  };

  const handleEnhancedAddSubtask = () => {
    if (!newSubtaskForm.title.trim()) {
      console.warn("⚠️ No title in form");
      return;
    }

    const fullTitle = newSubtaskForm.emoji
      ? `${newSubtaskForm.emoji} ${newSubtaskForm.title.trim()}`
      : newSubtaskForm.title.trim();

    handleAddSubtask({
      title: fullTitle,
      description: newSubtaskForm.description,
      linkedTaskId: newSubtaskForm.linkedTaskId,
      requiredCompleted: newSubtaskForm.requiredCompleted,
    });

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

  const handleEditingTaskSelect = (subtaskId: string, event: CalendarEvent) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", event.id);
    setEditingTaskDropdown(null);
    setEditingSearchQuery("");
  };

  const handleClearEditingLinkedTask = (subtaskId: string) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", undefined);
    setEditingSearchQuery("");
  };

  const getLinkedTask = (linkedTaskId?: string) => {
    if (!linkedTaskId) return null;
    return availableTasks.find((event) => event.id === linkedTaskId);
  };

  const getSelectedLinkedTask = () => {
    if (!newSubtaskForm.linkedTaskId) return null;
    return availableTasks.find(
      (event) => event.id === newSubtaskForm.linkedTaskId
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Subtasks
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
        </div>
        {(editedEvent.subtasks?.length ?? 0) > 0 && (
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
      <div className="space-y-2">
        {editedEvent.subtasks && editedEvent.subtasks.length > 0 ? (
          editedEvent.subtasks.map((subtask) => {
            const linkedTask = getLinkedTask(subtask.linkedTaskId);
            const { emoji, titleWithoutEmoji } = extractEmoji(subtask.title);
            const linkedTaskCompleted = isLinkedTaskCompleted(
              subtask.linkedTaskId
            );

            return (
              <div
                key={subtask.id}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all duration-200 group"
              >
                {/* Checkbox with required indicator */}
                <div className="flex flex-col items-center gap-1 mt-0.5">
                  <button
                    onClick={() =>
                      handleSubtaskCompletion(subtask, !subtask.completed)
                    }
                    disabled={
                      subtask.requiredCompleted &&
                      subtask.linkedTaskId &&
                      !linkedTaskCompleted
                    }
                    className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      subtask.completed
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                        : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                    } ${
                      subtask.requiredCompleted &&
                      subtask.linkedTaskId &&
                      !linkedTaskCompleted
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {subtask.completed && <Check size={14} />}
                  </button>
                  {subtask.requiredCompleted && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Lock size={10} />
                      <span>Required</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 min-w-0">
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
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-48">
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
                      className={`flex-1 bg-transparent border-none focus:ring-0 font-medium text-sm transition-all truncate ${
                        subtask.completed
                          ? "text-gray-500 dark:text-gray-400 line-through"
                          : "text-gray-900 dark:text-gray-100"
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
                      className={`p-1 rounded transition-colors ${
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
                      rows={1}
                      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                        const target = e.currentTarget;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                    />
                  </div>

                  {/* Linked Event Section */}
                  {subtask.linkedTaskId && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Link size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Linked Event:
                        </span>
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            linkedTaskCompleted
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              linkedTaskCompleted
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {linkedTaskCompleted ? "Confirmed" : "Not Confirmed"}
                        </div>
                      </div>

                      {linkedTask ? (
                        <div className="flex items-center gap-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                              {linkedTask.summary}
                            </div>
                            {linkedTask.description && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                {linkedTask.description}
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
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Linked event not found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Linked Event Input */}
                  {!subtask.linkedTaskId && (
                    <div className="relative mt-2">
                      <div className="flex items-center gap-2 p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
                        <Search
                          size={12}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <input
                          type="text"
                          placeholder="Link to event..."
                          value={
                            editingTaskDropdown === subtask.id
                              ? editingSearchQuery
                              : ""
                          }
                          onChange={(e) =>
                            handleEditingTaskSearch(subtask.id, e.target.value)
                          }
                          onFocus={() => setEditingTaskDropdown(subtask.id)}
                          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 min-w-0"
                        />
                      </div>

                      {editingTaskDropdown === subtask.id && (
                        <div
                          ref={editingDropdownRef}
                          className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                        >
                          {filteredEditingTasks.length > 0 ? (
                            filteredEditingTasks.slice(0, 5).map((event) => (
                              <div
                                key={event.id}
                                onClick={() =>
                                  handleEditingTaskSelect(subtask.id, event)
                                }
                                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    event.priority === "urgent"
                                      ? "bg-red-500"
                                      : event.priority === "high"
                                      ? "bg-orange-500"
                                      : event.priority === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                ></div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {event.summary}
                                  </div>
                                  {event.description && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {event.description.substring(0, 50)}...
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No events found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors mt-0.5"
                >
                  <X size={14} />
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
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Plus size={14} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Add New Subtask
            </span>
          </div>

          {/* Title with Emoji */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-6 h-6 rounded flex items-center justify-center text-sm transition-colors ${
                  newSubtaskForm.emoji
                    ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                    : "border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
                title="Add emoji"
              >
                {newSubtaskForm.emoji || (
                  <Smile size={12} className="text-gray-400" />
                )}
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-48">
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
              className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Description */}
          <textarea
            placeholder="Add description..."
            value={newSubtaskForm.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            rows={1}
            className="w-full bg-white dark:bg-gray-700 rounded-lg px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2 text-sm"
          />

          {/* Options */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() =>
                handleFormChange(
                  "requiredCompleted",
                  !newSubtaskForm.requiredCompleted
                )
              }
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs ${
                newSubtaskForm.requiredCompleted
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              }`}
            >
              <Lock size={12} />
              <span>Required</span>
            </button>
          </div>

          {/* Linked Event */}
          {getSelectedLinkedTask() ? (
            <div className="flex items-center gap-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                  {getSelectedLinkedTask()!.summary}
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
            <div className="relative mb-2">
              <div className="flex items-center gap-2 p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700">
                <Search size={12} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={linkedTaskSearchRef}
                  type="text"
                  placeholder="Link to event..."
                  value={searchQuery}
                  onChange={(e) => handleLinkedTaskSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 text-sm min-w-0"
                />
              </div>

              {showTaskDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto"
                >
                  {filteredTasks.length > 0 ? (
                    filteredTasks.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleTaskSelect(event)}
                        className="px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      >
                        <div className="font-medium truncate">
                          {event.summary}
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No events found
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
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={14} />
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
              className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
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
