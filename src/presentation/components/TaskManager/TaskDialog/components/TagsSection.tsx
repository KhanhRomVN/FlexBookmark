import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Smile } from "lucide-react";
import { Task } from "../../../../types/task";

interface TagsSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: (tagToAdd?: string) => void;
  handleDeleteTag: (tag: string) => void;
}

// Common emojis for tags
const EMOJI_SUGGESTIONS = [
  "🏷️",
  "📝",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "📅",
  "⚡",
  "🚀",
  "💪",
  "🎉",
  "✅",
  "❤️",
  "🔴",
  "🟠",
  "🟡",
  "🟢",
  "🔵",
  "🟣",
  "⚫",
  "⚪",
  "🟤",
  "📊",
  "💻",
  "🏠",
  "💼",
  "🛒",
  "🍕",
  "🎮",
  "📚",
  "🎵",
  "🏃",
];

const TagsSection: React.FC<TagsSectionProps> = ({
  editedTask,
  handleChange,
  newTag,
  setNewTag,
  handleAddTag,
  handleDeleteTag,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleTagSubmit = () => {
    const trimmedTag = newTag.trim();

    if (trimmedTag) {
      const fullTag = selectedEmoji
        ? `${selectedEmoji} ${trimmedTag}`
        : trimmedTag;

      // Call the parent handler
      handleAddTag(fullTag);

      // Clear local state
      setSelectedEmoji("");
      setNewTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTagSubmit();
    } else if (e.key === "Backspace" && !newTag && selectedEmoji) {
      setSelectedEmoji("");
    }
  };

  const clearEmoji = () => {
    setSelectedEmoji("");
  };

  const handleDeleteTagWithLogging = (tag: string) => {
    handleDeleteTag(tag);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h4 className="font-medium text-gray-800 dark:text-gray-200">Tags</h4>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
        {editedTask?.tags?.length ? (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {editedTask.tags.length}
          </span>
        ) : null}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Debug: Tags array: {JSON.stringify(editedTask?.tags || [])}
        </div>
      )}

      {/* Tags Display */}
      {editedTask?.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {editedTask.tags.map((tag, index) => (
            <div
              key={`${tag}-${index}`}
              className="group relative flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-sm transition-all duration-200"
            >
              <span className="select-none">{tag}</span>
              <button
                onClick={() => handleDeleteTagWithLogging(tag)}
                className="opacity-0 group-hover:opacity-100 ml-1 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200 hover:scale-110"
                title="Remove tag"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-2">
            🏷️
          </div>
          <p className="text-sm">No tags yet. Add your first tag below!</p>
        </div>
      )}

      {/* Add Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
          {/* Emoji Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                selectedEmoji
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="Add emoji"
            >
              {selectedEmoji || <Smile size={16} />}
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 w-72">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Choose an emoji:
                </div>
                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Emoji Button */}
          {selectedEmoji && (
            <button
              type="button"
              onClick={clearEmoji}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              title="Clear emoji"
            >
              <X size={12} />
            </button>
          )}

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
          />

          {/* Add Button */}
          <button
            onClick={handleTagSubmit}
            disabled={!newTag.trim()}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
              newTag.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
            title="Add tag"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Preview */}
        {(selectedEmoji || newTag) && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Preview:</span>
            <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-sm">
              {selectedEmoji && <span>{selectedEmoji}</span>}
              <span>{newTag || "tag name"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsSection;
