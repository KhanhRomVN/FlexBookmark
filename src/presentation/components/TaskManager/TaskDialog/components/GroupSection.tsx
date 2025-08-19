// src/presentation/components/TaskManager/TaskDialog/components/GroupSection.tsx
import React, { useState, useRef, useEffect } from "react";
import { Group, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Task } from "../../../../types/task";

interface GroupSectionProps {
  editedTask: Task;
  groups: { id: string; title: string; emoji: string }[];
  handleChange: (field: keyof Task, value: any) => void;
  onCreateGroup?: (groupName: string, emoji?: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  // Add these props to get task data for delete confirmation
  allTasks?: Task[];
}

// Common emojis for groups
const GROUP_EMOJIS = [
  "📁",
  "📂",
  "🗂️",
  "📋",
  "📊",
  "📝",
  "💼",
  "🏢",
  "💻",
  "🎯",
  "🚀",
  "⭐",
  "🔥",
  "💡",
  "🎨",
  "🏆",
  "🏠",
  "🎵",
  "📚",
  "🌟",
];

// Delete Confirmation Dialog Component
const DeleteGroupDialog: React.FC<{
  isOpen: boolean;
  groupName: string;
  affectedTasks: Task[];
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, groupName, affectedTasks, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Group
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the group{" "}
            <strong>"{groupName}"</strong>?
          </p>

          {affectedTasks.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                ⚠️ This group is currently used by {affectedTasks.length}{" "}
                task(s):
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {affectedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="text-sm text-amber-700 dark:text-amber-300 truncate"
                  >
                    • {task.title}
                  </div>
                ))}
                {affectedTasks.length > 5 && (
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    ... and {affectedTasks.length - 5} more tasks
                  </div>
                )}
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                These tasks will have their group removed (they won't be
                deleted).
              </p>
            </div>
          )}

          {affectedTasks.length === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ This group is not currently used by any tasks.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Group
          </button>
        </div>
      </div>
    </div>
  );
};

// Emoji Picker Component
const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  selectedEmoji: string;
}> = ({ onSelect, selectedEmoji }) => (
  <div className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 w-64 max-h-48 overflow-y-auto">
    <div className="grid grid-cols-10 gap-1">
      {GROUP_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-6 h-6 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center ${
            selectedEmoji === emoji ? "bg-blue-100 dark:bg-blue-900/20" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

const GroupSection: React.FC<GroupSectionProps> = ({
  editedTask,
  groups,
  handleChange,
  onCreateGroup,
  onDeleteGroup,
  allTasks = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📁");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

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

  // Filter groups based on search term
  const filteredGroups = groups.filter((group) =>
    group.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term matches any existing group exactly
  const exactMatch = groups.find(
    (group) => group.title.toLowerCase() === searchTerm.toLowerCase()
  );

  // Show "Create new group" option when:
  const showCreateFromSearch =
    searchTerm.trim() && !exactMatch && filteredGroups.length === 0;

  // Find group by name instead of ID
  const selectedGroup = groups.find((g) => g.title === editedTask.group);

  const handleGroupSelect = (groupName: string) => {
    handleChange("group", groupName);
    setShowDropdown(false);
    setSearchTerm("");

    // Add activity log entry if task has existing activity log
    if (editedTask.activityLog) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Moved to group: "${groupName || "No Group"}"`,
        action: "group_changed",
        userId: "user",
        timestamp: now,
      };

      handleChange("activityLog", [...editedTask.activityLog, activityEntry]);
    }
  };

  // Handle creating group from search
  const handleCreateFromSearch = () => {
    if (!searchTerm.trim()) return;

    // Only create group if onCreateGroup is available
    if (onCreateGroup) {
      onCreateGroup(searchTerm.trim(), "📁");
    }

    // Apply the group directly to the current task
    handleChange("group", searchTerm.trim());

    // Add activity log entry
    if (editedTask.activityLog) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Created and applied new group: "${searchTerm.trim()}"`,
        action: "group_created",
        userId: "user",
        timestamp: now,
      };

      handleChange("activityLog", [...editedTask.activityLog, activityEntry]);
    }

    // Close dropdown and reset
    setShowDropdown(false);
    setSearchTerm("");
  };

  // Handle delete group with confirmation - FIXED: Added proper null checking
  const handleDeleteGroup = (group: { id: string; title: string }) => {
    // Find all tasks that use this group - safely handle undefined/null allTasks
    const safeTasks = Array.isArray(allTasks) ? allTasks : [];
    const affectedTasks = safeTasks.filter(
      (task) => task && task.group === group.title
    );

    setGroupToDelete(group);
    setShowDeleteDialog(true);
  };

  const confirmDeleteGroup = () => {
    if (!groupToDelete || !onDeleteGroup) return;

    // Call the delete function
    onDeleteGroup(groupToDelete.id);

    // Close dialog and reset state
    setShowDeleteDialog(false);
    setGroupToDelete(null);
    setShowDropdown(false);
  };

  const cancelDeleteGroup = () => {
    setShowDeleteDialog(false);
    setGroupToDelete(null);
  };

  // Handle creating new group
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !onCreateGroup) return;

    onCreateGroup(newGroupName.trim(), selectedEmoji);

    // Apply the new group to current task
    handleChange("group", newGroupName.trim());

    // Add activity log entry
    if (editedTask.activityLog) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Created and applied new group: "${newGroupName.trim()}"`,
        action: "group_created",
        userId: "user",
        timestamp: now,
      };

      handleChange("activityLog", [...editedTask.activityLog, activityEntry]);
    }

    // Reset form
    setNewGroupName("");
    setSelectedEmoji("📁");
    setShowCreateForm(false);
    setShowDropdown(false);
  };

  // Get affected tasks for delete dialog - FIXED: Added proper null checking
  const getAffectedTasks = (): Task[] => {
    if (!groupToDelete) return [];
    const safeTasks = Array.isArray(allTasks) ? allTasks : [];
    return safeTasks.filter(
      (task) => task && task.group === groupToDelete.title
    );
  };

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <DeleteGroupDialog
        isOpen={showDeleteDialog}
        groupName={groupToDelete?.title || ""}
        affectedTasks={getAffectedTasks()}
        onConfirm={confirmDeleteGroup}
        onCancel={cancelDeleteGroup}
      />

      <div className="flex items-center gap-3">
        <Group className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Group
        </span>
      </div>

      {/* Combined Search and Selection Bar */}
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={
            showDropdown
              ? searchTerm
              : selectedGroup
              ? `${selectedGroup.emoji} ${selectedGroup.title}`
              : ""
          }
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setShowDropdown(true);
            if (selectedGroup) {
              setSearchTerm("");
            }
          }}
          placeholder="Select a group..."
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
            <div className="max-h-56 overflow-y-auto">
              {/* Clear Group Option */}
              <button
                onClick={() => handleGroupSelect("")}
                className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                  !editedTask.group
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : ""
                }`}
              >
                <span className="text-lg">🗂️</span>
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  No Group
                </span>
              </button>

              {/* Existing Groups */}
              {filteredGroups.map((group) => (
                <div key={group.title} className="relative group/item">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleGroupSelect(group.title)}
                      className={`flex-1 text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                        editedTask.group === group.title
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : ""
                      }`}
                    >
                      <span className="text-lg">{group.emoji}</span>
                      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                        {group.title}
                      </span>
                    </button>

                    {/* Delete button for custom groups - only show if onDeleteGroup is provided */}
                    {onDeleteGroup && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-2 m-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-all duration-200"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Create from Search - Special result when no matches */}
              {showCreateFromSearch && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleCreateFromSearch}
                    className="w-full text-left p-3 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 text-green-600 dark:text-green-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Create "{searchTerm}"</div>
                      <div className="text-xs opacity-75">
                        Create and apply this group to current task
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* No Results */}
              {searchTerm &&
                filteredGroups.length === 0 &&
                !showCreateFromSearch && (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    No groups found matching "{searchTerm}"
                  </div>
                )}

              {/* Create New Group (Traditional way) - only show if onCreateGroup is provided */}
              {onCreateGroup && (
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
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateGroup();
                            if (e.key === "Escape") {
                              setShowCreateForm(false);
                              setNewGroupName("");
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
                            setNewGroupName("");
                            setSelectedEmoji("📁");
                          }}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateGroup}
                          disabled={!newGroupName.trim()}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                        >
                          Create & Apply
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
                      <span className="font-medium">Create New Group</span>
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

export default GroupSection;
