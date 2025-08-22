// src/presentation/components/TaskManager/TaskDialog/components/DateTimeSection.tsx
import React, { useState, useCallback } from "react";
import ModernDateTimePicker from "../../../../components/common/ModernDateTimePicker";
import { Calendar, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Task, Status } from "../../../../types/task";
import { formatDisplayDate, formatDisplayTime } from "../utils/taskTransitions";

// Inline validation utilities
const combineDateTime = (date: Date | null, time: Date | null): Date | null => {
  if (!date) return null;
  const combined = new Date(date);
  if (time) {
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  }
  return combined;
};

const isDateTimeInPast = (date: Date | null, time: Date | null): boolean => {
  if (!date) return false;
  const dateTime = combineDateTime(date, time);
  return dateTime ? dateTime < new Date() : false;
};

const isDateTimeRangeInvalid = (
  startDate: Date | null,
  startTime: Date | null,
  dueDate: Date | null,
  dueTime: Date | null
): boolean => {
  if (!startDate || !dueDate) return false;
  const startDateTime = combineDateTime(startDate, startTime);
  const dueDateTime = combineDateTime(dueDate, dueTime);
  return startDateTime && dueDateTime ? dueDateTime < startDateTime : false;
};

// Inline validation dialog component
interface ValidationDialogProps {
  isOpen: boolean;
  type: "overdue" | "invalid-range";
  dueDate?: Date | null;
  dueTime?: Date | null;
  onComplete: () => void;
  onOverdue: () => void;
  onCancel: () => void;
}

const ValidationDialog: React.FC<ValidationDialogProps> = ({
  isOpen,
  type,
  dueDate,
  dueTime,
  onComplete,
  onOverdue,
  onCancel,
}) => {
  if (!isOpen) return null;

  const formatDateTime = (date: Date | null, time: Date | null) => {
    if (!date) return "";
    const dateStr = date.toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (time) {
      const timeStr = time.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateStr} lúc ${timeStr}`;
    }
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {type === "overdue"
                ? "Task Đã Quá Hạn"
                : "Thời Gian Không Hợp Lệ"}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {type === "overdue"
              ? `Thời gian due date/time bạn đã chọn (${formatDateTime(
                  dueDate,
                  dueTime
                )}) đã qua. Vui lòng chọn hành động phù hợp:`
              : "Due date/time không thể nhỏ hơn start date/time. Vui lòng điều chỉnh lại thời gian."}
          </p>

          {type === "overdue" && (
            <div className="space-y-3">
              <button
                onClick={onComplete}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 text-left group"
              >
                <CheckCircle size={20} className="text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                    Task đã hoàn thành
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Đánh dấu task là đã hoàn thành (Done)
                  </div>
                </div>
              </button>

              <button
                onClick={onOverdue}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 text-left group"
              >
                <AlertTriangle size={20} className="text-red-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                    Task chưa hoàn thành
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Đánh dấu task là quá hạn (Overdue)
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-100 dark:border-gray-800">
          {type === "invalid-range" ? (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Đã hiểu
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
interface DateTimeSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  handleSystemStatusChange?: (
    newStatus: Status,
    additionalFields?: Partial<Task>
  ) => void; // NEW: Add this prop
  isCreateMode: boolean;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  editedTask,
  handleChange,
  handleSystemStatusChange, // NEW: Accept this prop
  isCreateMode,
}) => {
  const [validationDialog, setValidationDialog] = useState<{
    isOpen: boolean;
    type: "overdue" | "invalid-range";
    pendingDueDate?: Date | null;
    pendingDueTime?: Date | null;
  }>({ isOpen: false, type: "overdue" });

  // Ref to store success callback from ModernDateTimePicker
  const validationSuccessCallback = React.useRef<(() => void) | null>(null);

  const isStartDateTimeSet = editedTask.startDate && editedTask.startTime;

  // Auto-correct due date/time to prevent invalid range
  const preventInvalidRange = useCallback(
    (newDueDate: Date | null, newDueTime: Date | null) => {
      if (!editedTask.startDate || !newDueDate)
        return { dueDate: newDueDate, dueTime: newDueTime };

      if (
        isDateTimeRangeInvalid(
          editedTask.startDate,
          editedTask.startTime,
          newDueDate,
          newDueTime
        )
      ) {
        return {
          dueDate: editedTask.startDate,
          dueTime: editedTask.startTime,
        };
      }

      return { dueDate: newDueDate, dueTime: newDueTime };
    },
    [editedTask.startDate, editedTask.startTime]
  );

  const handleDueDateChange = useCallback(
    (newDueDate: Date | null) => {
      if (!newDueDate) {
        handleChange("dueDate", null);
        return;
      }

      // Prevent invalid range
      const corrected = preventInvalidRange(newDueDate, editedTask.dueTime);

      // If corrected, apply the correction
      if (
        corrected.dueDate !== newDueDate ||
        corrected.dueTime !== editedTask.dueTime
      ) {
        handleChange("dueDate", corrected.dueDate);
        handleChange("dueTime", corrected.dueTime);
        return;
      }

      // Just apply the date change without validation (validation will happen on "Done" click)
      handleChange("dueDate", newDueDate);
    },
    [editedTask, handleChange, preventInvalidRange]
  );

  const handleDueTimeChange = useCallback(
    (newDueTime: Date | null) => {
      // Prevent invalid range
      const corrected = preventInvalidRange(editedTask.dueDate, newDueTime);

      // If corrected, apply the correction
      if (corrected.dueTime !== newDueTime) {
        handleChange("dueTime", corrected.dueTime);
        return;
      }

      // Just apply the time change without validation (validation will happen on "Done" click)
      handleChange("dueTime", newDueTime);
    },
    [editedTask, handleChange, preventInvalidRange]
  );

  // Custom validation function for ModernDateTimePicker
  const handleDateTimeValidation = useCallback(
    (
      finalStartDate: Date | null,
      finalDueDate: Date | null,
      onSuccess: () => void
    ) => {
      // Store the success callback
      validationSuccessCallback.current = onSuccess;

      // Only validate in edit mode and if due date/time is set
      if (isCreateMode || !finalDueDate) {
        onSuccess();
        return true;
      }

      // Extract time from the final due date
      const finalDueTime = finalDueDate;

      // Check for overdue
      if (isDateTimeInPast(finalDueDate, finalDueTime)) {
        setValidationDialog({
          isOpen: true,
          type: "overdue",
          pendingDueDate: finalDueDate,
          pendingDueTime: finalDueTime,
        });
        return false; // Prevent the date/time from being applied immediately
      }

      onSuccess();
      return true; // Allow the date/time to be applied
    },
    [isCreateMode]
  );

  const handleValidationComplete = useCallback(() => {
    const now = new Date();

    // Apply pending date/time changes and set status via system method
    if (handleSystemStatusChange) {
      handleSystemStatusChange("done", {
        dueDate: validationDialog.pendingDueDate,
        dueTime: validationDialog.pendingDueTime,
        actualEndDate: now,
        actualEndTime: now,
      });
    } else {
      // Fallback to old method
      if (validationDialog.pendingDueDate !== undefined) {
        handleChange("dueDate", validationDialog.pendingDueDate);
      }
      if (validationDialog.pendingDueTime !== undefined) {
        handleChange("dueTime", validationDialog.pendingDueTime);
      }
      handleChange("status", "done" as Status);
      handleChange("actualEndDate", now);
      handleChange("actualEndTime", now);
    }

    setValidationDialog({ isOpen: false, type: "overdue" });

    // Call validation success callback to close ModernDateTimePicker
    if (validationSuccessCallback.current) {
      validationSuccessCallback.current();
    }
  }, [validationDialog, handleChange, handleSystemStatusChange]);

  const handleValidationOverdue = useCallback(() => {
    // Apply pending date/time changes and set status via system method
    if (handleSystemStatusChange) {
      handleSystemStatusChange("overdue", {
        dueDate: validationDialog.pendingDueDate,
        dueTime: validationDialog.pendingDueTime,
      });
    } else {
      // Fallback to old method
      if (validationDialog.pendingDueDate !== undefined) {
        handleChange("dueDate", validationDialog.pendingDueDate);
      }
      if (validationDialog.pendingDueTime !== undefined) {
        handleChange("dueTime", validationDialog.pendingDueTime);
      }
      handleChange("status", "overdue" as Status);
    }

    setValidationDialog({ isOpen: false, type: "overdue" });

    // Call validation success callback to close ModernDateTimePicker
    if (validationSuccessCallback.current) {
      validationSuccessCallback.current();
    }
  }, [validationDialog, handleChange, handleSystemStatusChange]);

  const handleValidationCancel = useCallback(() => {
    setValidationDialog({ isOpen: false, type: "overdue" });
    // Don't call success callback when canceling
    validationSuccessCallback.current = null;
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernDateTimePicker
          selectedDate={editedTask.startDate ?? null}
          selectedTime={editedTask.startTime ?? null}
          onDateChange={(date) => handleChange("startDate", date)}
          onTimeChange={(time) => handleChange("startTime", time)}
          label="Start Date & Time"
          color="green"
          placeholder="Select start date & time"
        />

        <ModernDateTimePicker
          selectedDate={editedTask.dueDate ?? null}
          selectedTime={editedTask.dueTime ?? null}
          onDateChange={handleDueDateChange}
          onTimeChange={handleDueTimeChange}
          onValidation={handleDateTimeValidation}
          label="Due Date & Time"
          color="red"
          placeholder={
            isStartDateTimeSet
              ? "Select due date & time"
              : "Set start date & time first"
          }
          disabled={!isStartDateTimeSet}
        />
      </div>

      {/* Validation info */}
      {isStartDateTimeSet && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          💡 <strong>Lưu ý:</strong> Due date/time không thể nhỏ hơn start
          date/time.
          {!isCreateMode &&
            " Nếu bạn đặt due time trong quá khứ, hệ thống sẽ hỏi trạng thái task khi bạn click 'Done'."}
        </div>
      )}

      {/* Actual start/end dates display */}
      {!isCreateMode &&
        (editedTask.actualStartDate || editedTask.actualEndDate) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          {formatDisplayDate(editedTask.actualStartDate)}
                        </div>
                        {editedTask.actualStartTime && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDisplayTime(editedTask.actualStartTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                          {formatDisplayDate(editedTask.actualEndDate)}
                        </div>
                        {editedTask.actualEndTime && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDisplayTime(editedTask.actualEndTime)}
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

      {/* Task duration display */}
      {editedTask.startDate && editedTask.dueDate && (
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
                    (new Date(editedTask.dueDate).getTime() -
                      new Date(editedTask.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{" "}
                day(s)
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                From {formatDisplayDate(editedTask.startDate)} to{" "}
                {formatDisplayDate(editedTask.dueDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Dialog */}
      <ValidationDialog
        isOpen={validationDialog.isOpen}
        type={validationDialog.type}
        dueDate={validationDialog.pendingDueDate}
        dueTime={validationDialog.pendingDueTime}
        onComplete={handleValidationComplete}
        onOverdue={handleValidationOverdue}
        onCancel={handleValidationCancel}
      />
    </>
  );
};

export default DateTimeSection;
