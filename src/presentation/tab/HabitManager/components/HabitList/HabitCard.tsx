import React, { useState } from "react";
import { Habit } from "../../types/habit";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  loading?: boolean;
  showActions?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggleComplete,
  onEdit,
  onArchive,
  onDelete,
  loading = false,
  showActions = true,
}) => {
  const [showActions_, setShowActions_] = useState(false);

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      health: "🏥",
      fitness: "💪",
      productivity: "⚡",
      mindfulness: "🧘",
      learning: "📚",
      social: "👥",
      finance: "💰",
      creativity: "🎨",
      other: "📌",
    };
    return icons[category] || "📌";
  };

  // Get difficulty stars
  const getDifficultyStars = (level: number): string => {
    return "⭐".repeat(level);
  };

  // Get habit type badge style
  const getTypeStyle = (habitType: string) => {
    if (habitType === "good") {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Get completion style
  const getCompletionStyle = () => {
    if (isCompleted) {
      return habit.habitType === "good"
        ? "bg-green-50 border-green-200"
        : "bg-green-50 border-green-200";
    }
    return "bg-white border-gray-200 hover:border-gray-300";
  };

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-200 ${getCompletionStyle()}`}
      style={{ borderLeftColor: habit.colorCode, borderLeftWidth: "4px" }}
      onMouseEnter={() => setShowActions_(true)}
      onMouseLeave={() => setShowActions_(false)}
    >
      {/* Main content */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Header with name and badges */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(habit.category)}</span>
              <h3 className="font-semibold text-gray-900 text-lg">
                {habit.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeStyle(
                  habit.habitType
                )}`}
              >
                {habit.habitType === "good" ? "Good" : "Bad"}
              </span>

              <span className="text-sm text-gray-600">
                {getDifficultyStars(habit.difficultyLevel)}
              </span>
            </div>
          </div>

          {/* Description */}
          {habit.description && (
            <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
          )}

          {/* Goal/Limit and Unit */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {habit.habitType === "good" && habit.goal && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Goal: {habit.goal} {habit.unit && habit.unit}
              </span>
            )}

            {habit.habitType === "bad" && habit.limit && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                Limit: {habit.limit} {habit.unit && habit.unit}
              </span>
            )}

            {habit.startTime && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {habit.startTime}
              </span>
            )}
          </div>

          {/* Streak info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-orange-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {habit.currentStreak} streak
            </span>

            <span className="text-gray-500">Best: {habit.longestStreak}</span>
          </div>

          {/* Tags */}
          {habit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {habit.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {habit.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                  +{habit.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Completion toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleComplete}
            disabled={loading}
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              isCompleted
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-400 text-gray-400 hover:text-green-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isCompleted ? (
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
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-current" />
            )}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (showActions_ || loading) && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit habit"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            onClick={onArchive}
            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title={habit.isArchived ? "Unarchive habit" : "Archive habit"}
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
                d="M5 8l4 4m0 0l4-4m-4 4v8m-6-3a9 9 0 1118 0H8a9 9 0 01-8-8z"
              />
            </svg>
          </button>

          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete habit"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default HabitCard;
