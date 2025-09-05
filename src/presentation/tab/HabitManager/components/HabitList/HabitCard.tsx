import React, { useState } from "react";
import {
  Target,
  Clock,
  Tag,
  Calendar,
  Flame,
  Edit,
  Archive,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Habit } from "../../types/types";
import CustomDropdown, {
  DropdownOption,
} from "../../../../components/common/CustomDropdown";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onSkip?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  loading?: boolean;
  showActions?: boolean;
  completedCount?: number;
}

// Helper function to get difficulty emoji
const getDifficultyEmoji = (difficultyLevel: number | string): string => {
  const difficulty =
    typeof difficultyLevel === "string"
      ? parseInt(difficultyLevel)
      : difficultyLevel;

  switch (difficulty) {
    case 1:
      return "🟢"; // Easy
    case 2:
      return "🟡"; // Medium
    case 3:
      return "🟠"; // Hard
    case 4:
      return "🔴"; // Very Hard
    case 5:
      return "🟣"; // Expert
    default:
      return "⚪"; // Unknown/Default
  }
};

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggleComplete,
  onEdit,
  onArchive,
  onDelete,
  loading = false,
  showActions = true,
  completedCount = 0,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Get completion progress for habits with goal/limit > 1
  const getCompletionProgress = () => {
    const target = habit.habitType === "good" ? habit.goal : habit.limit;
    const current = completedCount || 0;

    if (!target || target <= 1) return null;

    return {
      completed: current,
      target,
      percentage: Math.min(100, (current / target) * 100),
    };
  };

  const progress = getCompletionProgress();

  // Dropdown options
  const dropdownOptions: DropdownOption[] = [
    {
      value: "edit",
      label: "Edit",
      icon: <Edit className="w-3.5 h-3.5" />,
    },
    {
      value: "archive",
      label: habit.isArchived ? "Unarchive" : "Archive",
      icon: <Archive className="w-3.5 h-3.5" />,
    },
    {
      value: "delete",
      label: "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
    },
  ];

  const handleDropdownSelect = (value: string) => {
    switch (value) {
      case "edit":
        onEdit();
        break;
      case "archive":
        onArchive();
        break;
      case "delete":
        onDelete();
        break;
    }
  };

  const progressColorClasses =
    habit.habitType === "good"
      ? {
          bg: "text-green-200 dark:text-green-800",
          fill: "text-green-500 dark:text-green-400",
        }
      : {
          bg: "text-red-200 dark:text-red-800",
          fill: "text-red-500 dark:text-red-400",
        };

  return (
    <div
      className={`relative p-3 rounded-lg border border-border-default`}
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        {/* Left Section - Completion Checkbox with Emoji */}
        <div className="flex-shrink-0 relative">
          {progress && (
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={100}
                strokeDashoffset={100 - progress.percentage}
                className={progressColorClasses.fill}
                strokeLinecap="round"
              />
            </svg>
          )}
          <button
            onClick={onToggleComplete}
            disabled={loading}
            className={`${
              progress ? "absolute inset-0 m-auto w-8 h-8" : "w-10 h-10"
            } rounded-full flex items-center justify-center ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            } border-2`}
            style={{
              borderColor: isCompleted
                ? habit.colorCode
                : "var(--border-default)",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCompleted ? (
              <span className="text-lg">{habit.emoji}</span>
            ) : (
              <span className="text-lg opacity-60">{habit.emoji}</span>
            )}
          </button>
        </div>

        {/* Middle Section - Habit Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Difficulty Emoji */}
            <div className="flex items-center">
              <span className="text-lg">
                {getDifficultyEmoji(habit.difficultyLevel)}
              </span>
            </div>

            {/* Habit Name */}
            <h3 className="font-semibold text-text-primary text-sm truncate">
              {habit.name}
            </h3>
          </div>

          {/* Habit Details */}
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            {habit.tags && habit.tags.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Tag className="w-3 h-3" />
                <span>{habit.tags.length} tags</span>
              </span>
            )}

            {habit.subtasks && habit.subtasks.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                📋
                <span>{habit.subtasks.length} tasks</span>
              </span>
            )}

            <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md">
              <Flame className="w-3 h-3" />
              <span>{habit.currentStreak} streak</span>
            </span>

            {habit.category && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Calendar className="w-3 h-3" />
                <span>{habit.category}</span>
              </span>
            )}

            {habit.startTime && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Clock className="w-3 h-3" />
                <span>{habit.startTime}</span>
              </span>
            )}

            {progress && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
                <Target className="w-3 h-3" />
                <span>
                  {progress.completed}/{progress.target}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Actions Menu */}
        {showActions && (
          <div className="flex-shrink-0 relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <CustomDropdown
              options={dropdownOptions}
              onSelect={handleDropdownSelect}
              align="right"
              width="w-36"
              className={showDropdown ? "block" : "hidden"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
