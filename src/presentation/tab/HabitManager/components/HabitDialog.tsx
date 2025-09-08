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
  onReset?: () => void;
  isCreatingNew?: boolean;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  tags?: string;
  subtasks?: string;
}

const difficultyOptions = [
  { value: "1", label: "Very Easy", emoji: "😊" },
  { value: "2", label: "Easy", emoji: "😄" },
  { value: "3", label: "Medium", emoji: "😐" },
  { value: "4", label: "Hard", emoji: "😓" },
  { value: "5", label: "Very Hard", emoji: "😰" },
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

// Enhanced emoji options with categories
const emojiCategories = {
  health: {
    label: "Health & Wellness",
    emojis: [
      "💧",
      "🍎",
      "🥗",
      "🏥",
      "💊",
      "🧘",
      "💪",
      "🏃",
      "🚴",
      "🏊",
      "🧠",
      "❤️",
      "🫁",
      "🦷",
      "👁️",
      "🩺",
    ],
  },
  fitness: {
    label: "Fitness & Sports",
    emojis: [
      "🏃",
      "💪",
      "🏋️",
      "🚴",
      "🏊",
      "⚽",
      "🏀",
      "🎾",
      "🏐",
      "🏓",
      "🥊",
      "🤸",
      "🧗",
      "⛹️",
      "🏌️",
      "🤾",
    ],
  },
  productivity: {
    label: "Work & Productivity",
    emojis: [
      "💻",
      "📚",
      "📖",
      "✍️",
      "📝",
      "📊",
      "📈",
      "💼",
      "🎯",
      "⏰",
      "📱",
      "🖥️",
      "⌨️",
      "📞",
      "📧",
      "🗂️",
    ],
  },
  mindfulness: {
    label: "Mindfulness & Mental",
    emojis: [
      "🧘",
      "🌸",
      "🕯️",
      "☯️",
      "🧠",
      "💭",
      "🤔",
      "😌",
      "😊",
      "🙏",
      "🌅",
      "🌙",
      "⭐",
      "🌟",
      "✨",
      "🔮",
    ],
  },
  creativity: {
    label: "Creative & Arts",
    emojis: [
      "🎨",
      "🖌️",
      "✏️",
      "🎵",
      "🎼",
      "🎸",
      "🎹",
      "🎤",
      "📸",
      "🎭",
      "🎪",
      "🖼️",
      "📷",
      "🎬",
      "🎯",
      "🌈",
    ],
  },
  social: {
    label: "Social & Family",
    emojis: [
      "👥",
      "👨‍👩‍👧‍👦",
      "💑",
      "🤝",
      "🗣️",
      "💬",
      "📞",
      "🎉",
      "🥳",
      "🍽️",
      "☕",
      "🍵",
      "🎂",
      "🎁",
      "💌",
      "❤️",
    ],
  },
  finance: {
    label: "Money & Finance",
    emojis: [
      "💰",
      "💳",
      "💸",
      "💹",
      "📊",
      "📈",
      "💎",
      "🏦",
      "💵",
      "💴",
      "💶",
      "💷",
      "🪙",
      "💲",
      "🤑",
      "📱",
    ],
  },
  food: {
    label: "Food & Cooking",
    emojis: [
      "🍽️",
      "🍳",
      "🥘",
      "🍕",
      "🍔",
      "🥗",
      "🍎",
      "🥕",
      "🥦",
      "🍌",
      "🍓",
      "☕",
      "🧊",
      "🥛",
      "🍵",
      "🧑‍🍳",
    ],
  },
  nature: {
    label: "Nature & Environment",
    emojis: [
      "🌱",
      "🌿",
      "🌳",
      "🌸",
      "🌺",
      "🌻",
      "🌼",
      "🌷",
      "🍃",
      "🌲",
      "🌴",
      "🌊",
      "☀️",
      "🌙",
      "⭐",
      "🌍",
    ],
  },
  lifestyle: {
    label: "Lifestyle & Daily",
    emojis: [
      "🏠",
      "🛏️",
      "🚿",
      "🧴",
      "🧼",
      "🪥",
      "💤",
      "⏰",
      "📅",
      "🗓️",
      "✅",
      "❌",
      "🔔",
      "🔕",
      "📳",
      "🔄",
    ],
  },
  transportation: {
    label: "Travel & Transport",
    emojis: [
      "🚗",
      "🚌",
      "🚊",
      "🚇",
      "✈️",
      "🚲",
      "🛴",
      "🏃",
      "🚶",
      "🗺️",
      "🧳",
      "📍",
      "🌍",
      "🏖️",
      "🏔️",
      "🏙️",
    ],
  },
  entertainment: {
    label: "Fun & Entertainment",
    emojis: [
      "🎮",
      "🎲",
      "🎯",
      "🎪",
      "🎭",
      "🎬",
      "📺",
      "📻",
      "🎧",
      "🎤",
      "🎸",
      "🥳",
      "🎉",
      "🎊",
      "🎈",
      "🍿",
    ],
  },
};

// Validation constants
const VALIDATION_LIMITS = {
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  TAG_MAX_LENGTH: 20,
  SUBTASK_MAX_LENGTH: 100,
  MAX_TAGS: 10,
  MAX_SUBTASKS: 20,
};

const HabitDialog: React.FC<HabitDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingHabit,
  loading = false,
  formData,
  onFormChange,
  onReset,
  isCreatingNew = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] =
    useState<keyof typeof emojiCategories>("health");
  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
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

  // Updated useEffect to clear validation errors when tags/subtasks change
  useEffect(() => {
    const errors: ValidationErrors = { ...validationErrors };

    // Clear tags error if tags are within limit
    if (formData.tags && formData.tags.length <= VALIDATION_LIMITS.MAX_TAGS) {
      delete errors.tags;
    }
    // Clear subtasks error if subtasks are within limit
    if (
      formData.subtasks &&
      formData.subtasks.length <= VALIDATION_LIMITS.MAX_SUBTASKS
    ) {
      delete errors.subtasks;
    }
    setValidationErrors(errors);
  }, [formData.tags, formData.subtasks, validationErrors]);

  if (!isOpen) return null;

  // Validation functions
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      errors.name = "Habit name is required";
    } else if (formData.name.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.name = `Name must be ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters or less`;
    }

    // Description validation
    if (
      formData.description &&
      formData.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH
    ) {
      errors.description = `Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`;
    }

    // Tags validation
    if (formData.tags && formData.tags.length > VALIDATION_LIMITS.MAX_TAGS) {
      errors.tags = `Maximum ${VALIDATION_LIMITS.MAX_TAGS} tags allowed`;
    }

    // Subtasks validation
    if (
      formData.subtasks &&
      formData.subtasks.length > VALIDATION_LIMITS.MAX_SUBTASKS
    ) {
      errors.subtasks = `Maximum ${VALIDATION_LIMITS.MAX_SUBTASKS} subtasks allowed`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const updateFormData = (updates: Partial<HabitFormData>) => {
    onFormChange({ ...formData, ...updates });
    // Clear related validation errors
    if (updates.name !== undefined && validationErrors.name) {
      setValidationErrors((prev) => ({ ...prev, name: undefined }));
    }
    if (updates.description !== undefined && validationErrors.description) {
      setValidationErrors((prev) => ({ ...prev, description: undefined }));
    }
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

  // Updated handleAddTag function to clear errors when adding successfully
  const handleAddTag = () => {
    if (!newTag.trim()) return;

    if (newTag.length > VALIDATION_LIMITS.TAG_MAX_LENGTH) {
      setValidationErrors((prev) => ({
        ...prev,
        tags: `Tag must be ${VALIDATION_LIMITS.TAG_MAX_LENGTH} characters or less`,
      }));
      return;
    }

    if ((formData.tags || []).length >= VALIDATION_LIMITS.MAX_TAGS) {
      setValidationErrors((prev) => ({
        ...prev,
        tags: `Maximum ${VALIDATION_LIMITS.MAX_TAGS} tags allowed`,
      }));
      return;
    }

    const newTags = [...(formData.tags || []), newTag.trim()];
    updateFormData({ tags: newTags });
    setNewTag("");

    // Clear any existing tag errors after successful addition
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.tags;
      return newErrors;
    });
  };

  const handleRemoveTag = (index: number) => {
    const newTags = formData.tags?.filter((_, i) => i !== index) || [];
    updateFormData({ tags: newTags });
    setValidationErrors((prev) => ({ ...prev, tags: undefined }));
  };

  // Updated handleAddSubtask function to clear errors when adding successfully
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    if (newSubtask.length > VALIDATION_LIMITS.SUBTASK_MAX_LENGTH) {
      setValidationErrors((prev) => ({
        ...prev,
        subtasks: `Subtask must be ${VALIDATION_LIMITS.SUBTASK_MAX_LENGTH} characters or less`,
      }));
      return;
    }

    if ((formData.subtasks || []).length >= VALIDATION_LIMITS.MAX_SUBTASKS) {
      setValidationErrors((prev) => ({
        ...prev,
        subtasks: `Maximum ${VALIDATION_LIMITS.MAX_SUBTASKS} subtasks allowed`,
      }));
      return;
    }

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

    // Clear any existing subtask errors after successful addition
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.subtasks;
      return newErrors;
    });
  };

  const handleRemoveSubtask = (id: string) => {
    const newSubtasks = formData.subtasks?.filter((st) => st.id !== id) || [];
    updateFormData({ subtasks: newSubtasks });
    setValidationErrors((prev) => ({ ...prev, subtasks: undefined }));
  };

  const handleToggleSubtask = (id: string) => {
    const currentSubtasks = formData.subtasks || [];
    const newSubtasks = currentSubtasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    updateFormData({ subtasks: newSubtasks });
  };

  const handleUpdateSubtaskTitle = (id: string, title: string) => {
    if (title.length > VALIDATION_LIMITS.SUBTASK_MAX_LENGTH) return;

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
              {/* Enhanced Emoji Picker */}
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
                  <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden">
                    {/* Tab Menu */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="flex overflow-x-auto scrollbar-hide">
                        {Object.entries(emojiCategories).map(
                          ([key, category]) => (
                            <button
                              key={key}
                              onClick={() =>
                                setActiveEmojiTab(
                                  key as keyof typeof emojiCategories
                                )
                              }
                              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                                activeEmojiTab === key
                                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {category.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Emoji Grid */}
                    <div className="p-3 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-1">
                        {emojiCategories[activeEmojiTab].emojis.map(
                          (emoji, index) => (
                            <button
                              key={`${activeEmojiTab}-${index}`}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 hover:scale-110"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Quick Search */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        💡 Tip: Click any emoji to select it for your habit
                      </div>
                    </div>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= VALIDATION_LIMITS.NAME_MAX_LENGTH) {
                      updateFormData({ name: value });
                    }
                  }}
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                             validationErrors.name
                               ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                               : "border-gray-200 dark:border-gray-600"
                           }`}
                  placeholder="e.g., Drink 2 liters of water daily"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  {validationErrors.name && (
                    <span className="text-sm text-red-500">
                      {validationErrors.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formData.name.length}/{VALIDATION_LIMITS.NAME_MAX_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <CustomTextArea
                value={formData.description || ""}
                onChange={(value) => {
                  if (
                    value.length <= VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH
                  ) {
                    updateFormData({ description: value });
                  }
                }}
                placeholder="Describe your habit in detail..."
                rows={3}
                className={
                  validationErrors.description
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }
              />
              <div className="flex justify-between items-center mt-1">
                {validationErrors.description && (
                  <span className="text-sm text-red-500">
                    {validationErrors.description}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {(formData.description || "").length}/
                  {VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Habit Type - Fixed to use searchable=false */}
              <CustomCombobox
                label="Habit Type"
                value={formData.habitType || ""}
                options={[
                  { value: "good", label: "✅ Good Habit (to maintain)" },
                  { value: "bad", label: "⛔ Bad Habit (to limit)" },
                ]}
                onChange={(value) =>
                  updateFormData({ habitType: value as HabitType })
                }
                searchable={false}
                placeholder="Select habit type..."
              />

              {/* Difficulty Level - Fixed to use searchable=false */}
              <CustomCombobox
                label="Difficulty Level"
                value={formData.difficultyLevel?.toString() || ""}
                options={difficultyOptions.map((opt) => ({
                  value: opt.value,
                  label: `${opt.emoji} ${opt.label}`,
                }))}
                onChange={(value) =>
                  updateFormData({
                    difficultyLevel: parseInt(value) as DifficultyLevel,
                  })
                }
                searchable={false}
                placeholder="Select difficulty level..."
              />

              {/* Category - Fixed to not have default value */}
              <CustomCombobox
                label="Category"
                value={formData.category || ""}
                options={categoryOptions}
                onChange={(value) =>
                  updateFormData({
                    category: value as HabitCategory,
                  })
                }
                creatable
                placeholder="Select or create category..."
              />

              {/* Unit */}
              <CustomCombobox
                label="Measurement Unit"
                value={formData.unit || ""}
                options={unitOptions}
                onChange={(value) => updateFormData({ unit: value })}
                creatable
                placeholder="Select or create unit..."
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
                max="9999"
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
              <div className="flex-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => {
                    if (
                      e.target.value.length <= VALIDATION_LIMITS.TAG_MAX_LENGTH
                    ) {
                      setNewTag(e.target.value);
                      if (validationErrors.tags) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          tags: undefined,
                        }));
                      }
                    }
                  }}
                  placeholder="Add a tag..."
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.tags
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag();
                    }
                  }}
                />
                {validationErrors.tags && (
                  <span className="text-sm text-red-500 mt-1 block">
                    {validationErrors.tags}
                  </span>
                )}
              </div>
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
                    maxLength={VALIDATION_LIMITS.SUBTASK_MAX_LENGTH}
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
              <div className="flex-1">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => {
                    if (
                      e.target.value.length <=
                      VALIDATION_LIMITS.SUBTASK_MAX_LENGTH
                    ) {
                      setNewSubtask(e.target.value);
                      if (validationErrors.subtasks) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          subtasks: undefined,
                        }));
                      }
                    }
                  }}
                  placeholder="Add a subtask..."
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.subtasks
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSubtask();
                    }
                  }}
                />
                {validationErrors.subtasks && (
                  <span className="text-sm text-red-500 mt-1 block">
                    {validationErrors.subtasks}
                  </span>
                )}
              </div>
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

        {/* Footer - Fixed alignment */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex-shrink-0">
          {isCreatingNew && formData.name.trim() && onReset && (
            <button
              onClick={onReset}
              className="px-5 py-2.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 
                       transition-all duration-200 rounded-lg font-medium"
            >
              Clear Form
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 
                     transition-all duration-200 rounded-lg font-medium"
          >
            {isCreatingNew ? "Close" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.name?.trim() ||
              Object.keys(validationErrors).length > 0
            }
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 
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
