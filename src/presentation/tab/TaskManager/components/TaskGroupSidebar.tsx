// src/presentation/components/TaskManager/TaskGroupSidebar.tsx
// Updated with hover actions, fixed height to match header, and group management

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Smile,
  BookmarkIcon,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import CustomDropdown, {
  DropdownOption,
} from "../../../components/common/CustomDropdown";
import EmojiPicker from "./EmojiPicker";

interface TaskGroup {
  id: string;
  title: string;
}

interface SidebarProps {
  groups: TaskGroup[];
  activeGroup: string;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  // Add Google Tasks API props
  getFreshToken?: () => Promise<string>;
  createGoogleTaskList?: (token: string, listName: string) => Promise<any>;
  // Add optional group management props
  onRenameGroup?: (id: string, newName: string) => Promise<void>;
  onDeleteGroup?: (id: string) => Promise<void>;
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
  onConfirm: (name: string) => Promise<void>;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
      setIsCreating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedName = groupName.trim();
    if (trimmedName && !isCreating) {
      setIsCreating(true);
      try {
        const fullName = selectedEmoji
          ? `${selectedEmoji} ${trimmedName}`
          : trimmedName;
        await onConfirm(fullName);
        onClose();
      } catch (error) {
        console.error("Error creating group:", error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
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
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookmarkIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              New Bookmark
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bookmark Name
              </label>

              <div className="relative">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
                  {/* Emoji Button */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={isCreating}
                      className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 disabled:opacity-50 ${
                        selectedEmoji
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                      title="Add emoji"
                    >
                      {selectedEmoji || <Smile className="w-3.5 h-3.5" />}
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && !isCreating && (
                      <div className="absolute top-full left-0 mt-2 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 w-72">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Choose an emoji:
                        </div>
                        <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                          {EMOJI_SUGGESTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clear Emoji Button */}
                  {selectedEmoji && !isCreating && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmoji("")}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title="Clear emoji"
                    >
                      <X className="w-3.5 h-3.5" />
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
                    disabled={isCreating}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none disabled:opacity-50 text-sm"
                  />
                </div>

                {/* Preview */}
                {(selectedEmoji || groupName) && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Preview:</span>
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium">
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
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors font-medium text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || isCreating}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-xs ${
              groupName.trim() && !isCreating
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md shadow-blue-500/25"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

const RenameGroupDialog: React.FC<{
  isOpen: boolean;
  group: TaskGroup | null;
  onClose: () => void;
  onConfirm: (id: string, newName: string) => Promise<void>;
}> = ({ isOpen, group, onClose, onConfirm }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Parse existing emoji and name
  useEffect(() => {
    if (isOpen && group) {
      const title = group.title;
      const emojiMatch = title.match(/^(\p{Emoji})\s*/u);
      if (emojiMatch) {
        setSelectedEmoji(emojiMatch[1]);
        setGroupName(title.slice(emojiMatch[0].length));
      } else {
        setSelectedEmoji("");
        setGroupName(title);
      }
      setShowEmojiPicker(false);
      setIsUpdating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, group]);

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

  const handleSubmit = async () => {
    const trimmedName = groupName.trim();
    if (trimmedName && !isUpdating && group) {
      setIsUpdating(true);
      try {
        const fullName = selectedEmoji
          ? `${selectedEmoji} ${trimmedName}`
          : trimmedName;
        await onConfirm(group.id, fullName);
        onClose();
      } catch (error) {
        console.error("Error renaming group:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isUpdating) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Backspace" && !groupName && selectedEmoji) {
      setSelectedEmoji("");
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Edit className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rename Bookmark
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bookmark Name
              </label>

              <div className="relative">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200">
                  {/* Emoji Picker */}
                  <EmojiPicker
                    value={selectedEmoji || "😀"}
                    onChange={(emoji) => setSelectedEmoji(emoji)}
                  />

                  {/* Clear Emoji Button */}
                  {selectedEmoji && !isUpdating && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmoji("")}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title="Clear emoji"
                    >
                      <X className="w-3.5 h-3.5" />
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
                    disabled={isUpdating}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none disabled:opacity-50 text-sm"
                  />
                </div>

                {/* Preview */}
                {(selectedEmoji || groupName) && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Preview:</span>
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium">
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
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors font-medium text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || isUpdating}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-xs ${
              groupName.trim() && !isUpdating
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/25"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupItem: React.FC<{
  group: TaskGroup;
  isActive: boolean;
  onSelect: () => void;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}> = ({ group, isActive, onSelect, onRename, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownOptions: DropdownOption[] = [
    {
      value: "rename",
      label: "Rename",
      icon: <Edit className="w-3.5 h-3.5" />,
      disabled: !onRename,
    },
    {
      value: "delete",
      label: "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
      disabled: !onDelete,
    },
  ];

  const handleDropdownSelect = (action: string) => {
    if (action === "rename" && onRename) {
      // This would trigger a rename dialog in the parent
      onRename(group.id, group.title);
    } else if (action === "delete" && onDelete) {
      if (
        window.confirm(
          `Are you sure you want to delete "${group.title}"? This action cannot be undone.`
        )
      ) {
        onDelete(group.id);
      }
    }
    setShowDropdown(false);
  };

  return (
    <div
      className={`relative group ${isActive ? "z-10" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onSelect}
        className={`w-full text-left px-2.5 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25 transform scale-[1.01]"
            : "text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2 pr-6">
          <div
            className={`w-1 h-1 rounded-full transition-all duration-200 ${
              isActive ? "bg-white" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
          <span className="truncate">{group.title}</span>
        </div>
      </button>

      {/* Hover Action Button */}
      {isHovered && (onRename || onDelete) && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className={`p-1 rounded-md transition-all duration-200 ${
              isActive
                ? "hover:bg-white/20 text-white/80 hover:text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <CustomDropdown
              options={dropdownOptions}
              onSelect={handleDropdownSelect}
              className="absolute top-0 right-full mr-1"
              align="right"
              width="w-28"
            />
          )}
        </div>
      )}
    </div>
  );
};

const TaskGroupSidebar: React.FC<SidebarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}) => {
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [groupToRename, setGroupToRename] = useState<TaskGroup | null>(null);

  const handleCreateGroup = async (name: string) => {
    try {
      await onCreateGroup(name);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleRenameGroup = async (id: string) => {
    if (onRenameGroup) {
      const group = groups.find((g) => g.id === id);
      if (group) {
        setGroupToRename(group);
        setShowRenameDialog(true);
      }
    }
  };

  const handleRenameConfirm = async (id: string, newName: string) => {
    if (onRenameGroup) {
      try {
        await onRenameGroup(id, newName);
      } catch (error) {
        console.error("Error renaming group:", error);
      }
    }
  };

  return (
    <>
      <div className="w-64 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/90 border-r border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm flex flex-col h-screen">
        {/* Header - Fixed to match TaskHeader height (72px) */}
        <div
          className="p-3 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center"
          style={{ height: "72px" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <BookmarkIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Flex Bookmark
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {groups.length} bookmarks
              </p>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-2.5">
          {groups.length > 0 ? (
            <div className="space-y-1">
              {groups.map((group) => (
                <GroupItem
                  key={group.id}
                  group={group}
                  isActive={activeGroup === group.id}
                  onSelect={() => onSelectGroup(group.id)}
                  onRename={onRenameGroup ? handleRenameGroup : undefined}
                  onDelete={onDeleteGroup}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full mb-2">
                <BookmarkIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium mb-1">No bookmarks yet</p>
              <p className="text-xs">Create your first bookmark below</p>
            </div>
          )}
        </div>

        {/* New Group Button */}
        <div className="p-2.5 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50">
          <button
            onClick={() => setShowNewGroupDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm"
          >
            <div className="w-3.5 h-3.5 bg-white/20 rounded-md flex items-center justify-center">
              <Plus className="w-2.5 h-2.5" />
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

      {/* Rename Group Dialog */}
      <RenameGroupDialog
        isOpen={showRenameDialog}
        group={groupToRename}
        onClose={() => {
          setShowRenameDialog(false);
          setGroupToRename(null);
        }}
        onConfirm={handleRenameConfirm}
      />
    </>
  );
};

export default TaskGroupSidebar;
