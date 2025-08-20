// src/presentation/components/TaskManager/DateTimeStatusDialog.tsx
import React, { useState, useEffect } from "react";
import { Task, Status } from "../../../../types/task";
import { formatDisplayTime } from "./../../TaskDialog/utils/taskTransitions";
import { determineTaskStatus } from "../../../../tab/TaskManager/hooks/useTaskHelpers";

interface DateTimeStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    startDate: Date | null,
    dueDate: Date | null,
    status: Status
  ) => void;
  currentTask: Task;
  targetStatus: Status;
}

const DateTimeStatusDialog: React.FC<DateTimeStatusDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentTask,
  targetStatus,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(
    currentTask.startDate ? new Date(currentTask.startDate) : null
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    currentTask.dueDate ? new Date(currentTask.dueDate) : null
  );
  const [startTime, setStartTime] = useState<string>(
    currentTask.startTime ? formatDisplayTime(currentTask.startTime) : ""
  );
  const [dueTime, setDueTime] = useState<string>(
    currentTask.dueTime ? formatDisplayTime(currentTask.dueTime) : ""
  );
  const [previewStatus, setPreviewStatus] = useState<Status>(targetStatus);

  // Suggested date options
  const dateOptions = [
    {
      id: "today",
      label: "Today",
      getStartDate: () => new Date(),
      getDueDate: () => {
        const date = new Date();
        date.setHours(23, 59, 59);
        return date;
      },
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      getStartDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0);
        return date;
      },
      getDueDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(17, 0, 0);
        return date;
      },
    },
    {
      id: "next_week",
      label: "Next Week",
      getStartDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + (7 - date.getDay()));
        date.setHours(9, 0, 0);
        return date;
      },
      getDueDate: () => {
        const date = new Date();
        date.setDate(date.getDate() + (7 - date.getDay() + 4));
        date.setHours(17, 0, 0);
        return date;
      },
    },
    {
      id: "custom",
      label: "Custom",
      getStartDate: () => startDate,
      getDueDate: () => dueDate,
    },
  ];

  // Update preview status when dates change
  useEffect(() => {
    const previewTask = {
      ...currentTask,
      startDate,
      dueDate,
      status: targetStatus,
    };
    setPreviewStatus(determineTaskStatus(previewTask));
  }, [startDate, dueDate, currentTask, targetStatus]);

  const handleApplySuggestion = (option: (typeof dateOptions)[0]) => {
    const newStartDate = option.getStartDate();
    const newDueDate = option.getDueDate();

    setStartDate(newStartDate);
    setDueDate(newDueDate);

    if (newStartDate) {
      setStartTime(formatDisplayTime(newStartDate));
    }
    if (newDueDate) {
      setDueTime(formatDisplayTime(newDueDate));
    }
  };

  const handleTimeChange = (type: "start" | "due", value: string) => {
    const [hours, minutes] = value.split(":").map(Number);

    if (type === "start" && startDate) {
      const newDate = new Date(startDate);
      newDate.setHours(hours, minutes);
      setStartDate(newDate);
      setStartTime(value);
    } else if (type === "due" && dueDate) {
      const newDate = new Date(dueDate);
      newDate.setHours(hours, minutes);
      setDueDate(newDate);
      setDueTime(value);
    }
  };

  const handleConfirm = () => {
    // Apply time to dates
    let finalStartDate = startDate;
    let finalDueDate = dueDate;

    if (finalStartDate && startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      finalStartDate.setHours(hours, minutes);
    }

    if (finalDueDate && dueTime) {
      const [hours, minutes] = dueTime.split(":").map(Number);
      finalDueDate.setHours(hours, minutes);
    }

    onConfirm(finalStartDate, finalDueDate, previewStatus);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Schedule Task
        </h2>

        {/* Suggested Date Options */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Quick Schedule
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {dateOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleApplySuggestion(option)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date and Time Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Start Date & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange("start", e.target.value)}
                className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Due Date & Time (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate ? dueDate.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setDueDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => handleTimeChange("due", e.target.value)}
                className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Status Preview */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resulting Status:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                previewStatus === "backlog"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  : previewStatus === "todo"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                  : previewStatus === "in-progress"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  : previewStatus === "overdue"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              }`}
            >
              {previewStatus.toUpperCase()}
            </span>
          </div>
          {previewStatus !== targetStatus && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Note: Based on your date selection, the task will be in{" "}
              {previewStatus} instead of {targetStatus}.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeStatusDialog;
