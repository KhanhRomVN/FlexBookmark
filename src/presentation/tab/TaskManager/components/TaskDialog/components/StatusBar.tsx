import React from "react";
import { Status, Task } from "../../../types/task";

interface StatusBarProps {
  currentStatus: Status;
  suggestedStatus?: Status | null;
  onStatusChange: (newStatus: Status) => void;
  effectiveStatus?: Status;
  task?: Task;
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

const hasIncompleteRequiredSubtasks = (task: Task | null): boolean => {
  if (!task?.subtasks) return false;
  return task.subtasks.some(
    (subtask) => subtask.requiredCompleted && !subtask.completed
  );
};

const StatusBar: React.FC<StatusBarProps> = ({
  currentStatus,
  suggestedStatus,
  onStatusChange,
  effectiveStatus,
  task,
}) => {
  const displayStatus = effectiveStatus || currentStatus;
  const currentIndex = statusOptions.findIndex(
    (s) => s.value === displayStatus
  );
  const currentStatusObj = statusOptions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / statusOptions.length) * 100;

  const hasSuggestion = suggestedStatus && suggestedStatus !== currentStatus;

  const handleStatusClick = (status: Status) => {
    // Block "done" status if there are incomplete required subtasks
    if (status === "done" && hasIncompleteRequiredSubtasks(task ?? null)) {
      return; // Do nothing
    }
    onStatusChange(status);
  };

  return (
    <div className="flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/60 dark:border-gray-700/60 shadow-sm min-w-fit">
      {hasSuggestion && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Suggested:{" "}
            {statusOptions.find((s) => s.value === suggestedStatus)?.label}
          </span>
          <button
            onClick={() => {
              if (
                suggestedStatus === "done" &&
                hasIncompleteRequiredSubtasks(task ?? null)
              ) {
                return;
              }
              onStatusChange(suggestedStatus);
            }}
            disabled={
              suggestedStatus === "done" &&
              hasIncompleteRequiredSubtasks(task ?? null)
            }
            className={`text-xs font-semibold underline transition-colors ${
              suggestedStatus === "done" &&
              hasIncompleteRequiredSubtasks(task ?? null)
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            }`}
          >
            Apply
          </button>
        </div>
      )}

      <div className="flex items-center gap-6">
        {statusOptions.map((status, index) => {
          const isActive = displayStatus === status.value;
          const isPassed = index <= currentIndex;
          const isSuggested =
            suggestedStatus === status.value &&
            suggestedStatus !== currentStatus;
          const isDoneDisabled =
            status.value === "done" &&
            hasIncompleteRequiredSubtasks(task ?? null);

          return (
            <div key={status.value} className="relative group">
              <button
                onClick={() => handleStatusClick(status.value as Status)}
                disabled={isDoneDisabled}
                className={`
                  relative text-xs font-semibold tracking-wider transition-all duration-300 whitespace-nowrap
                  ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : isPassed
                      ? isDoneDisabled
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                      : isSuggested && !isDoneDisabled
                      ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      : isDoneDisabled
                      ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                  }
                  ${isDoneDisabled ? "opacity-50" : ""}
                `}
              >
                {status.label}
                {isSuggested && !isDoneDisabled && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                {isActive && (
                  <div
                    className={`
                    absolute -bottom-1 left-0 right-0 h-0.5 ${status.barColor} rounded-full
                    animate-in slide-in-from-left-3 duration-300
                  `}
                  />
                )}
              </button>

              {/* Tooltip for disabled Done button */}
              {isDoneDisabled && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Complete all required subtasks first
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-[120px]">
        <div
          className={`
            h-full ${currentStatusObj?.barColor || "bg-gray-400"} rounded-full
            transition-all duration-700 ease-out
            shadow-sm
            ${hasSuggestion ? "animate-pulse" : ""}
          `}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        {statusOptions.map((status, index) => {
          const isActive = displayStatus === status.value;
          const isPassed = index <= currentIndex;
          const isSuggested =
            suggestedStatus === status.value &&
            suggestedStatus !== currentStatus;
          const isDoneDisabled =
            status.value === "done" &&
            hasIncompleteRequiredSubtasks(task ?? null);

          return (
            <div key={`dot-${status.value}`} className="relative group">
              <button
                onClick={() => handleStatusClick(status.value as Status)}
                disabled={isDoneDisabled}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300 relative
                  ${
                    isDoneDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:scale-125"
                  }
                  ${
                    isActive
                      ? `${status.dotColor} shadow-md ring-2 ring-white dark:ring-gray-800 ring-opacity-60`
                      : isPassed
                      ? `${status.dotColor} opacity-80`
                      : isSuggested && !isDoneDisabled
                      ? `${status.dotColor} opacity-60 animate-pulse`
                      : "bg-gray-300 dark:bg-gray-600 opacity-40"
                  }
                `}
              >
                {isSuggested && !isDoneDisabled && (
                  <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-30 animate-ping" />
                )}
              </button>

              {/* Tooltip for disabled Done dot */}
              {isDoneDisabled && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Complete all required subtasks first
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusBar;
