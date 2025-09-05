import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Clock, Palette, Type, Tag, ListChecks } from "lucide-react";
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
  { value: "health", label: "🏥 Health", emoji: "🏥" },
  { value: "fitness", label: "💪 Fitness", emoji: "💪" },
  { value: "productivity", label: "⚡ Productivity", emoji: "⚡" },
  { value: "mindfulness", label: "🧘 Mindfulness", emoji: "🧘" },
  { value: "learning", label: "📚 Learning", emoji: "📚" },
  { value: "social", label: "👥 Social", emoji: "👥" },
  { value: "finance", label: "💰 Finance", emoji: "💰" },
  { value: "creativity", label: "🎨 Creativity", emoji: "🎨" },
  { value: "other", label: "📌 Other", emoji: "📌" },
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
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [showCategoryEmojiPicker, setShowCategoryEmojiPicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const categoryEmojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        categoryEmojiPickerRef.current &&
        !categoryEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowCategoryEmojiPicker(false);
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
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    updateFormData({ name: `${emoji} ${formData.name || ""}`.trim() });
  };

  const handleCategoryEmojiSelect = (emoji: string) => {
    const categoryOption = categoryOptions.find((opt) => opt.emoji === emoji);
    if (categoryOption) {
      updateFormData({ category: categoryOption.value });
    }
    setShowCategoryEmojiPicker(false);
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
    const newSubtasks =
      formData.subtasks?.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      ) || [];
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingHabit ? "Edit Habit" : "Create New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Basic Information
            </h4>

            {/* Name with Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Habit Name <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {selectedEmoji || (
                      <Type className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1">
                      {[
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
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors
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

              {/* Category with Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <CustomCombobox
                      value={formData.category}
                      options={categoryOptions}
                      onChange={(value) =>
                        updateFormData({
                          category: value as HabitCategory,
                        })
                      }
                      creatable
                    />
                  </div>
                  <div className="relative" ref={categoryEmojiPickerRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCategoryEmojiPicker(!showCategoryEmojiPicker)
                      }
                      className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Type className="w-5 h-5 text-gray-400" />
                    </button>
                    {showCategoryEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1">
                        {categoryOptions.map(({ emoji }) => (
                          <button
                            key={emoji}
                            onClick={() => handleCategoryEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
              <div className="relative">
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors
                           text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder={
                    formData.habitType === "good" ? "e.g., 2" : "e.g., 1"
                  }
                />
              </div>
            </div>
          </section>

          {/* Tags Section */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags
            </h4>

            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
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
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag();
                  }
                }}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl text-sm"
              >
                Add
              </button>
            </div>
          </section>

          {/* Subtasks Section */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Subtasks
            </h4>

            <div className="space-y-2">
              {formData.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="rounded text-blue-500"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) =>
                      handleUpdateSubtaskTitle(subtask.id, e.target.value)
                    }
                    className="flex-1 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="text-red-500 hover:text-red-700 p-1"
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
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSubtask();
                  }
                }}
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl text-sm"
              >
                Add
              </button>
            </div>
          </section>

          {/* Advanced Options Section */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
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
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateFormData({ colorCode: color })}
                        className={`w-6 h-6 border-2 transition-transform ${
                          formData.colorCode === color
                            ? "border-white dark:border-gray-800 ring-2 ring-blue-500 scale-110"
                            : "border-gray-300 dark:border-gray-600 hover:scale-105"
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
                    <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 
                     transition-colors rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name?.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white rounded-xl font-medium transition-colors 
                     disabled:cursor-not-allowed disabled:text-gray-300
                     flex items-center gap-2 min-w-[140px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>{editingHabit ? "Update Habit" : "Create Habit"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitDialog;
