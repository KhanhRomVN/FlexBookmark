import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Check, Link, ExternalLink, Search } from "lucide-react";
import { Subtask, Task } from "../../../../types/task";

interface SubtasksSectionProps {
  editedTask: { subtasks?: Subtask[] };
  newSubtask: string;
  setNewSubtask: React.Dispatch<React.SetStateAction<string>>;
  handleSubtaskChange: (id: string, field: keyof Subtask, value: any) => void;
  handleAddSubtask: () => void;
  handleDeleteSubtask: (id: string) => void;
  availableTasks?: Task[];
  onTaskClick?: (taskId: string) => void;
}

interface NewSubtaskForm {
  title: string;
  description: string;
  linkedTaskId: string | null;
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
  // Enhanced form state for new subtask
  const [newSubtaskForm, setNewSubtaskForm] = useState<NewSubtaskForm>({
    title: "",
    description: "",
    linkedTaskId: null,
  });

  // Dropdown states
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingSubtask, setIsEditingSubtask] = useState<string | null>(null);
  const [editingTaskDropdown, setEditingTaskDropdown] = useState<string | null>(
    null
  );
  const [editingSearchQuery, setEditingSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const editingDropdownRef = useRef<HTMLDivElement>(null);
  const linkedTaskSearchRef = useRef<HTMLInputElement>(null);

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

  // Filter tasks for editing subtask
  const filteredEditingTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(editingSearchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(editingSearchQuery.toLowerCase())
  );

  // Handle new subtask form changes
  const handleFormChange = (
    field: keyof NewSubtaskForm,
    value: string | null
  ) => {
    setNewSubtaskForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle linked task search
  const handleLinkedTaskSearch = (value: string) => {
    setSearchQuery(value);
    setShowTaskDropdown(value.length > 0);
  };

  // Handle task selection for new subtask
  const handleTaskSelect = (task: Task) => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: task.id }));
    setSearchQuery(task.title);
    setShowTaskDropdown(false);
  };

  // Clear linked task selection
  const handleClearLinkedTask = () => {
    setNewSubtaskForm((prev) => ({ ...prev, linkedTaskId: null }));
    setSearchQuery("");
  };

  // Enhanced subtask addition
  const handleEnhancedAddSubtask = () => {
    if (!newSubtaskForm.title.trim()) return;

    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskForm.title,
      description: newSubtaskForm.description || undefined,
      completed: false,
      linkedTaskId: newSubtaskForm.linkedTaskId || undefined,
    };

    // Add to subtasks array
    const updatedSubtasks = [...(editedTask.subtasks || []), newSub];

    // If there's a parent handler, use it, otherwise update directly
    if (handleAddSubtask) {
      // Since we're bypassing the original handler, we need to manually update
      // This assumes the parent component will handle the state update
      handleAddSubtask();

      // Update the last added subtask with our enhanced data
      setTimeout(() => {
        if (editedTask.subtasks) {
          const lastSubtask =
            editedTask.subtasks[editedTask.subtasks.length - 1];
          if (lastSubtask) {
            handleSubtaskChange(lastSubtask.id, "title", newSubtaskForm.title);
            if (newSubtaskForm.description) {
              handleSubtaskChange(
                lastSubtask.id,
                "description",
                newSubtaskForm.description
              );
            }
            if (newSubtaskForm.linkedTaskId) {
              handleSubtaskChange(
                lastSubtask.id,
                "linkedTaskId",
                newSubtaskForm.linkedTaskId
              );
            }
          }
        }
      }, 0);
    }

    // Reset form
    setNewSubtaskForm({
      title: "",
      description: "",
      linkedTaskId: null,
    });
    setSearchQuery("");
  };

  // Handle subtask editing with linked task dropdown
  const handleEditingTaskSearch = (subtaskId: string, value: string) => {
    setEditingSearchQuery(value);
    setEditingTaskDropdown(subtaskId);
  };

  // Handle task selection for editing subtask
  const handleEditingTaskSelect = (subtaskId: string, task: Task) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", task.id);
    setEditingTaskDropdown(null);
    setEditingSearchQuery("");
  };

  // Clear linked task for editing subtask
  const handleClearEditingLinkedTask = (subtaskId: string) => {
    handleSubtaskChange(subtaskId, "linkedTaskId", undefined);
    setEditingSearchQuery("");
  };

  // Get linked task info
  const getLinkedTask = (linkedTaskId?: string) => {
    if (!linkedTaskId) return null;
    return availableTasks.find((task) => task.id === linkedTaskId);
  };

  // Get selected linked task for new subtask form
  const getSelectedLinkedTask = () => {
    if (!newSubtaskForm.linkedTaskId) return null;
    return availableTasks.find(
      (task) => task.id === newSubtaskForm.linkedTaskId
    );
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        linkedTaskSearchRef.current &&
        !linkedTaskSearchRef.current.contains(event.target as Node)
      ) {
        setShowTaskDropdown(false);
      }
      if (
        editingDropdownRef.current &&
        !editingDropdownRef.current.contains(event.target as Node)
      ) {
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
              className="flex items-start gap-4 p-4 bg-button-secondBg hover:bg-button-secondBgHover rounded-lg transition-all duration-200 border border-border-default"
            >
              <button
                onClick={() =>
                  handleSubtaskChange(
                    subtask.id,
                    "completed",
                    !subtask.completed
                  )
                }
                className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all duration-200 mt-1 ${
                  subtask.completed
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                    : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                }`}
              >
                {subtask.completed && <Check size={16} />}
              </button>

              <div className="flex-1 space-y-3">
                {/* Title */}
                <div>
                  <input
                    value={subtask.title}
                    onChange={(e) =>
                      handleSubtaskChange(subtask.id, "title", e.target.value)
                    }
                    className={`w-full bg-transparent border-none focus:ring-0 font-medium transition-all ${
                      subtask.completed
                        ? "text-text-secondary line-through"
                        : "text-text-default"
                    }`}
                    placeholder="Subtask title"
                  />
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={subtask.description || ""}
                    onChange={(e) =>
                      handleSubtaskChange(
                        subtask.id,
                        "description",
                        e.target.value
                      )
                    }
                    className="w-full text-sm bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-400 resize-none"
                    placeholder="Add description..."
                    rows={2}
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                      const target = e.currentTarget;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                </div>

                {/* Linked Task Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Linked Task:
                    </span>
                  </div>

                  {linkedTask ? (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {linkedTask.title}
                        </div>
                        {linkedTask.description && (
                          <div className="text-xs text-blue-500 dark:text-blue-300 truncate">
                            {linkedTask.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {onTaskClick && (
                          <button
                            onClick={() => onTaskClick(linkedTask.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <ExternalLink size={12} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleClearEditingLinkedTask(subtask.id)
                          }
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center gap-2 p-2 border border-border-default rounded-lg">
                        <Search size={14} className="text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search and select a task to link..."
                          value={
                            editingTaskDropdown === subtask.id
                              ? editingSearchQuery
                              : ""
                          }
                          onChange={(e) =>
                            handleEditingTaskSearch(subtask.id, e.target.value)
                          }
                          onFocus={() => setEditingTaskDropdown(subtask.id)}
                          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-text-default"
                        />
                      </div>

                      {/* Editing dropdown */}
                      {editingTaskDropdown === subtask.id && (
                        <div
                          ref={editingDropdownRef}
                          className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                        >
                          {filteredEditingTasks.length > 0 ? (
                            filteredEditingTasks.slice(0, 5).map((task) => (
                              <div
                                key={task.id}
                                onClick={() =>
                                  handleEditingTaskSelect(subtask.id, task)
                                }
                                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    task.priority === "urgent"
                                      ? "bg-red-500"
                                      : task.priority === "high"
                                      ? "bg-orange-500"
                                      : task.priority === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                ></div>
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
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}

        {/* Enhanced New Subtask Form */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Add New Subtask
            </span>
          </div>

          {/* Title Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newSubtaskForm.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              className="w-full bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-border-default text-text-default focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="Add detailed description..."
              value={newSubtaskForm.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-border-default text-text-default focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Linked Task Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Linked Task
            </label>

            {getSelectedLinkedTask() ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {getSelectedLinkedTask()!.title}
                  </div>
                  {getSelectedLinkedTask()!.description && (
                    <div className="text-xs text-blue-500 dark:text-blue-300 truncate">
                      {getSelectedLinkedTask()!.description.substring(0, 50)}...
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {onTaskClick && (
                    <button
                      onClick={() => onTaskClick(getSelectedLinkedTask()!.id)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                  <button
                    onClick={handleClearLinkedTask}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 p-3 border border-border-default rounded-lg bg-white dark:bg-gray-700">
                  <Search size={16} className="text-gray-400" />
                  <input
                    ref={linkedTaskSearchRef}
                    type="text"
                    placeholder="Search and select a task to link..."
                    value={searchQuery}
                    onChange={(e) => handleLinkedTaskSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-text-default"
                  />
                </div>

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
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleEnhancedAddSubtask}
              disabled={!newSubtaskForm.title.trim()}
              className="flex items-center gap-2 bg-button-bg hover:bg-button-bgHover disabled:bg-gray-400 disabled:cursor-not-allowed text-button-bgText px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={16} />
              Add Subtask
            </button>
            <button
              onClick={() => {
                setNewSubtaskForm({
                  title: "",
                  description: "",
                  linkedTaskId: null,
                });
                setSearchQuery("");
                setShowTaskDropdown(false);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
          💡 <strong>Pro tip:</strong> Link subtasks to other tasks to create
          dependencies and track related work across your project.
        </div>
      </div>
    </div>
  );
};

export default SubtasksSection;
