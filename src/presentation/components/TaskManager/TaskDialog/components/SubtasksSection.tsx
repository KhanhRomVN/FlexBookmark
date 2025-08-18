import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Check, Link, ExternalLink } from "lucide-react";
import { Subtask, Task } from "../../../../types/task";

interface SubtasksSectionProps {
  editedTask: { subtasks?: Subtask[] };
  newSubtask: string;
  setNewSubtask: React.Dispatch<React.SetStateAction<string>>;
  handleSubtaskChange: (id: string, field: keyof Subtask, value: any) => void;
  handleAddSubtask: () => void;
  handleDeleteSubtask: (id: string) => void;
  availableTasks?: Task[]; // Danh sách tasks có thể liên kết
  onTaskClick?: (taskId: string) => void; // Callback khi click vào linked task
}

const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  editedTask,
  newSubtask,
  setNewSubtask,
  handleSubtaskChange,
  handleAddSubtask,
  handleDeleteSubtask,
  availableTasks = [],
  onTaskClick,
}) => {
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isEditingSubtask, setIsEditingSubtask] = useState<string | null>(null);
  const [editingTaskDropdown, setEditingTaskDropdown] = useState<string | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const completionPercentage =
    editedTask.subtasks && editedTask.subtasks.length > 0
      ? Math.round(
          (editedTask.subtasks.filter((st) => st.completed).length /
            editedTask.subtasks.length) *
            100
        )
      : 0;

  // Filter available tasks based on search query
  const filteredTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle input change for new subtask
  const handleNewSubtaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;

    setNewSubtask(value);
    setCursorPosition(cursor);

    // Check if user typed @
    const beforeCursor = value.substring(0, cursor);
    const atIndex = beforeCursor.lastIndexOf("@");

    if (atIndex !== -1 && atIndex === cursor - 1) {
      setShowTaskDropdown(true);
      setSearchQuery("");
    } else if (atIndex !== -1 && cursor > atIndex) {
      const query = beforeCursor.substring(atIndex + 1);
      setSearchQuery(query);
      setShowTaskDropdown(true);
    } else {
      setShowTaskDropdown(false);
      setSearchQuery("");
    }
  };

  // Handle task selection from dropdown
  const handleTaskSelect = (task: Task) => {
    const beforeAt = newSubtask.substring(0, newSubtask.lastIndexOf("@"));
    const afterCursor = newSubtask.substring(cursorPosition);
    const newValue = beforeAt + `@${task.title}` + afterCursor;

    setNewSubtask(newValue);
    setShowTaskDropdown(false);
    setSearchQuery("");

    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle enhanced subtask addition with task linking
  const handleEnhancedAddSubtask = () => {
    if (!newSubtask.trim()) return;

    // Check if subtask contains @mention
    const atMention = newSubtask.match(/@([^@]+)/);
    let linkedTaskId: string | undefined;
    let cleanTitle = newSubtask;

    if (atMention) {
      const mentionedTitle = atMention[1].trim();
      const linkedTask = availableTasks.find(
        (task) => task.title.toLowerCase() === mentionedTitle.toLowerCase()
      );

      if (linkedTask) {
        linkedTaskId = linkedTask.id;
        cleanTitle = newSubtask.replace(atMention[0], "").trim();
      }
    }

    const newSub: Subtask = {
      id: Date.now().toString(),
      title: cleanTitle || newSubtask,
      completed: false,
      linkedTaskId,
    };

    // Use existing handleAddSubtask but modify the subtask
    handleAddSubtask();

    // Update the last added subtask with our enhanced data
    if (editedTask.subtasks) {
      const lastSubtask = editedTask.subtasks[editedTask.subtasks.length - 1];
      if (lastSubtask) {
        handleSubtaskChange(lastSubtask.id, "linkedTaskId", linkedTaskId);
        if (cleanTitle !== newSubtask) {
          handleSubtaskChange(lastSubtask.id, "title", cleanTitle);
        }
      }
    }
  };

  // Handle subtask title editing with task linking
  const handleSubtaskTitleChange = (subtaskId: string, value: string) => {
    handleSubtaskChange(subtaskId, "title", value);

    // Check for @mention in editing
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1) {
      const query = value.substring(atIndex + 1);
      setSearchQuery(query);
      setEditingTaskDropdown(subtaskId);
    } else {
      setEditingTaskDropdown(null);
    }
  };

  // Handle task link for editing subtask
  const handleEditingTaskSelect = (subtaskId: string, task: Task) => {
    const currentSubtask = editedTask.subtasks?.find(
      (st) => st.id === subtaskId
    );
    if (!currentSubtask) return;

    const beforeAt = currentSubtask.title.substring(
      0,
      currentSubtask.title.lastIndexOf("@")
    );
    const newTitle = beforeAt + `@${task.title}`;

    handleSubtaskChange(subtaskId, "title", newTitle);
    handleSubtaskChange(subtaskId, "linkedTaskId", task.id);
    setEditingTaskDropdown(null);
  };

  // Get linked task info
  const getLinkedTask = (linkedTaskId?: string) => {
    if (!linkedTaskId) return null;
    return availableTasks.find((task) => task.id === linkedTaskId);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowTaskDropdown(false);
        setEditingTaskDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-text-default">Subtasks</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
        </div>
        {(editedTask.subtasks?.length ?? 0) > 0 && (
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

      <div className="space-y-3">
        {editedTask.subtasks?.map((subtask) => {
          const linkedTask = getLinkedTask(subtask.linkedTaskId);

          return (
            <div
              key={subtask.id}
              className="flex items-start gap-4 p-3 bg-button-secondBg hover:bg-button-secondBgHover rounded-lg transition-all duration-200 border-b border-border-default"
            >
              <button
                onClick={() =>
                  handleSubtaskChange(
                    subtask.id,
                    "completed",
                    !subtask.completed
                  )
                }
                className={`h-4 w-4 rounded-lg flex items-center justify-center transition-all duration-200 mt-1 ${
                  subtask.completed
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                    : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                }`}
              >
                {subtask.completed && <Check size={14} />}
              </button>

              <div className="flex-1 space-y-2">
                <div className="relative">
                  <input
                    value={subtask.title}
                    onChange={(e) =>
                      handleSubtaskTitleChange(subtask.id, e.target.value)
                    }
                    className={`w-full bg-transparent border-none focus:ring-0 transition-all ${
                      subtask.completed
                        ? "text-text-secondary line-through"
                        : "text-text-default"
                    }`}
                    placeholder="Subtask title (use @ to link tasks)"
                  />

                  {/* Dropdown for editing subtask */}
                  {editingTaskDropdown === subtask.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                    >
                      {filteredTasks.length > 0 ? (
                        filteredTasks.slice(0, 5).map((task) => (
                          <div
                            key={task.id}
                            onClick={() =>
                              handleEditingTaskSelect(subtask.id, task)
                            }
                            className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="text-sm font-medium">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-gray-500 truncate">
                                  {task.description.substring(0, 50)}...
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No tasks found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Show linked task info */}
                {linkedTask && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Link size={12} />
                    <span>Linked to: {linkedTask.title}</span>
                    {onTaskClick && (
                      <button
                        onClick={() => onTaskClick(linkedTask.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Description field for subtask */}
                <textarea
                  value={subtask.description || ""}
                  onChange={(e) =>
                    handleSubtaskChange(
                      subtask.id,
                      "description",
                      e.target.value
                    )
                  }
                  className="w-full text-xs bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-400 resize-none"
                  placeholder="Add description..."
                  rows={1}
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const target = e.currentTarget;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
              </div>

              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}

        <div className="relative">
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                placeholder="Add new subtask... (use @ to link tasks)"
                value={newSubtask}
                onChange={handleNewSubtaskChange}
                className="w-full bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showTaskDropdown) {
                    handleEnhancedAddSubtask();
                  }
                  if (e.key === "Escape") {
                    setShowTaskDropdown(false);
                  }
                }}
              />

              {/* Task selection dropdown */}
              {showTaskDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                >
                  {filteredTasks.length > 0 ? (
                    filteredTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskSelect(task)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            task.priority === "urgent"
                              ? "bg-red-500"
                              : task.priority === "high"
                              ? "bg-orange-500"
                              : task.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {task.description.substring(0, 50)}...
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {task.status} • {task.priority}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No tasks found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Type to search tasks...
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleEnhancedAddSubtask}
              className="flex items-center gap-2 bg-button-bg hover:bg-button-bgHover text-button-bgText px-6 py-3 rounded-lg font-medium"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Helper text */}
          <div className="text-xs text-gray-500 mt-2">
            Tip: Use @ to mention and link other tasks to this subtask
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtasksSection;
