import React from "react";
import {
  Tag,
  Target,
  Clock,
  Type,
  Edit3,
  Archive,
  Trash2,
  CheckCircle,
  XCircle,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  Award,
  Flame,
  Activity,
} from "lucide-react";
import { Habit } from "../../types/types";

interface HabitOverviewProps {
  habit: Habit;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const HabitOverview: React.FC<HabitOverviewProps> = ({
  habit,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const [showSubtasks, setShowSubtasks] = React.useState(false);

  const getHabitTypeConfig = (type: string) => {
    return type === "good"
      ? {
          label: "Good Habit",
          icon: CheckCircle,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          borderColor: "border-emerald-200 dark:border-emerald-800/30",
        }
      : {
          label: "Bad Habit",
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          borderColor: "border-red-200 dark:border-red-800/30",
        };
  };

  const getDifficultyConfig = (level: number) => {
    const configs = [
      {
        label: "Very Easy",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        borderColor: "border-emerald-200 dark:border-emerald-800/30",
      },
      {
        label: "Easy",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-200 dark:border-green-800/30",
      },
      {
        label: "Medium",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        borderColor: "border-yellow-200 dark:border-yellow-800/30",
      },
      {
        label: "Hard",
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        borderColor: "border-orange-200 dark:border-orange-800/30",
      },
      {
        label: "Very Hard",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        borderColor: "border-red-200 dark:border-red-800/30",
      },
    ];
    return configs[level - 1] || configs[2];
  };

  const difficultyConfig = getDifficultyConfig(habit.difficultyLevel);
  const habitTypeConfig = getHabitTypeConfig(habit.habitType);

  const todayProgress = habit.dailyCounts[new Date().getDate() - 1] || 0;
  const targetValue =
    habit.habitType === "good" ? habit.goal || 1 : habit.limit || 1;
  const progressPercentage = Math.min(100, (todayProgress / targetValue) * 100);

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {/* Emoji with gradient background */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2"
              style={{
                backgroundColor: habit.colorCode + "20",
                borderColor: habit.colorCode + "40",
              }}
            >
              {habit.emoji || "📝"}
            </div>
            {/* Status indicator */}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ${
                habit.isArchived
                  ? "bg-gray-400"
                  : habit.completedToday
                  ? "bg-emerald-500"
                  : "bg-orange-400"
              }`}
            >
              {!habit.isArchived &&
                (habit.completedToday ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : (
                  <Clock className="w-3 h-3 text-white" />
                ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">
                {habit.name}
              </h1>
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${habitTypeConfig.bgColor} ${habitTypeConfig.color} ${habitTypeConfig.borderColor}`}
                >
                  <habitTypeConfig.icon className="w-3 h-3" />
                  {habitTypeConfig.label}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${difficultyConfig.bgColor} ${difficultyConfig.color} ${difficultyConfig.borderColor}`}
                >
                  {difficultyConfig.label}
                </span>
              </div>
            </div>
            {habit.description && (
              <p className="text-text-secondary text-base leading-relaxed max-w-2xl">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-all duration-200 hover:scale-105 border border-blue-200 dark:border-blue-800/30"
              title="Edit Habit"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl transition-all duration-200 hover:scale-105 border border-amber-200 dark:border-amber-800/30"
              title={habit.isArchived ? "Unarchive" : "Archive"}
            >
              <Archive className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl transition-all duration-200 hover:scale-105 border border-red-200 dark:border-red-800/30"
              title="Delete Habit"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              CURRENT STREAK
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
            {habit.currentStreak}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            {habit.currentStreak === 1 ? "day" : "days"}
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              BEST STREAK
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mb-1">
            {habit.longestStreak}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            personal record
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              TODAY'S PROGRESS
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            {todayProgress}/{targetValue}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {habit.unit || "times"}
          </div>
        </div>

        {/* Category */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              CATEGORY
            </span>
          </div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1 capitalize">
            {habit.category}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            classification
          </div>
        </div>
      </div>

      {/* Today's Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              Today's Achievement
            </span>
          </div>
          <span className="text-sm font-medium text-text-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
              background: `linear-gradient(90deg, ${habit.colorCode}80, ${habit.colorCode})`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-2">
          <span>Start</span>
          <span className="font-medium" style={{ color: habit.colorCode }}>
            {todayProgress} / {targetValue} {habit.unit || "times"}
          </span>
          <span>Target</span>
        </div>
      </div>

      {/* Detailed Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left Column - Basic Information */}
        <div className="space-y-6">
          {/* Schedule Information */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700/50">
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Schedule & Timing
            </h3>
            <div className="space-y-4">
              {habit.startTime && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Preferred Time</span>
                  <span className="font-medium text-text-primary bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    {habit.startTime}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Status</span>
                <span
                  className={`font-medium px-3 py-1 rounded-lg text-sm border ${
                    habit.isArchived
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30"
                  }`}
                >
                  {habit.isArchived ? "Archived" : "Active"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Created</span>
                <span className="font-medium text-text-primary">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          {habit.tags && habit.tags.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800/30">
              <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Tags ({habit.tags.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {habit.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium border border-indigo-200 dark:border-indigo-800/30 transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Target Information */}
        <div className="space-y-6">
          {/* Target Configuration */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/30">
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Daily Target
            </h3>
            <div className="space-y-4">
              {habit.habitType === "good" ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Daily Goal</span>
                    <div className="text-right">
                      <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                        {habit.goal || 1}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        {habit.unit || "times"} per day
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Progress Today</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, progressPercentage)}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">
                        {todayProgress}/{habit.goal || 1}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Daily Limit</span>
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-700 dark:text-red-300">
                        {habit.limit || 1}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        max {habit.unit || "times"} per day
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Usage Today</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-red-100 dark:bg-red-900/30 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, progressPercentage)}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium text-red-700 dark:text-red-300 text-sm">
                        {todayProgress}/{habit.limit || 1}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800/30">
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Performance Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Completion Rate</span>
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  {Math.round(
                    (habit.dailyCounts.filter((count) => count > 0).length /
                      habit.dailyCounts.length) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Completions</span>
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  {habit.dailyCounts.reduce((sum, count) => sum + count, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active Days</span>
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  {habit.dailyCounts.filter((count) => count > 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      {habit.subtasks && habit.subtasks.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center justify-between w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
          >
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <ListChecks className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              Subtasks ({habit.subtasks.filter((st) => st.completed).length}/
              {habit.subtasks.length} completed)
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-text-secondary">
                {Math.round(
                  (habit.subtasks.filter((st) => st.completed).length /
                    habit.subtasks.length) *
                    100
                )}
                %
              </div>
              {showSubtasks ? (
                <ChevronUp className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              )}
            </div>
          </button>

          {showSubtasks && (
            <div className="mt-4 space-y-3">
              {habit.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      subtask.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-emerald-400"
                    }`}
                  >
                    {subtask.completed && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`flex-1 transition-all duration-200 ${
                      subtask.completed
                        ? "line-through text-text-secondary"
                        : "text-text-primary"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  {subtask.completed && (
                    <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      ✓ Done
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HabitOverview;
