import React, { useState, useRef, useEffect } from "react";
import { Folder, Plus, X, Edit2, Check, Search, Smile } from "lucide-react";
import { Task } from "../../../../types/task";

interface FolderSectionProps {
  editedTask: Task;
  folders: { id: string; title: string; emoji: string }[];
  handleChange: (field: keyof Task, value: any) => void;
  onCreateFolder?: (folderName: string, emoji?: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string, emoji?: string) => void;
}

// Common emojis for folders (organized by categories)
const FOLDER_EMOJIS = [
  // Basic folders
  "📁",
  "📂",
  "🗂️",
  "📋",
  "📊",
  "📝",
  "📄",
  "📑",
  // Work & Business
  "💼",
  "🏢",
  "💻",
  "📱",
  "🔧",
  "⚙️",
  "📈",
  "💰",
  // Projects & Goals
  "🎯",
  "🚀",
  "⭐",
  "🔥",
  "💡",
  "🎨",
  "🏆",
  "⚡",
  // Personal & Life
  "🏠",
  "🎵",
  "📚",
  "🍕",
  "🎮",
  "✈️",
  "🌟",
  "❤️",
  // Categories
  "🌍",
  "🎪",
  "🎭",
  "🎬",
  "📷",
  "🔬",
  "🎓",
  "🏥",
];

const FolderSection: React.FC<FolderSectionProps> = ({
  editedTask,
  folders,
  handleChange,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📁");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderEmoji, setEditFolderEmoji] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowCreateForm(false);
        setSearchTerm("");
      }
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

  // Filter folders based on search term
  const filteredFolders = folders.filter((folder) =>
    folder.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFolder = folders.find((f) => f.id === editedTask.folder);

  const handleFolderSelect = (folderId: string) => {
    handleChange("folder", folderId);
    setShowDropdown(false);
    setSearchTerm("");

    // Add activity log entry if task has existing activity log
    if (editedTask.activityLog) {
      const selectedFolder = folders.find((f) => f.id === folderId);
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Moved to folder: "${selectedFolder?.title || "No Folder"}"`,
        action: "folder_changed",
        userId: "user",
        timestamp: now,
      };

      handleChange("activityLog", [...editedTask.activityLog, activityEntry]);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    if (onCreateFolder) {
      onCreateFolder(newFolderName.trim(), selectedEmoji);
    }

    setNewFolderName("");
    setSelectedEmoji("📁");
    setShowCreateForm(false);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleStartEdit = (folder: {
    id: string;
    title: string;
    emoji: string;
  }) => {
    setEditingFolder(folder.id);
    setEditFolderName(folder.title);
    setEditFolderEmoji(folder.emoji);
  };

  const handleSaveEdit = () => {
    if (!editFolderName.trim() || !editingFolder) return;

    if (onRenameFolder) {
      onRenameFolder(editingFolder, editFolderName.trim(), editFolderEmoji);
    }

    setEditingFolder(null);
    setEditFolderName("");
    setEditFolderEmoji("");
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditFolderName("");
    setEditFolderEmoji("");
  };

  const handleDeleteFolder = (folderId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this folder? Tasks in this folder will be moved to "No Folder".'
      )
    ) {
      if (onDeleteFolder) {
        onDeleteFolder(folderId);
      }

      // If the current task is in the deleted folder, clear the folder
      if (editedTask.folder === folderId) {
        handleChange("folder", "");
      }
    }
  };

  const EmojiPicker = ({
    onSelect,
    selectedEmoji: currentEmoji,
  }: {
    onSelect: (emoji: string) => void;
    selectedEmoji: string;
  }) => (
    <div className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 w-64 max-h-48 overflow-y-auto">
      <div className="grid grid-cols-10 gap-1">
        {FOLDER_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`w-6 h-6 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center ${
              currentEmoji === emoji ? "bg-blue-100 dark:bg-blue-900/20" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Folder className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Folder
        </span>
      </div>

      {/* Folder Selection Bar */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
        >
          {selectedFolder ? (
            <>
              <span className="text-lg">{selectedFolder.emoji}</span>
              <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-100">
                {selectedFolder.title}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg">📂</span>
              <span className="flex-1 text-left text-gray-500 dark:text-gray-400 italic">
                Select a folder...
              </span>
            </>
          )}
          <div className="w-5 h-5 text-gray-400">
            <svg
              className={`w-full h-full transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto">
              {/* No Folder Option */}
              <button
                onClick={() => handleFolderSelect("")}
                className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                  !editedTask.folder
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : ""
                }`}
              >
                <span className="text-lg">📂</span>
                <span className="font-medium">No Folder</span>
              </button>

              {/* Existing Folders */}
              {filteredFolders.map((folder) => (
                <div key={folder.id} className="relative group">
                  {editingFolder === folder.id ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPicker(!showEmojiPicker);
                            }}
                            className="text-lg hover:bg-gray-200 dark:hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center"
                          >
                            {editFolderEmoji}
                          </button>
                          {showEmojiPicker && (
                            <div
                              ref={emojiPickerRef}
                              className="absolute top-full left-0 mt-1"
                            >
                              <EmojiPicker
                                onSelect={(emoji) => {
                                  setEditFolderEmoji(emoji);
                                  setShowEmojiPicker(false);
                                }}
                                selectedEmoji={editFolderEmoji}
                              />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFolderSelect(folder.id)}
                      className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                        editedTask.folder === folder.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : ""
                      }`}
                    >
                      <span className="text-lg">{folder.emoji}</span>
                      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                        {folder.title}
                      </span>
                    </button>
                  )}

                  {/* Folder Actions */}
                  {editingFolder !== folder.id && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {onRenameFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(folder);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-800 rounded shadow"
                          title="Rename folder"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 bg-white dark:bg-gray-800 rounded shadow"
                          title="Delete folder"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* No Results */}
              {searchTerm && filteredFolders.length === 0 && (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  No folders found matching "{searchTerm}"
                </div>
              )}

              {/* Create New Folder */}
              {onCreateFolder && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  {showCreateForm ? (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPicker(!showEmojiPicker);
                            }}
                            className="text-lg hover:bg-gray-200 dark:hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center"
                          >
                            {selectedEmoji}
                          </button>
                          {showEmojiPicker && (
                            <div
                              ref={emojiPickerRef}
                              className="absolute top-full left-0 mt-1"
                            >
                              <EmojiPicker
                                onSelect={(emoji) => {
                                  setSelectedEmoji(emoji);
                                  setShowEmojiPicker(false);
                                }}
                                selectedEmoji={selectedEmoji}
                              />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Enter folder name..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFolder();
                            if (e.key === "Escape") {
                              setShowCreateForm(false);
                              setNewFolderName("");
                              setSelectedEmoji("📁");
                            }
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewFolderName("");
                            setSelectedEmoji("📁");
                          }}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim()}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateForm(true);
                        setSearchTerm("");
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Create New Folder</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderSection;
