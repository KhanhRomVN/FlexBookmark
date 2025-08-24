// src/presentation/components/TaskManager/TaskGroupSidebar.tsx

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Smile, BookmarkIcon } from "lucide-react";

interface TaskGroup {
  id: string;
  title: string;
}

interface SidebarProps {
  groups: TaskGroup[];
  activeGroup: string;
  onSelectGroup: (id: string) => void;
  onCreateGroup: () => void;
}

// Common emojis for group names
const EMOJI_SUGGESTIONS = [
  "📚",
  "💼",
  "🏠",
  "🛒",
  "💡",
  "🎯",
  "📊",
  "💻",
  "🎨",
  "🎵",
  "🏃",
  "🍕",
  "🎮",
  "📝",
  "⭐",
  "🔥",
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
  "📅",
  "⚡",
];

const NewGroupDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setSelectedEmoji("");
      setShowEmojiPicker(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmedName = groupName.trim();
    if (trimmedName) {
      const fullName = selectedEmoji
        ? `${selectedEmoji} ${trimmedName}`
        : trimmedName;
      onConfirm(fullName);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Backspace" && !groupName && selectedEmoji) {
      setSelectedEmoji("");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              New Bookmark
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Bookmark Name
              </label>

              <div className="relative">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
                  {/* Emoji Button */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                        selectedEmoji
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                      title="Add emoji"
                    >
                      {selectedEmoji || <Smile className="w-5 h-5" />}
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 w-80">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
                          Choose an emoji:
                        </div>
                        <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                          {EMOJI_SUGGESTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-lg"
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
                      onClick={() => setSelectedEmoji("")}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title="Clear emoji"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter bookmark name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  />
                </div>

                {/* Preview */}
                {(selectedEmoji || groupName) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Preview:</span>
                    <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg font-medium">
                      {selectedEmoji && <span>{selectedEmoji}</span>}
                      <span>{groupName || "bookmark name"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              groupName.trim()
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskGroupSidebar: React.FC<SidebarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onCreateGroup,
}) => {
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

  const handleCreateGroup = (name: string) => {
    // You'll need to update the parent component to handle the name parameter
    console.log("Creating group with name:", name);
    onCreateGroup();
  };

  return (
    <>
      <div className="w-64 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/90 border-r border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <BookmarkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Flex Bookmark
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {groups.length} bookmarks
              </p>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-3">
          {groups.length > 0 ? (
            <div className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeGroup === group.id
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        activeGroup === group.id
                          ? "bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                    <span className="truncate">{group.title}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <BookmarkIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium mb-1">No bookmarks yet</p>
              <p className="text-xs">Create your first bookmark below</p>
            </div>
          )}
        </div>

        {/* New Group Button - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50">
          <button
            onClick={() => setShowNewGroupDialog(true)}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </div>
            <span>New Bookmark</span>
          </button>
        </div>
      </div>

      {/* New Group Dialog */}
      <NewGroupDialog
        isOpen={showNewGroupDialog}
        onClose={() => setShowNewGroupDialog(false)}
        onConfirm={handleCreateGroup}
      />
    </>
  );
};

export default TaskGroupSidebar;
