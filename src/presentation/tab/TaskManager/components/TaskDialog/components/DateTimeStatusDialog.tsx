// src/presentation/components/TaskManager/TaskDialog/components/DateTimeStatusDialog.tsx
import React, { useState, useEffect } from "react";
import { Task, Status } from "../../../../../types/task";
import { determineTaskStatus } from "../../../hooks/useTaskHelpers";
import ModernDateTimePicker from "../../../../../components/common/ModernDateTimePicker";
import {
  Calendar,
  Clock,
  Sunrise,
  Sun,
  CalendarDays,
  Zap,
  Palette,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";

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
  const [startTime, setStartTime] = useState<Date | null>(
    currentTask.startTime
      ? new Date(`1970-01-01T${currentTask.startTime}`)
      : null
  );
  const [dueTime, setDueTime] = useState<Date | null>(
    currentTask.dueTime ? new Date(`1970-01-01T${currentTask.dueTime}`) : null
  );
  const [previewStatus, setPreviewStatus] = useState<Status>(targetStatus);
  const [activeTab, setActiveTab] = useState<"quick" | "custom">("quick");

  // Check if start date and time are set to enable due date/time
  const isStartDateTimeSet = startDate && startTime;

  // Clear due date/time when start date/time is cleared
  useEffect(() => {
    if (!isStartDateTimeSet) {
      setDueDate(null);
      setDueTime(null);
    }
  }, [isStartDateTimeSet]);

  // Quick schedule options
  const quickOptions = [
    {
      id: "today",
      label: "Today",
      icon: <Sun size={16} className="text-amber-500" />,
      getDates: () => {
        const start = new Date();
        start.setHours(9, 0, 0, 0);
        const due = new Date();
        due.setHours(17, 0, 0, 0);
        return { start, due };
      },
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      icon: <Sunrise size={16} className="text-blue-500" />,
      getDates: () => {
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);
        const due = new Date(start);
        due.setHours(17, 0, 0, 0);
        return { start, due };
      },
    },
    {
      id: "next_week",
      label: "Next Week",
      icon: <CalendarDays size={16} className="text-purple-500" />,
      getDates: () => {
        const start = new Date();
        const daysUntilMonday = (7 - start.getDay() + 1) % 7 || 7;
        start.setDate(start.getDate() + daysUntilMonday);
        start.setHours(9, 0, 0, 0);

        const due = new Date(start);
        const daysUntilFriday = (7 - due.getDay() + 5) % 7 || 7;
        due.setDate(due.getDate() + daysUntilFriday);
        due.setHours(17, 0, 0, 0);
        return { start, due };
      },
    },
    {
      id: "no_date",
      label: "No Date",
      icon: <X size={16} className="text-gray-500" />,
      getDates: () => ({ start: null, due: null }),
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

  const handleQuickSelect = (option: (typeof quickOptions)[0]) => {
    const { start, due } = option.getDates();
    setStartDate(start);
    setDueDate(due);
    setStartTime(start);
    setDueTime(due);
    if (option.id !== "no_date") setActiveTab("custom");
  };

  const combineDateTime = (
    date: Date | null,
    time: Date | null
  ): Date | null => {
    if (!date) return null;
    if (!time) return date;

    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  };

  const handleConfirm = () => {
    const finalStartDate = combineDateTime(startDate, startTime);
    const finalDueDate = combineDateTime(dueDate, dueTime);
    onConfirm(finalStartDate, finalDueDate, previewStatus);
    onClose();
  };

  const getStatusConfig = (status: Status) => {
    const config = {
      backlog: {
        icon: Calendar,
        color: "text-gray-500 bg-gray-100 dark:bg-gray-800",
      },
      todo: {
        icon: Clock,
        color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      },
      "in-progress": {
        icon: Zap,
        color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
      },
      overdue: {
        icon: AlertTriangle,
        color: "text-red-500 bg-red-100 dark:bg-red-900/30",
      },
      completed: {
        icon: CheckCircle,
        color: "text-green-500 bg-green-100 dark:bg-green-900/30",
      },
    };
    return config[status] || config.todo;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule Task
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set dates and times for your task
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            <button
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${
                activeTab === "quick"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("quick")}
            >
              <Zap size={16} />
              Quick Schedule
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${
                activeTab === "custom"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("custom")}
            >
              <Palette size={16} />
              Custom
            </button>
          </div>

          {/* Quick Schedule Grid */}
          {activeTab === "quick" && (
            <div className="grid grid-cols-2 gap-3">
              {quickOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleQuickSelect(option)}
                  className="flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  {option.icon}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Custom Date/Time Pickers */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <ModernDateTimePicker
                selectedDate={startDate}
                selectedTime={startTime}
                onDateChange={setStartDate}
                onTimeChange={setStartTime}
                label="Start Date & Time"
                color="green"
              />

              <ModernDateTimePicker
                selectedDate={dueDate}
                selectedTime={dueTime}
                onDateChange={setDueDate}
                onTimeChange={setDueTime}
                label="Due Date & Time (Optional)"
                color="red"
                disabled={!isStartDateTimeSet}
                placeholder={
                  isStartDateTimeSet
                    ? "Select due date & time"
                    : "Set start date & time first"
                }
              />
            </div>
          )}

          {/* Status Preview */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resulting Status:
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusConfig(previewStatus).color
                }`}
              >
                {React.createElement(getStatusConfig(previewStatus).icon, {
                  size: 14,
                })}
                <span>{previewStatus}</span>
              </div>
            </div>

            {previewStatus !== targetStatus && (
              <div className="flex items-start gap-2 mt-3 p-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  Status will change from <strong>{targetStatus}</strong> to{" "}
                  <strong>{previewStatus}</strong> based on dates
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {startDate ? (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>
                  {startDate.toLocaleDateString()}
                  {startTime &&
                    ` at ${startTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </span>
              </div>
            ) : (
              "No date set"
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Confirm
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimeStatusDialog;
