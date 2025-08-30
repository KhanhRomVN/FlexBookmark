import React, { useState } from "react";
import { Habit } from "../../types/habit";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  completedCount?: number; // For habits with goal/limit > 1
  onToggleComplete: () => void;
  onSkip?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  loading?: boolean;
  showActions?: boolean;
  subtaskCount?: number;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  completedCount = 0,
  onToggleComplete,
  onSkip,
  onEdit,
  onArchive,
  onDelete,
  loading = false,
  showActions = true,
  subtaskCount = 0,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Get difficulty stars
  const getDifficultyStars = (level: number): string => {
    return "⭐".repeat(level);
  };

  // Get completion progress for habits with goal/limit > 1
  const getCompletionProgress = () => {
    const target = habit.habitType === "good" ? habit.goal : habit.limit;
    if (!target || target === 1) return null;
    return { completed: completedCount, target };
  };

  // Get completion button style based on progress
  const getCompletionButtonStyle = () => {
    const progress = getCompletionProgress();

    if (isCompleted) {
      return "bg-green-500 border-green-500 text-white";
    }

    if (progress) {
      const percentage = (progress.completed / progress.target) * 100;
      const borderColor =
        percentage > 0 ? "border-green-400" : "border-border-default";
      return `border-2 ${borderColor} hover:border-green-400 text-gray-400 hover:text-green-500`;
    }

    return "border-2 border-border-default hover:border-green-400 text-gray-400 hover:text-green-500";
  };

  // Render completion button content
  const renderCompletionButton = () => {
    if (loading) {
      return (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      );
    }

    if (isCompleted) {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }

    const progress = getCompletionProgress();
    if (progress && progress.target > 1) {
      return (
        <span className="text-xs font-semibold">
          {progress.completed}/{progress.target}
        </span>
      );
    }

    return <div className="w-3 h-3 rounded-full border-2 border-current" />;
  };

  // Render partial progress ring for habits with goal/limit > 1
  const renderProgressRing = () => {
    const progress = getCompletionProgress();
    if (!progress || progress.target === 1) return null;

    const percentage = (progress.completed / progress.target) * 100;
    const circumference = 2 * Math.PI * 18; // radius = 18
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg
        className="absolute inset-0 w-12 h-12 transform -rotate-90"
        viewBox="0 0 40 40"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-200"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-green-500 transition-all duration-300"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div
      className="relative p-4 rounded-xl border bg-card-background border-border-default hover:border-border-hover transition-all duration-200"
      style={{ borderLeftColor: habit.colorCode, borderLeftWidth: "4px" }}
    >
      {/* Row 1: Title and Completion */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-text-secondary flex-shrink-0">
            {getDifficultyStars(habit.difficultyLevel)}
          </span>
          <h3 className="font-semibold text-text-primary text-lg truncate">
            {habit.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Skip button for habits with goal/limit > 1 */}
          {getCompletionProgress() && onSkip && (
            <button
              onClick={onSkip}
              disabled={loading}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          )}

          {/* Completion button */}
          <div className="relative">
            <button
              onClick={onToggleComplete}
              disabled={loading}
              className={`relative w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${getCompletionButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {renderProgressRing()}
              <div className="relative z-10">{renderCompletionButton()}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Info and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-text-secondary flex-1 min-w-0">
          {/* Start Date + Time */}
          {(habit.startDate || habit.startTime) && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {habit.startDate && formatDate(habit.startDate)}
              {habit.startTime && ` ${habit.startTime}`}
            </span>
          )}

          {/* Subtasks */}
          {subtaskCount > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {subtaskCount}
            </span>
          )}

          {/* Category */}
          {habit.category && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {habit.category}
            </span>
          )}

          {/* Tags count */}
          {habit.tags.length > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              {habit.tags.length}
            </span>
          )}
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-border-default z-20">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onArchive();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                  >
                    {habit.isArchived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-red-50 hover:text-red-600 last:rounded-b-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
