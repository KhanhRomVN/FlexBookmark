import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Task, Priority, Status, Subtask, Attachment } from "../../types/task";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  Paperclip,
  Calendar,
  Clock,
  File,
  Image,
  Video,
  Radio,
  FileText,
  ChevronDown,
  MoreVertical,
  Move,
  Archive,
  Star,
  Flag,
  Link,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { calculateTaskMetadataSize } from "../../../utils/GGTask";
import ModernDateTimePicker from "../../components/common/ModernDateTimePicker";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  folders: { id: string; title: string; emoji: string }[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onMove: (taskId: string, newStatus: Status) => void;
  isCreateMode?: boolean;
}

interface TransitionConfirmationProps {
  isOpen: boolean;
  transition: {
    from: Status;
    to: Status;
    scenarios: {
      title: string;
      options: Array<{
        label: string;
        value: string;
        action?: () => void;
      }>;
    }[];
  } | null;
  onConfirm: (selectedOptions: Record<string, string>) => void;
  onCancel: () => void;
}

const TransitionConfirmationDialog: React.FC<TransitionConfirmationProps> = ({
  isOpen,
  transition,
  onConfirm,
  onCancel,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  if (!isOpen || !transition) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🔄 Status Transition Confirmation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Moving from{" "}
            <span className="font-medium capitalize">
              {transition.from.replace("-", " ")}
            </span>{" "}
            to{" "}
            <span className="font-medium capitalize">
              {transition.to.replace("-", " ")}
            </span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {transition.scenarios.map((scenario, index) => (
            <div key={index} className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {scenario.title}
              </h4>
              <div className="space-y-2">
                {scenario.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`scenario-${index}`}
                      value={option.value}
                      onChange={(e) =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [`scenario-${index}`]: e.target.value,
                        }))
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedOptions)}
            disabled={
              Object.keys(selectedOptions).length !==
              transition.scenarios.length
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Transition
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  folders,
  onSave,
  onDelete,
  onDuplicate,
  onMove,
  isCreateMode = false,
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newSubtask, setNewSubtask] = useState("");
  const [newAttachment, setNewAttachment] = useState({
    title: "",
    url: "",
    type: "file" as "image" | "video" | "audio" | "file" | "other",
  });
  const [newTag, setNewTag] = useState("");
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPrevTaskList, setShowPrevTaskList] = useState(false);
  const [showNextTaskList, setShowNextTaskList] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    from: Status;
    to: Status;
    scenarios: any[];
  } | null>(null);

  const attachmentRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const prevTaskRef = useRef<HTMLDivElement>(null);
  const nextTaskRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentRef.current &&
        !attachmentRef.current.contains(event.target as Node)
      ) {
        setShowAttachmentOptions(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setShowActionMenu(false);
      }
      if (
        prevTaskRef.current &&
        !prevTaskRef.current.contains(event.target as Node)
      ) {
        setShowPrevTaskList(false);
      }
      if (
        nextTaskRef.current &&
        !nextTaskRef.current.contains(event.target as Node)
      ) {
        setShowNextTaskList(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getTransitionScenarios = (from: Status, to: Status, task: Task) => {
    const now = new Date();
    const scenarios = [];

    // Helper functions
    const hasOverdueCondition = task.endDate && new Date(task.endDate) < now;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const hasIncompleteSubtasks =
      hasSubtasks && task.subtasks!.some((st) => !st.completed);

    switch (`${from}-${to}`) {
      case "backlog-todo":
        if (hasOverdueCondition) {
          scenarios.push({
            title: "⚠️ Past Due Task",
            options: [
              { label: "📋 Move to Todo anyway", value: "proceed" },
              { label: "⏰ Move to Overdue instead", value: "overdue" },
              { label: "📅 Update due date first", value: "update_date" },
              { label: "❌ Cancel", value: "cancel" },
            ],
          });
        }
        break;

      case "backlog-in-progress":
      case "todo-in-progress":
        // Early start warning
        if (task.startDate && new Date(task.startDate) > now) {
          scenarios.push({
            title: "⏰ Early Start Warning",
            options: [
              { label: "🚀 Start early (recommended)", value: "start_early" },
              { label: "📅 Update planned start date", value: "update_start" },
              {
                label: "⏳ Schedule reminder for planned date",
                value: "schedule_reminder",
              },
              { label: "❌ Cancel", value: "cancel" },
            ],
          });
        }

        // Overdue condition
        if (hasOverdueCondition) {
          scenarios.push({
            title: "🚨 Working on Overdue Task",
            options: [
              {
                label: "🔥 Start anyway (mark as overdue)",
                value: "start_overdue",
              },
              { label: "📅 Update due date first", value: "update_date" },
              { label: "⚡ Mark as ASAP priority", value: "mark_asap" },
              { label: "❌ Cancel", value: "cancel" },
            ],
          });
        }

        // Capacity check for todo->in-progress
        if (from === "todo") {
          scenarios.push({
            title: "⚖️ Capacity Management",
            options: [
              { label: "🚀 Start now (within capacity)", value: "start_now" },
              { label: "⏸️ Pause other tasks first", value: "pause_others" },
              { label: "📅 Schedule for later", value: "schedule_later" },
              { label: "🔄 Delegate this task", value: "delegate" },
            ],
          });
        }
        break;

      case "backlog-done":
      case "todo-done":
        scenarios.push({
          title: "🤔 Skip In Progress Phase?",
          options: [
            {
              label: "⚡ Complete immediately (simple task)",
              value: "complete_immediate",
            },
            {
              label: "📝 Add work notes before completion",
              value: "add_notes",
            },
            { label: "⏱️ Track time spent", value: "track_time" },
            { label: "🔄 Start In Progress instead", value: "to_in_progress" },
            { label: "❌ Cancel", value: "cancel" },
          ],
        });

        if (hasIncompleteSubtasks) {
          scenarios.push({
            title: "📋 Incomplete Subtasks Warning",
            options: [
              {
                label: "✅ Mark all subtasks complete",
                value: "complete_all_subtasks",
              },
              {
                label: "🗑️ Remove incomplete subtasks",
                value: "remove_incomplete",
              },
              {
                label: "📝 Convert subtasks to separate tasks",
                value: "convert_subtasks",
              },
              {
                label: "❌ Cannot complete with pending subtasks",
                value: "cancel",
              },
            ],
          });
        }
        break;

      case "in-progress-backlog":
      case "in-progress-todo":
        scenarios.push({
          title: "💼 Stop Work Confirmation",
          options: [
            {
              label: "⏸️ Pause work (keep progress notes)",
              value: "pause_keep_progress",
            },
            { label: "🗑️ Stop and lose progress", value: "stop_lose_progress" },
            { label: "📝 Add stopping reason", value: "add_reason" },
            { label: "⏱️ Track time already spent", value: "track_time" },
            { label: "❌ Keep working", value: "cancel" },
          ],
        });
        break;

      case "in-progress-done":
        // Early completion check
        if (task.endDate && new Date(task.endDate) > now) {
          scenarios.push({
            title: "🏆 Early Completion",
            options: [
              { label: "✅ Mark complete early", value: "complete_early" },
              { label: "📊 Log efficiency metrics", value: "log_metrics" },
              { label: "🔄 Use extra time for enhancement", value: "enhance" },
              { label: "🎯 Move up next priority task", value: "next_task" },
            ],
          });
        }

        scenarios.push({
          title: "🎯 Completion Quality",
          options: [
            {
              label: "✅ Fully complete - ready for review",
              value: "fully_complete",
            },
            {
              label: "📝 Complete with notes/caveats",
              value: "complete_with_notes",
            },
            {
              label: "⚡ MVP complete - can enhance later",
              value: "mvp_complete",
            },
            {
              label: "🔄 Complete but needs follow-up task",
              value: "needs_followup",
            },
          ],
        });
        break;

      case "in-progress-overdue":
        scenarios.push({
          title: "🚨 Overdue While Working",
          options: [
            {
              label: "⏰ Mark overdue (stop work)",
              value: "mark_overdue_stop",
            },
            {
              label: "🏃 Continue working (extend deadline)",
              value: "continue_extend",
            },
            { label: "⚡ Push to complete ASAP", value: "complete_asap" },
            { label: "📞 Escalate to manager/stakeholder", value: "escalate" },
            { label: "📅 Negotiate new deadline", value: "negotiate_deadline" },
            { label: "🔄 Partial delivery option", value: "partial_delivery" },
          ],
        });
        break;

      case "done-backlog":
      case "done-todo":
      case "done-in-progress":
        scenarios.push({
          title: "🚨 Reopen Completed Task",
          options: [
            {
              label: "🔄 Reopen (keep actualStartDate)",
              value: "reopen_keep_dates",
            },
            {
              label: "🗑️ Full reset (clear all actual times)",
              value: "full_reset",
            },
            {
              label: "📝 Create follow-up task instead",
              value: "create_followup",
            },
            { label: "🔍 Add reopening reason", value: "add_reason" },
            { label: "❌ Cancel - keep completed", value: "cancel" },
          ],
        });

        // Recent completion check
        if (
          task.actualEndDate &&
          now.getTime() - new Date(task.actualEndDate).getTime() <
            24 * 60 * 60 * 1000
        ) {
          scenarios.push({
            title: "⚡ Recent Completion",
            options: [
              { label: "🔧 Quick fix needed", value: "quick_fix" },
              { label: "📋 Missed requirement", value: "missed_requirement" },
              { label: "🧪 Failed testing/review", value: "failed_testing" },
            ],
          });
        }
        break;

      case "overdue-in-progress":
        scenarios.push({
          title: "⏰ Late Start Strategy",
          options: [
            { label: "🔥 Full scope (original plan)", value: "full_scope" },
            { label: "⚡ MVP scope (reduced deliverable)", value: "mvp_scope" },
            {
              label: "📞 Stakeholder consultation first",
              value: "consult_stakeholders",
            },
            { label: "🏃 Crash mode (extra resources)", value: "crash_mode" },
            { label: "📋 Partial delivery option", value: "partial_delivery" },
          ],
        });

        // Significantly overdue check
        if (
          task.endDate &&
          now.getTime() - new Date(task.endDate).getTime() >
            7 * 24 * 60 * 60 * 1000
        ) {
          scenarios.push({
            title: "📞 Stakeholder Communication",
            options: [
              {
                label: "📧 Notify stakeholders before starting",
                value: "notify_before",
              },
              {
                label: "📅 Provide new estimated completion",
                value: "new_estimate",
              },
              {
                label: "🔄 Request scope clarification",
                value: "clarify_scope",
              },
            ],
          });
        }
        break;

      case "overdue-done":
        scenarios.push({
          title: "📋 Late Completion Process",
          options: [
            {
              label: "✅ Complete as-is (late delivery)",
              value: "complete_late",
            },
            {
              label: "📝 Complete with delivery notes",
              value: "complete_with_notes",
            },
            {
              label: "📊 Log delay reasons for analysis",
              value: "log_delay_reasons",
            },
            {
              label: "🔄 Create follow-up tasks for improvements",
              value: "create_improvements",
            },
            {
              label: "📞 Notify stakeholders of completion",
              value: "notify_completion",
            },
          ],
        });

        scenarios.push({
          title: "🎯 Quality Assurance",
          options: [
            {
              label: "✅ Full quality - ready for delivery",
              value: "full_quality",
            },
            {
              label: "⚡ MVP quality - functional but basic",
              value: "mvp_quality",
            },
            {
              label: "🔄 Needs quality review before delivery",
              value: "needs_review",
            },
            {
              label: "📋 Create quality improvement backlog",
              value: "quality_backlog",
            },
          ],
        });
        break;
    }

    return scenarios;
  };

  const handleStatusChange = (newStatus: Status) => {
    if (!editedTask) return;

    const scenarios = getTransitionScenarios(
      editedTask.status,
      newStatus,
      editedTask
    );

    // Nếu có scenarios cần xác nhận
    if (scenarios.length > 0) {
      setPendingTransition({
        from: editedTask.status,
        to: newStatus,
        scenarios,
      });
      setShowTransitionDialog(true);
      return;
    }

    // Nếu không có scenarios, thực hiện chuyển đổi ngay
    executeStatusTransition(editedTask.status, newStatus, {});
  };

  const executeStatusTransition = (
    oldStatus: Status,
    newStatus: Status,
    selectedOptions: Record<string, string>
  ) => {
    if (!editedTask) return;

    const currentDateTime = new Date();
    let updatedTask = { ...editedTask, status: newStatus };

    // Xử lý các lựa chọn của user
    Object.entries(selectedOptions).forEach(([scenario, option]) => {
      switch (option) {
        case "cancel":
          return; // Không thực hiện chuyển đổi

        case "overdue":
          updatedTask.status = "overdue";
          break;

        case "update_date":
          // Logic cập nhật ngày - có thể mở date picker
          break;

        case "start_early":
          updatedTask.actualStartDate = currentDateTime;
          updatedTask.actualStartTime = currentDateTime;
          break;

        case "complete_all_subtasks":
          if (updatedTask.subtasks) {
            updatedTask.subtasks = updatedTask.subtasks.map((st) => ({
              ...st,
              completed: true,
            }));
          }
          break;

        case "full_reset":
          updatedTask.actualStartDate = null;
          updatedTask.actualStartTime = null;
          updatedTask.actualEndDate = null;
          updatedTask.actualEndTime = null;
          break;

        // Thêm các case khác theo needs
      }
    });

    // Handle transition OUT of old status
    switch (oldStatus) {
      case "in-progress":
        if (newStatus !== "done") {
          updatedTask.actualStartDate = null;
          updatedTask.actualStartTime = null;
        }
        break;
      case "done":
        updatedTask.actualEndDate = null;
        updatedTask.actualEndTime = null;
        break;
    }

    // Handle transition INTO new status
    switch (newStatus) {
      case "in-progress":
        updatedTask.actualStartDate = currentDateTime;
        updatedTask.actualStartTime = currentDateTime;
        break;
      case "done":
        updatedTask.actualEndDate = currentDateTime;
        updatedTask.actualEndTime = currentDateTime;
        if (!updatedTask.actualStartDate) {
          updatedTask.actualStartDate = currentDateTime;
          updatedTask.actualStartTime = currentDateTime;
        }
        break;
    }

    // Add activity log entry
    if (!isCreateMode) {
      const activityEntry = {
        id: `${currentDateTime.getTime()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`,
        details: `Status changed from "${oldStatus}" to "${newStatus}"`,
        action: "status_changed",
        userId: "user",
        timestamp: currentDateTime,
      };
      updatedTask.activityLog = [
        ...(updatedTask.activityLog || []),
        activityEntry,
      ];
    }

    setEditedTask(updatedTask);
    setShowStatusDropdown(false);
  };

  const handleTransitionConfirm = (selectedOptions: Record<string, string>) => {
    if (!pendingTransition) return;

    executeStatusTransition(
      pendingTransition.from,
      pendingTransition.to,
      selectedOptions
    );
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleTransitionCancel = () => {
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const StatusBar = () => {
    const statusOptions = [
      {
        value: "backlog",
        label: "BACKLOG",
        barColor: "bg-slate-500",
        dotColor: "bg-slate-500",
      },
      {
        value: "todo",
        label: "TODO",
        barColor: "bg-blue-500",
        dotColor: "bg-blue-500",
      },
      {
        value: "in-progress",
        label: "IN PROGRESS",
        barColor: "bg-amber-500",
        dotColor: "bg-amber-500",
      },
      {
        value: "done",
        label: "DONE",
        barColor: "bg-emerald-500",
        dotColor: "bg-emerald-500",
      },
      {
        value: "overdue",
        label: "OVERDUE",
        barColor: "bg-red-500",
        dotColor: "bg-red-500",
      },
    ];

    const currentIndex = statusOptions.findIndex(
      (s) => s.value === editedTask!.status
    );

    const currentStatus = statusOptions[currentIndex];
    const progressPercentage =
      ((currentIndex + 1) / statusOptions.length) * 100;

    return (
      <div className="flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 dark:border-gray-700/60 shadow-sm min-w-fit">
        {/* Status Labels - Horizontal Layout */}
        <div className="flex items-center gap-6">
          {statusOptions.map((status, index) => {
            const isActive = editedTask!.status === status.value;
            const isPassed = index <= currentIndex;

            return (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value as Status)}
                className={`
                relative text-xs font-semibold tracking-wider transition-all duration-300 whitespace-nowrap
                ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : isPassed
                    ? "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                }
              `}
              >
                {status.label}

                {/* Active underline */}
                {isActive && (
                  <div
                    className={`
                  absolute -bottom-1 left-0 right-0 h-0.5 ${status.barColor} rounded-full
                  animate-in slide-in-from-left-3 duration-300
                `}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-[120px]">
          <div
            className={`
            h-full ${currentStatus?.barColor || "bg-gray-400"} rounded-full
            transition-all duration-700 ease-out
            shadow-sm
          `}
            style={{
              width: `${progressPercentage}%`,
              transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Status Dots */}
        <div className="flex items-center gap-1.5">
          {statusOptions.map((status, index) => {
            const isActive = editedTask!.status === status.value;
            const isPassed = index <= currentIndex;

            return (
              <button
                key={`dot-${status.value}`}
                onClick={() => handleStatusChange(status.value as Status)}
                className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300 hover:scale-125
                ${
                  isActive
                    ? `${status.dotColor} shadow-md ring-2 ring-white dark:ring-gray-800 ring-opacity-60`
                    : isPassed
                    ? `${status.dotColor} opacity-80`
                    : "bg-gray-300 dark:bg-gray-600 opacity-40"
                }
              `}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev!, [field]: value }));
  };

  const handleSubtaskChange = (
    id: string,
    field: keyof Subtask,
    value: any
  ) => {
    setEditedTask((prev) => ({
      ...prev!,
      subtasks:
        prev!.subtasks?.map((st) =>
          st.id === id ? { ...st, [field]: value } : st
        ) || [],
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
    };
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: [...(prev!.subtasks || []), newSub],
    }));
    setNewSubtask("");

    // Add activity log entry only if not in create mode
    if (!isCreateMode) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Added subtask: "${newSubtask}"`,
        action: "subtask_added",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleDeleteSubtask = (id: string) => {
    const subtask = editedTask.subtasks?.find((st) => st.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter((st) => st.id !== id) || [],
    }));

    // Add activity log entry only if not in create mode
    if (!isCreateMode && subtask) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Removed subtask: "${subtask.title}"`,
        action: "subtask_removed",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachment.url.trim()) return;
    const newAtt: Attachment = {
      id: Date.now().toString(),
      title: newAttachment.title || "Attachment",
      url: newAttachment.url,
      type: newAttachment.type,
    };
    setEditedTask((prev) => ({
      ...prev!,
      attachments: [...(prev!.attachments || []), newAtt],
    }));
    setNewAttachment({ title: "", url: "", type: "file" });

    // Add activity log entry only if not in create mode
    if (!isCreateMode) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Added attachment: "${newAtt.title}" (${newAtt.type})`,
        action: "attachment_added",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleDeleteAttachment = (id: string) => {
    const attachment = editedTask.attachments?.find((att) => att.id === id);
    setEditedTask((prev) => ({
      ...prev!,
      attachments: prev!.attachments?.filter((att) => att.id !== id) || [],
    }));

    // Add activity log entry only if not in create mode
    if (!isCreateMode && attachment) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Removed attachment: "${attachment.title}"`,
        action: "attachment_removed",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setEditedTask((prev) => ({
      ...prev!,
      tags: [...(prev!.tags || []), newTag],
    }));
    setNewTag("");

    // Add activity log entry only if not in create mode
    if (!isCreateMode) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Added tag: "${newTag}"`,
        action: "tag_added",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  const handleDeleteTag = (tag: string) => {
    setEditedTask((prev) => ({
      ...prev!,
      tags: prev!.tags?.filter((t) => t !== tag) || [],
    }));

    // Add activity log entry only if not in create mode
    if (!isCreateMode) {
      const now = new Date();
      const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Removed tag: "${tag}"`,
        action: "tag_removed",
        userId: "user",
        timestamp: now,
      };
      setEditedTask((prev) => ({
        ...prev!,
        activityLog: [...(prev!.activityLog || []), activityEntry],
      }));
    }
  };

  // Helper functions
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "Select date";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDisplayTime = (time: Date | null) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const completionPercentage =
    editedTask.subtasks && editedTask.subtasks.length > 0
      ? Math.round(
          (editedTask.subtasks.filter((st) => st.completed).length /
            editedTask.subtasks.length) *
            100
        )
      : 0;

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image size={16} className="text-emerald-500" />;
      case "video":
        return <Video size={16} className="text-amber-500" />;
      case "audio":
        return <Radio size={16} className="text-indigo-500" />;
      case "file":
        return <File size={16} className="text-blue-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const priorityColors = {
    low: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md",
    medium:
      "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md",
    high: "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md",
    urgent: "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md",
  };

  const priorityIcons = {
    low: <Flag size={14} />,
    medium: <Flag size={14} />,
    high: <Flag size={14} />,
    urgent: <Star size={14} />,
  };

  // Calculate metadata size for character counter
  const metadataInfo = calculateTaskMetadataSize(editedTask);

  // Mock available tasks for linking (in real app, this would come from props)
  const availableTasks = [
    { id: "task1", title: "Review designs", status: "in-progress" },
    { id: "task2", title: "Update documentation", status: "todo" },
    { id: "task3", title: "Testing phase", status: "backlog" },
  ].filter((t) => t.id !== editedTask.id);

  if (!isOpen || !editedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      {/* Transition Confirmation Dialog */}
      <TransitionConfirmationDialog
        isOpen={showTransitionDialog}
        transition={pendingTransition}
        onConfirm={handleTransitionConfirm}
        onCancel={handleTransitionCancel}
      />

      {/* Main Task Dialog */}
      <div className="w-full max-w-5xl max-h-[95vh] bg-dialog-background rounded-lg border border-border-default overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex justify-between items-center">
          <div className="flex items-center gap-4 w-full">
            {/* Status Bar - only show in edit mode */}
            {!isCreateMode && <StatusBar />}

            {/* Character Counter - only show in edit mode */}
            {!isCreateMode && (
              <div className="ml-auto flex items-center gap-2 text-sm">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    metadataInfo.isOverLimit
                      ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : metadataInfo.characterCount > 7000
                      ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {metadataInfo.isOverLimit && <AlertTriangle size={14} />}
                  <span>
                    {metadataInfo.characterCount.toLocaleString()} / 4095
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Action Menu - only show in edit mode */}
            {!isCreateMode && (
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
                >
                  <MoreVertical size={20} />
                </button>

                {showActionMenu && (
                  <div className="absolute z-20 right-0 mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden w-44 animate-in fade-in-0 zoom-in-95">
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => setShowActionMenu(false)}
                    >
                      <Move size={16} />
                      Move
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        onDuplicate(editedTask);
                        setShowActionMenu(false);
                      }}
                    >
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => {
                        onMove(editedTask.id, "archive");
                        setShowActionMenu(false);
                      }}
                    >
                      <Archive size={16} />
                      Archive
                    </button>
                    <div className="border-t border-border-default">
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 transition-colors"
                        onClick={() => {
                          if (editedTask.id) onDelete(editedTask.id);
                          setShowActionMenu(false);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-auto flex ${
            isCreateMode ? "justify-center" : ""
          }`}
        >
          {/* Left Column - Main Content */}
          <div
            ref={leftPanelRef}
            className={`${
              isCreateMode ? "w-full max-w-4xl" : "w-2/3"
            } p-6 space-y-8 overflow-auto max-h-[calc(100vh-200px)]`}
          >
            {/* Title */}
            <div className="space-y-2">
              <Textarea
                value={editedTask.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="What needs to be done?"
                rows={1}
                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all resize-none overflow-hidden"
                style={{ minHeight: "3.5rem", maxHeight: "10rem" }}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Description
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>
              <textarea
                value={editedTask.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full bg-input-background rounded-lg p-4 border border-border-default text-text-primary  resize-none "
                placeholder="Add detailed description, notes, or context..."
              />
            </div>

            {/* Task Linking */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Task Linking
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Previous Task */}
                <div className="space-y-2">
                  <label className="flex mb-2 text-sm font-medium text-text-secondary items-center gap-2">
                    <Link size={16} />
                    Previous Task
                  </label>
                  <div className="relative" ref={prevTaskRef}>
                    <button
                      className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default  "
                      onClick={() => setShowPrevTaskList(!showPrevTaskList)}
                    >
                      <span className="truncate">
                        {editedTask.prevTaskId
                          ? availableTasks.find(
                              (t) => t.id === editedTask.prevTaskId
                            )?.title || "Unknown Task"
                          : "Select previous task..."}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {showPrevTaskList && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-border-default"
                          onClick={() => {
                            handleChange("prevTaskId", null);
                            setShowPrevTaskList(false);
                          }}
                        >
                          <span className="text-gray-500">None</span>
                        </button>
                        {availableTasks.map((task) => (
                          <button
                            key={task.id}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            onClick={() => {
                              handleChange("prevTaskId", task.id);
                              setShowPrevTaskList(false);
                            }}
                          >
                            <div className="truncate">{task.title}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {task.status.replace("-", " ")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Task */}
                <div className="space-y-2">
                  <label className="mb-2 text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Link size={16} />
                    Next Task
                  </label>
                  <div className="relative" ref={nextTaskRef}>
                    <button
                      className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default  "
                      onClick={() => setShowNextTaskList(!showNextTaskList)}
                    >
                      <span className="truncate">
                        {editedTask.nextTaskId
                          ? availableTasks.find(
                              (t) => t.id === editedTask.nextTaskId
                            )?.title || "Unknown Task"
                          : "Select next task..."}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {showNextTaskList && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-border-default"
                          onClick={() => {
                            handleChange("nextTaskId", null);
                            setShowNextTaskList(false);
                          }}
                        >
                          <span className="text-gray-500">None</span>
                        </button>
                        {availableTasks.map((task) => (
                          <button
                            key={task.id}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            onClick={() => {
                              handleChange("nextTaskId", task.id);
                              setShowNextTaskList(false);
                            }}
                          >
                            <div className="truncate">{task.title}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {task.status.replace("-", " ")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Attributes
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="space-y-6">
                {/* Priority Buttons */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-text-secondary">
                    Priority Level
                  </label>
                  <div className="flex items-center gap-3">
                    {(["low", "medium", "high", "urgent"] as Priority[]).map(
                      (level) => (
                        <button
                          key={level}
                          onClick={() => handleChange("priority", level)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                            editedTask.priority === level
                              ? priorityColors[level]
                              : "bg-button-secondBg text-text-secondary border border-border-default"
                          }`}
                        >
                          {priorityIcons[level]}
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
                {/* Date & Time Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Start Date & Time */}
                  <ModernDateTimePicker
                    selectedDate={editedTask.startDate ?? null}
                    selectedTime={editedTask.startTime ?? null}
                    onDateChange={(date) => handleChange("startDate", date)}
                    onTimeChange={(time) => handleChange("startTime", time)}
                    label="Start Date & Time"
                    color="green"
                    placeholder="Select start date & time"
                  />

                  {/* Due Date & Time */}
                  <ModernDateTimePicker
                    selectedDate={editedTask.endDate ?? null}
                    selectedTime={editedTask.endTime ?? null}
                    onDateChange={(date) => handleChange("endDate", date)}
                    onTimeChange={(time) => handleChange("endTime", time)}
                    label="Due Date & Time"
                    color="red"
                    placeholder="Select due date & time"
                  />
                </div>
                {/* Actual Timeline display only */}
                {!isCreateMode &&
                  (editedTask.actualStartDate || editedTask.actualEndDate) && (
                    <div className="space-y-4">
                      {/* Date & Time Fields - Same style as Start/Due */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Actual Start Date & Time */}
                        {editedTask.actualStartDate && (
                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                                <Calendar
                                  size={14}
                                  className="text-orange-700 dark:text-orange-300"
                                />
                              </div>
                              Actual Start Date & Time
                            </label>

                            <div className="group w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-left flex items-center justify-between transition-all duration-300 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                                <div className="space-y-1">
                                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                                    {formatDisplayDate(
                                      editedTask.actualStartDate
                                    )}
                                  </div>
                                  {editedTask.actualStartTime && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {formatDisplayTime(
                                        editedTask.actualStartTime
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actual End Date & Time */}
                        {editedTask.actualEndDate && (
                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50">
                                <Calendar
                                  size={14}
                                  className="text-blue-700 dark:text-blue-300"
                                />
                              </div>
                              Actual End Date & Time
                            </label>

                            <div className="group w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-left flex items-center justify-between transition-all duration-300 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                <div className="space-y-1">
                                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                                    {formatDisplayDate(
                                      editedTask.actualEndDate
                                    )}
                                  </div>
                                  {editedTask.actualEndTime && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {formatDisplayTime(
                                        editedTask.actualEndTime
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                {/* Duration Display */}
                {editedTask.startDate && editedTask.endDate && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Calendar
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          Task Duration:{" "}
                          {Math.max(
                            1,
                            Math.ceil(
                              (new Date(editedTask.endDate).getTime() -
                                new Date(editedTask.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}{" "}
                          day(s)
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          From {formatDisplayDate(editedTask.startDate)} to{" "}
                          {formatDisplayDate(editedTask.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Tags */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-text-secondary">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editedTask.tags?.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium "
                        >
                          {tag}
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-border-default text-text-default text-sm  "
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      />
                      <button
                        onClick={handleAddTag}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-text-default">
                    Subtasks
                  </h3>
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
                {editedTask.subtasks?.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-4 p-2 bg-button-secondBg hover:bg-button-secondBgHover rounded-lg transition-all duration-200 border-b border-border-default"
                  >
                    <button
                      onClick={() =>
                        handleSubtaskChange(
                          subtask.id,
                          "completed",
                          !subtask.completed
                        )
                      }
                      className={`h-4 w-4 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        subtask.completed
                          ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                          : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
                      }`}
                    >
                      {subtask.completed && <Check size={14} />}
                    </button>
                    <input
                      value={subtask.title}
                      onChange={(e) =>
                        handleSubtaskChange(subtask.id, "title", e.target.value)
                      }
                      className={`flex-1 bg-transparent border-none focus:ring-0 transition-all ${
                        subtask.completed
                          ? "text-text-secondary line-through"
                          : "text-text-default"
                      }`}
                      placeholder="Subtask title"
                    />
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <div className="flex gap-3 mt-4">
                  <input
                    placeholder="Add new subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="flex-1 bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default  "
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="flex items-center gap-2 bg-button-bg hover:bg-button-bgHover text-button-bgText px-6 py-3 rounded-lg font-medium"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-text-default">
                  Attachments
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedTask.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border-default"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className=" p-2.5 rounded-lg">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-default font-medium truncate block hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {att.title || "Attachment"}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {att.url.substring(0, 40)}
                          {att.url.length > 40 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 p-4 rounded-lg border border-border-default">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-2 block font-medium text-text-secondary">
                      Title
                    </label>
                    <input
                      placeholder="Attachment name"
                      value={newAttachment.title}
                      onChange={(e) =>
                        setNewAttachment((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default  "
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-2 block font-medium text-text-secondary">
                      Type
                    </label>
                    <div className="relative" ref={attachmentRef}>
                      <button
                        className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default  "
                        onClick={() =>
                          setShowAttachmentOptions(!showAttachmentOptions)
                        }
                      >
                        <span className="capitalize flex items-center gap-2">
                          {getAttachmentIcon(newAttachment.type)}
                          {newAttachment.type}
                        </span>
                        <ChevronDown size={16} />
                      </button>
                      {showAttachmentOptions && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden">
                          {(
                            [
                              "image",
                              "video",
                              "audio",
                              "file",
                              "other",
                            ] as const
                          ).map((type) => (
                            <button
                              key={type}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 capitalize text-gray-700 dark:text-gray-300 transition-colors"
                              onClick={() => {
                                setNewAttachment((prev) => ({ ...prev, type }));
                                setShowAttachmentOptions(false);
                              }}
                            >
                              {getAttachmentIcon(type)}
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm mb-2 block font-medium text-text-secondary">
                    URL or Link
                  </label>
                  <input
                    placeholder="https://example.com/file.pdf"
                    value={newAttachment.url}
                    onChange={(e) =>
                      setNewAttachment((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    className="w-full bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default  "
                  />
                </div>

                <button
                  onClick={handleAddAttachment}
                  className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md font-medium justify-center"
                >
                  <Paperclip size={16} />
                  Add Attachment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Activity Log (only show in edit mode) */}
          {!isCreateMode && (
            <div className="w-1/3 p-6 border-l border-border-default">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="font-semibold text-lg text-text-default">
                  Activity Log
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {editedTask.activityLog && editedTask.activityLog.length > 0 ? (
                  editedTask.activityLog
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((activity, index) => (
                      <div
                        key={activity.id || index}
                        className="p-4 rounded-lg  border border-border-default hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Activity
                                size={12}
                                className="text-blue-600 dark:text-blue-400"
                              />
                            </div>
                            <div className="font-semibold text-text-default text-sm capitalize">
                              {activity.action.replace("_", " ")}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {new Date(activity.timestamp).toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {activity.details}
                        </p>
                        {activity.userId && activity.userId !== "system" && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                            by {activity.userId}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No activity recorded yet
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Changes will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isCreateMode ? "Creating new task" : "Editing task"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedTask)}
              className="px-6 py-2.5 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg font-medium"
            >
              {isCreateMode ? "Create Task" : "Save Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDialog;
