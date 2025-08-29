// src/presentation/tab/HabitManager/components/HabitCard.tsx
import React from "react";
import {
  Habit,
  HabitCategory,
  DifficultyLevel,
  calculateHabitStats,
} from "../types/habit";

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
  const getCategoryIcon = (category: HabitCategory) => {
    const icons = {
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
    return icons[category] || icons.other;
  };

  const getDifficultyColor = (level: DifficultyLevel) => {
    const colors = {
      1: "text-green-600 bg-green-100",
      2: "text-yellow-600 bg-yellow-100",
      3: "text-orange-600 bg-orange-100",
      4: "text-red-600 bg-red-100",
      5: "text-purple-600 bg-purple-100",
    };
    return colors[level];
  };

  const stats = calculateHabitStats(habit);

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: habit.colorCode }}
            ></div>
            {habit.emoji && <span className="text-lg">{habit.emoji}</span>}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{habit.name}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                {getCategoryIcon(habit.category)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                  habit.difficultyLevel
                )}`}
              >
                Mức {habit.difficultyLevel}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  habit.habitType === "good"
                    ? "text-green-700 bg-green-100"
                    : "text-red-700 bg-red-100"
                }`}
              >
                {habit.habitType === "good" ? "Tốt" : "Xấu"}
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="Chỉnh sửa"
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
              className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
              title={habit.isArchived ? "Khôi phục" : "Lưu trữ"}
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
                  d="M5 8l4 4m0 0l4-4m-4 4V3"
                />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Xóa"
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

      {habit.description && (
        <p className="text-sm text-slate-600 mb-4">{habit.description}</p>
      )}

      {/* Habit Progress Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {habit.habitType === "good" ? "Mục tiêu" : "Giới hạn"}:
          </span>
          <span className="font-medium">
            {habit.habitType === "good" ? habit.goal || 1 : habit.limit || 0}
            {habit.unit && ` ${habit.unit}`}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Chuỗi hiện tại:</span>
          <span className="font-bold text-green-600">
            {habit.currentStreak} ngày
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tỉ lệ hoàn thành:</span>
          <span className="font-medium">
            {stats.completionRate.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Today's Action Button */}
      {!habit.isArchived && (
        <button
          onClick={onToggleComplete}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
            isCompleted
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          {isCompleted ? "Đã hoàn thành hôm nay" : "Đánh dấu hoàn thành"}
        </button>
      )}
    </div>
  );
};

export default HabitCard;
