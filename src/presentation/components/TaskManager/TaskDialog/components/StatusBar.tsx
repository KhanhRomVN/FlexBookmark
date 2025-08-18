import React from "react";
import { Status } from "../../../../types/task";

interface StatusBarProps {
  currentStatus: Status;
  onStatusChange: (newStatus: Status) => void;
}

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

const StatusBar: React.FC<StatusBarProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const currentIndex = statusOptions.findIndex(
    (s) => s.value === currentStatus
  );
  const currentStatusObj = statusOptions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / statusOptions.length) * 100;

  return (
    <div className="flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 dark:border-gray-700/60 shadow-sm min-w-fit">
      <div className="flex items-center gap-6">
        {statusOptions.map((status, index) => {
          const isActive = currentStatus === status.value;
          const isPassed = index <= currentIndex;

          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value as Status)}
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

      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-[120px]">
        <div
          className={`
            h-full ${currentStatusObj?.barColor || "bg-gray-400"} rounded-full
            transition-all duration-700 ease-out
            shadow-sm
          `}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        {statusOptions.map((status, index) => {
          const isActive = currentStatus === status.value;
          const isPassed = index <= currentIndex;

          return (
            <button
              key={`dot-${status.value}`}
              onClick={() => onStatusChange(status.value as Status)}
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

export default StatusBar;
