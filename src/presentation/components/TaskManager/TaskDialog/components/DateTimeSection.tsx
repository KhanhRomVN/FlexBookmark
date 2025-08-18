import React from "react";
import ModernDateTimePicker from "../../../../components/common/ModernDateTimePicker";
import { Calendar, Clock } from "lucide-react";
import { Task } from "../../../../types/task";
import { formatDisplayDate, formatDisplayTime } from "../utils/taskTransitions";

interface DateTimeSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  isCreateMode: boolean;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  editedTask,
  handleChange,
  isCreateMode,
}) => {
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
          onDateChange={(date) => handleChange("dueDate", date)}
          onTimeChange={(time) => handleChange("dueTime", time)}
          label="Due Date & Time"
          color="red"
          placeholder="Select due date & time"
        />
      </div>

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
    </>
  );
};

export default DateTimeSection;
