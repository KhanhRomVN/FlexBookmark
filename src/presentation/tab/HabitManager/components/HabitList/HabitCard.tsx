import React, { useState, useEffect, useRef } from "react";
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
  onToggleComplete: () => Promise<void>;
  onSkip?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  loading?: boolean;
  showActions?: boolean;
  completedCount?: number;
  isSelected?: boolean;
  onSelect?: () => void;
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
        text: "Good",
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      };
    case "bad":
      return {
        emoji: "❌",
        text: "Bad",
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

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggleComplete,
  onEdit,
  onArchive,
  onDelete,
  showActions = true,
  completedCount = 0,
  isSelected = false,
  onSelect,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(isCompleted);
  const [localCompletedCount, setLocalCompletedCount] =
    useState(completedCount);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync với props khi thay đổi
  useEffect(() => {
    setLocalCompleted(isCompleted);
    setLocalCompletedCount(completedCount);
  }, [isCompleted, completedCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Get completion progress for habits with goal/limit > 1
  const getCompletionProgress = () => {
    const target = habit.habitType === "good" ? habit.goal : habit.limit;
    const current = localCompletedCount || 0;

    if (!target || target <= 1) return null;

    return {
      completed: current,
      target,
      percentage: Math.min(100, (current / target) * 100),
    };
  };

  const handleToggleComplete = async () => {
    if (localLoading) return;

    setLocalLoading(true);

    // Cập nhật UI ngay lập tức
    const newCompleted = !localCompleted;
    setLocalCompleted(newCompleted);

    // Tính toán count mới
    const progress = getCompletionProgress();
    if (progress) {
      const newCount = newCompleted
        ? Math.min(localCompletedCount + 1, progress.target)
        : Math.max(localCompletedCount - 1, 0);
      setLocalCompletedCount(newCount);
    }

    try {
      await onToggleComplete();
    } catch (error) {
      // Rollback nếu có lỗi
      setLocalCompleted(isCompleted);
      setLocalCompletedCount(completedCount);
      console.error("Toggle failed:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on the dropdown button or progress circle
    if (
      (e.target as HTMLElement).closest(".dropdown-button") ||
      (e.target as HTMLElement).closest(".progress-circle")
    ) {
      return;
    }

    if (onSelect) {
      onSelect();
    }
  };

  const handleDropdownButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    e.preventDefault(); // Prevent any default behavior
    setShowDropdown((prev) => !prev);
  };

  const handleDropdownSelect = (value: string) => {
    setShowDropdown(false);
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
      className={`relative p-3 rounded-lg border border-border-default hover:border-[var(--hover-border-color)] transition-colors duration-200 cursor-pointer ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
      style={
        {
          borderLeftColor: borderStyles.borderLeftColor,
          borderLeftWidth: "2px",
          "--hover-border-color": borderStyles["--hover-border-color"],
        } as React.CSSProperties
      }
      onClick={handleCardClick}
      tabIndex={0}
      ref={dropdownRef}
    >
      <div className="flex items-center gap-3">
        {/* Left Section - Completion Checkbox with Progress Circle */}
        <div className="flex-shrink-0 relative progress-circle">
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
                onClick={handleToggleComplete}
                disabled={localLoading}
                className={`absolute inset-0 m-auto w-8 h-8 rounded-full flex items-center justify-center ${
                  localLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {localLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : localCompleted ? (
                  <span className="text-base">{habit.emoji}</span>
                ) : (
                  <span className="text-base opacity-60">{habit.emoji}</span>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleToggleComplete}
              disabled={localLoading}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                localLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } border-2`}
              style={{
                borderColor: localCompleted
                  ? habit.colorCode
                  : "var(--border-default)",
              }}
            >
              {localLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : localCompleted ? (
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
                  {localCompletedCount}/{progress.target}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Actions Menu */}
        {showActions && (
          <div className="flex-shrink-0 relative">
            <button
              onClick={handleDropdownButtonClick}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full transition-all duration-200 dropdown-button"
              type="button"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDropdown && (
              <CustomDropdown
                options={dropdownOptions}
                onSelect={handleDropdownSelect}
                align="right"
                width="w-36"
                className="absolute top-full right-0 z-50 mt-1"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
