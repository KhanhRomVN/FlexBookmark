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
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
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

// Helper function to get difficulty badge info
const getDifficultyBadge = (difficultyLevel: number | string) => {
  const difficulty =
    typeof difficultyLevel === "string"
      ? parseInt(difficultyLevel)
      : difficultyLevel;

  switch (difficulty) {
    case 1:
      return { emoji: "🟢", text: "Easy" };
    case 2:
      return { emoji: "🟡", text: "Medium" };
    case 3:
      return { emoji: "🟠", text: "Hard" };
    case 4:
      return { emoji: "🔴", text: "Very Hard" };
    case 5:
      return { emoji: "🟣", text: "Expert" };
    default:
      return { emoji: "⚪", text: "Unknown" };
  }
};

// Helper function to get habit type badge info
const getHabitTypeBadge = (habitType: string) => {
  switch (habitType) {
    case "good":
      return {
        emoji: "✅",
        text: "Good Habit",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      };
    case "bad":
      return {
        emoji: "❌",
        text: "Bad Habit",
        color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      };
    default:
      return {
        emoji: "⚪",
        text: "Habit",
        color: "bg-gray-100 dark:bg-gray-700",
      };
  }
};

// Helper function to lighten a hex color for trail
const lightenColor = (hex: string, percent: number): string => {
  // Remove # if present
  const color = hex.replace("#", "");

  // Parse r, g, b values
  const num = parseInt(color, 16);
  const r = num >> 16;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Lighten each component
  const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
  const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
  const newB = Math.min(255, Math.floor(b + (255 - b) * percent));

  // Convert back to hex
  return `#${((newR << 16) | (newG << 8) | newB)
    .toString(16)
    .padStart(6, "0")}`;
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
  const difficultyBadge = getDifficultyBadge(habit.difficultyLevel);
  const habitTypeBadge = getHabitTypeBadge(habit.habitType);

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

  // Get progress bar colors using habit's colorCode
  const getProgressColors = () => {
    const primaryColor = habit.colorCode || "#6b7280"; // fallback to gray if no colorCode

    return {
      pathColor: primaryColor,
      trailColor: "transparent", // No trail color - only show progress
    };
  };

  const progressColors = getProgressColors();

  // Get border colors using habit's colorCode
  const getBorderStyles = () => {
    const primaryColor = habit.colorCode || "#ef4444"; // fallback to red if no colorCode
    return {
      borderLeftColor: primaryColor,
      "--hover-border-color": primaryColor,
    };
  };

  const borderStyles = getBorderStyles();

  return (
    <div
      className="relative p-3 rounded-lg border border-border-default hover:border-[var(--hover-border-color)] transition-colors duration-200"
      style={
        {
          borderLeftColor: borderStyles.borderLeftColor,
          borderLeftWidth: "2px",
          "--hover-border-color": borderStyles["--hover-border-color"],
        } as React.CSSProperties
      }
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        {/* Left Section - Completion Checkbox with Progress Circle */}
        <div className="flex-shrink-0 relative">
          {progress ? (
            <div className="w-10 h-10 relative">
              <CircularProgressbar
                value={progress.percentage}
                strokeWidth={5}
                styles={buildStyles({
                  pathColor: progressColors.pathColor,
                  trailColor: progressColors.trailColor,
                  strokeLinecap: "round",
                })}
              />
              <button
                onClick={onToggleComplete}
                disabled={loading}
                className={`absolute inset-0 m-auto w-8 h-8 rounded-full flex items-center justify-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isCompleted ? (
                  <span className="text-base">{habit.emoji}</span>
                ) : (
                  <span className="text-base opacity-60">{habit.emoji}</span>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleComplete}
              disabled={loading}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
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
                <span className="text-sm">{habit.emoji}</span>
              ) : (
                <span className="text-sm opacity-60">{habit.emoji}</span>
              )}
            </button>
          )}
        </div>

        {/* Middle Section - Habit Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            {/* Habit Name */}
            <h3 className="font-semibold text-text-primary text-sm truncate">
              {habit.name}
            </h3>
          </div>

          {/* Habit Details */}
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            {/* Habit Type Badge */}
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${habitTypeBadge.color}`}
            >
              {habitTypeBadge.emoji}
              <span>{habitTypeBadge.text}</span>
            </span>

            {/* Difficulty Badge */}
            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md">
              {difficultyBadge.emoji}
              <span>{difficultyBadge.text}</span>
            </span>

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
