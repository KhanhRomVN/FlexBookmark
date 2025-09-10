import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Plus, Trash2, AlertTriangle, Smile } from "lucide-react";
import { Task } from "../../../types/task";

interface CollectionSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  availableTasks: Task[];
}

// Common emojis for collections
const EMOJI_SUGGESTIONS = [
  "📁",
  "📂",
  "🗂️",
  "📋",
  "📊",
  "📝",
  "💼",
  "🏠",
  "🏢",
  "💻",
  "🎯",
  "📅",
  "⭐",
  "🔥",
  "💡",
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
  "🛒",
  "🍕",
  "🎮",
  "📚",
  "🎵",
  "🏃",
];

const CollectionSection: React.FC<CollectionSectionProps> = ({
  editedTask,
  handleChange,
  availableTasks,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Get all existing collections from available tasks
  const allCollections = useMemo(() => {
    const setCols = new Set<string>();
    availableTasks.forEach((task) => {
      if (task.collection) {
        setCols.add(task.collection);
      }
    });
    // Add current task's collection if it exists
    if (editedTask.collection) {
      setCols.add(editedTask.collection);
    }
    return Array.from(setCols).sort();
  }, [availableTasks, editedTask.collection]);

  // Filter collections based on search term
  const filteredCollections = useMemo(() => {
    if (!searchTerm) return allCollections;
    return allCollections.filter((collection) =>
      collection.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCollections, searchTerm]);

  // Check if a collection is used by other tasks
  const isCollectionUsedByOthers = (collection: string): boolean => {
    return availableTasks.some(
      (task) => task.collection === collection && task.id !== editedTask.id
    );
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchTerm("");
        setSelectedEmoji("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const clearEmoji = () => {
    setSelectedEmoji("");
  };

  const handleCollectionSelect = (collection: string) => {
    handleChange("collection", collection);
    setShowSearch(false);
    setSearchTerm("");
    setSelectedEmoji("");
  };

  const handleCreateCollection = () => {
    const trimmedName = searchTerm.trim();
    if (trimmedName) {
      const fullCollectionName = selectedEmoji
        ? `${selectedEmoji} ${trimmedName}`
        : trimmedName;

      handleChange("collection", fullCollectionName);
      setShowSearch(false);
      setSearchTerm("");
      setSelectedEmoji("");
    }
  };

  const handleRemoveCollection = () => {
    handleChange("collection", "");
  };

  const handleDeleteCollection = (collection: string) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCollection = () => {
    // Clear collection from current task if it uses the deleted collection
    if (editedTask.collection === collectionToDelete) {
      handleChange("collection", "");
    }
    setShowDeleteConfirm(false);
    setCollectionToDelete("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateCollection();
    } else if (e.key === "Backspace" && !searchTerm && selectedEmoji) {
      setSelectedEmoji("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-text-default">Collection</h4>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>

      <div className="relative" ref={searchContainerRef}>
        {editedTask.collection ? (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              {editedTask.collection}
            </span>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Change collection"
            >
              <Search size={16} />
            </button>
            <button
              onClick={handleRemoveCollection}
              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Remove collection"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full p-3 text-left bg-input-background hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg border border-border-default text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add to collection
          </button>
        )}

        {showSearch && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-10">
            {/* Search Input with Emoji Support */}
            <div className="p-2 border-b border-border-default">
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
                {/* Emoji Button */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      selectedEmoji
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    title="Add emoji"
                  >
                    {selectedEmoji || <Smile size={14} />}
                  </button>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 w-64">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Choose an emoji:
                      </div>
                      <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                        {EMOJI_SUGGESTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
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
                    className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    title="Clear emoji"
                  >
                    <X size={10} />
                  </button>
                )}

                {/* Search Icon */}
                <Search className="text-gray-400" size={16} />

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or create collection..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Preview */}
              {(selectedEmoji || searchTerm) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-2">
                  <span>Preview:</span>
                  <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-sm">
                    {selectedEmoji && <span>{selectedEmoji}</span>}
                    <span>{searchTerm || "collection name"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collections List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCollections.length > 0 ? (
                filteredCollections.map((collection) => (
                  <div
                    key={collection}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button
                      onClick={() => handleCollectionSelect(collection)}
                      className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                    >
                      {collection}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-60 hover:opacity-100 transition-all"
                      title="Delete collection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : searchTerm ? (
                <button
                  onClick={handleCreateCollection}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Create "
                  {selectedEmoji
                    ? `${selectedEmoji} ${searchTerm}`
                    : searchTerm}
                  "
                </button>
              ) : (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  No collections found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Collection
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete the collection{" "}
                <strong>"{collectionToDelete}"</strong>?
              </p>

              {isCollectionUsedByOthers(collectionToDelete) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ <strong>Warning:</strong> This collection is used by
                    other tasks. Deleting it will remove the collection from all
                    tasks.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> Collections are automatically removed
                  when not used by any tasks.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCollection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionSection;
