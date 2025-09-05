import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Clock, Palette, Tag, ListChecks, Smile } from "lucide-react";
import type {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  DifficultyLevel,
  HabitSubtask,
} from "../types/types";
import CustomCombobox from "@/presentation/components/common/CustomCombobox";
import CustomTimePicker from "../../../components/common/CustomTimePicker";
import CustomTextArea from "../../../components/common/CustomTextArea";

interface HabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitFormData: HabitFormData) => Promise<void>;
  editingHabit?: Habit | null;
  loading?: boolean;
  formData: HabitFormData;
  onFormChange: (formData: HabitFormData) => void;
}

const difficultyOptions = [
  { value: 1, label: "Very Easy", emoji: "😊" },
  { value: 2, label: "Easy", emoji: "😄" },
  { value: 3, label: "Medium", emoji: "😐" },
  { value: 4, label: "Hard", emoji: "😓" },
  { value: 5, label: "Very Hard", emoji: "😰" },
];

const categoryOptions = [
  { value: "health", label: "Health" },
  { value: "fitness", label: "Fitness" },
  { value: "productivity", label: "Productivity" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "learning", label: "Learning" },
  { value: "social", label: "Social" },
  { value: "finance", label: "Finance" },
  { value: "creativity", label: "Creativity" },
  { value: "other", label: "Other" },
];

const unitOptions = [
  { value: "times", label: "times" },
  { value: "glasses", label: "glasses" },
  { value: "minutes", label: "minutes" },
  { value: "pages", label: "pages" },
  { value: "cups", label: "cups" },
  { value: "items", label: "items" },
  { value: "steps", label: "steps" },
  { value: "km", label: "kilometers" },
  { value: "miles", label: "miles" },
];

const colorOptions = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

const emojiOptions = [
  "💧",
  "🏃",
  "📚",
  "💤",
  "🍎",
  "💪",
  "🧘",
  "📱",
  "⚽",
  "🎮",
  "🎨",
  "🎵",
  "🚴",
  "🍽️",
  "💻",
  "🌱",
  "🎯",
  "⏰",
  "☕",
  "📖",
  "🎯",
  "💰",
  "🧠",
  "❤️",
  "🏆",
  "🎉",
  "🚫",
  "✅",
  "🌞",
  "🌙",
];

const HabitDialog: React.FC<HabitDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingHabit,
  loading = false,
  formData,
  onFormChange,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return;
    await onSubmit(formData);
  };

  const updateFormData = (updates: Partial<HabitFormData>) => {
    onFormChange({ ...formData, ...updates });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    updateFormData({ emoji });
    setShowEmojiPicker(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const newTags = [...(formData.tags || []), newTag.trim()];
      updateFormData({ tags: newTags });
      setNewTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = formData.tags?.filter((_, i) => i !== index) || [];
    updateFormData({ tags: newTags });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const newSubtasks: HabitSubtask[] = [
        ...(formData.subtasks || []),
        {
          id: Date.now().toString(),
          title: newSubtask.trim(),
          completed: false,
        },
      ];
      updateFormData({ subtasks: newSubtasks });
      setNewSubtask("");
    }
  };

  const handleRemoveSubtask = (id: string) => {
    const newSubtasks = formData.subtasks?.filter((st) => st.id !== id) || [];
    updateFormData({ subtasks: newSubtasks });
  };

  const handleToggleSubtask = (id: string) => {
    const currentSubtasks = formData.subtasks || [];
    const newSubtasks = currentSubtasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    updateFormData({ subtasks: newSubtasks });
  };

  const handleUpdateSubtaskTitle = (id: string, title: string) => {
    const newSubtasks =
      formData.subtasks?.map((st) => (st.id === id ? { ...st, title } : st)) ||
      [];
    updateFormData({ subtasks: newSubtasks });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingHabit ? "Edit Habit" : "Create New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-5 space-y-5">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Basic Information
            </h4>

            {/* Name and Emoji */}
            <div className="flex gap-3">
              {/* Emoji Picker */}
              <div className="relative flex-shrink-0" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center justify-center w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  {formData.emoji ? (
                    <span className="text-xl">{formData.emoji}</span>
                  ) : (
                    <Smile className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 grid grid-cols-6 gap-1 min-w-max">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Habit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="e.g., Drink 2 liters of water daily"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <CustomTextArea
                value={formData.description || ""}
                onChange={(value) => updateFormData({ description: value })}
                placeholder="Describe your habit in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Habit Type */}
              <CustomCombobox
                label="Habit Type"
                value={formData.habitType}
                options={[
                  { value: "good", label: "✅ Good Habit (to maintain)" },
                  { value: "bad", label: "⛔ Bad Habit (to limit)" },
                ]}
                onChange={(value) =>
                  updateFormData({ habitType: value as HabitType })
                }
              />

              {/* Difficulty Level */}
              <CustomCombobox
                label="Difficulty Level"
                value={formData.difficultyLevel.toString()}
                options={difficultyOptions.map((opt) => ({
                  value: opt.value.toString(),
                  label: `${opt.emoji} ${opt.label}`,
                }))}
                onChange={(value) =>
                  updateFormData({
                    difficultyLevel: parseInt(value) as DifficultyLevel,
                  })
                }
              />

              {/* Category */}
              <CustomCombobox
                label="Category"
                value={formData.category}
                options={categoryOptions}
                onChange={(value) =>
                  updateFormData({
                    category: value as HabitCategory,
                  })
                }
                creatable
              />

              {/* Unit */}
              <CustomCombobox
                label="Measurement Unit"
                value={formData.unit || ""}
                options={unitOptions}
                onChange={(value) => updateFormData({ unit: value })}
                creatable
              />
            </div>

            {/* Daily Target/Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.habitType === "good"
                  ? "🎯 Daily Target"
                  : "🚫 Daily Limit"}
              </label>
              <input
                type="number"
                min="0"
                value={
                  formData.habitType === "good"
                    ? formData.goal || ""
                    : formData.limit || ""
                }
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  if (formData.habitType === "good") {
                    updateFormData({ goal: value });
                  } else {
                    updateFormData({ limit: value });
                  }
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                         text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder={
                  formData.habitType === "good" ? "e.g., 2" : "e.g., 1"
                }
              />
            </div>
          </section>

          {/* Tags Section */}
          <section className="border-t border-gray-100 dark:border-gray-700 pt-5 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h4>

            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag();
                  }
                }}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </section>

          {/* Subtasks Section */}
          <section className="border-t border-gray-100 dark:border-gray-700 pt-5 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Subtasks
            </h4>

            <div className="space-y-2">
              {formData.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) =>
                      handleUpdateSubtaskTitle(subtask.id, e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSubtask();
                  }
                }}
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </section>

          {/* Advanced Options Section */}
          <section className="border-t border-gray-100 dark:border-gray-700 pt-5 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Advanced Options
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time
                </label>
                <CustomTimePicker
                  value={formData.startTime || ""}
                  onChange={(value) => updateFormData({ startTime: value })}
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateFormData({ colorCode: color })}
                        className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                          formData.colorCode === color
                            ? "border-white dark:border-gray-800 ring-2 ring-blue-500 scale-110"
                            : "border-gray-200 dark:border-gray-600 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) =>
                        updateFormData({ colorCode: e.target.value })
                      }
                      className="w-8 h-8 opacity-0 absolute cursor-pointer"
                    />
                    <div className="w-8 h-8 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 
                     transition-all duration-200 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name?.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 
                     text-white rounded-lg font-medium transition-all duration-200 
                     disabled:cursor-not-allowed disabled:text-gray-500
                     flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>{editingHabit ? "Update" : "Create"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitDialog;
