import React, { useState, useEffect } from "react";
import { useHabitData } from "./hooks/useHabitData";
import type {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  DifficultyLevel,
  calculateHabitStats,
} from "./types/habit";

const HabitManager: React.FC = () => {
  const {
    authState,
    habits,
    loading,
    error,
    needsReauth,
    permissions,
    initialized,
    handleLogin,
    handleLogout,
    handleCreateHabit,
    handleUpdateHabit,
    handleDeleteHabit,
    handleUpdateDailyHabit,
    handleArchiveHabit,
    handleRefresh,
    handleForceReauth,
    getTodayStats,
    getActiveHabits,
  } = useHabitData();

  // Habit management states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedTab, setSelectedTab] = useState<"active" | "archived">(
    "active"
  );
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "all">(
    "all"
  );
  const [filterType, setFilterType] = useState<HabitType | "all">("all");

  const [newHabitForm, setNewHabitForm] = useState<HabitFormData>({
    name: "",
    description: "",
    habitType: "good",
    difficultyLevel: 1,
    goal: 1,
    limit: undefined,
    category: "other",
    tags: [],
    whyReason: "",
    isQuantifiable: true,
    unit: "",
    startTime: "",
    subtasks: [],
    colorCode: "#3b82f6",
    emoji: "",
  });

  // Get current date and today's stats
  const today = new Date();
  const currentDay = today.getDate();
  const todayStats = getTodayStats();

  // Filter habits based on current selections
  const filteredHabits = habits.filter((habit) => {
    const matchesTab =
      selectedTab === "active" ? !habit.isArchived : habit.isArchived;
    const matchesCategory =
      filterCategory === "all" || habit.category === filterCategory;
    const matchesType = filterType === "all" || habit.habitType === filterType;
    return matchesTab && matchesCategory && matchesType;
  });

  const resetForm = () => {
    setNewHabitForm({
      name: "",
      description: "",
      habitType: "good",
      difficultyLevel: 1,
      goal: 1,
      limit: undefined,
      category: "other",
      tags: [],
      whyReason: "",
      isQuantifiable: true,
      unit: "",
      startTime: "",
      subtasks: [],
      colorCode: "#3b82f6",
      emoji: "",
    });
  };

  const handleCreateSubmit = async () => {
    if (!newHabitForm.name?.trim()) return;

    try {
      await handleCreateHabit(newHabitForm);
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleUpdateSubmit = async (habit: Habit) => {
    try {
      await handleUpdateHabit(habit);
      setEditingHabit(null);
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  const handleToggleHabitToday = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const dayIndex = currentDay - 1;
    const currentValue = habit.dailyTracking[dayIndex] || 0;

    try {
      let newValue: number;

      if (habit.habitType === "good") {
        // For good habits, toggle between 0 and goal (or 1 if no goal)
        newValue = currentValue === 0 ? habit.goal || 1 : 0;
      } else {
        // For bad habits, toggle between 0 and limit (or 1 if no limit)
        newValue = currentValue === 0 ? habit.limit || 1 : 0;
      }

      await handleUpdateDailyHabit(habitId, currentDay, newValue);
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const isHabitCompletedToday = (habit: Habit): boolean => {
    const dayIndex = currentDay - 1;
    const value = habit.dailyTracking[dayIndex];

    if (value === null || value === undefined) return false;

    if (habit.habitType === "good") {
      return habit.goal ? value >= habit.goal : value > 0;
    } else {
      return habit.limit ? value <= habit.limit : value === 0;
    }
  };

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

  // Handle authentication states
  if (!authState.isAuthenticated && !authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Đăng nhập Google
          </h3>
          <p className="text-slate-600 mb-6">
            Để sử dụng tính năng quản lý thói quen, vui lòng đăng nhập với các
            quyền:
          </p>
          <div className="text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Google Drive (Lưu trữ files)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg
                className="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Google Sheets (Theo dõi dữ liệu)
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
          </button>
        </div>
      </div>
    );
  }

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Show permission requirements if not all required permissions are granted
  if (
    authState.isAuthenticated &&
    permissions.checked &&
    (needsReauth || !permissions.allRequired)
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.892-.833-2.664 0L3.133 16.5C2.364 18.167 3.326 19 4.866 19z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Cần cấp thêm quyền
          </h3>
          <p className="text-slate-600 mb-4">
            Ứng dụng cần các quyền sau để hoạt động:
          </p>

          <div className="text-left mb-6 space-y-2">
            <div
              className={`flex items-center gap-2 text-sm ${
                permissions.hasDrive ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  permissions.hasDrive ? "text-green-500" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {permissions.hasDrive ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              Google Drive {permissions.hasDrive ? "✓" : "✗"}
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                permissions.hasSheets ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  permissions.hasSheets ? "text-green-500" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {permissions.hasSheets ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              Google Sheets {permissions.hasSheets ? "✓" : "✗"}
            </div>
            {permissions.hasCalendar && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Google Calendar ✓ (Tùy chọn)
              </div>
            )}
          </div>

          <button
            onClick={handleForceReauth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {loading ? "Đang cấp quyền..." : "Cấp quyền bổ sung"}
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking permissions or initializing
  if (
    authState.isAuthenticated &&
    (!permissions.checked ||
      (permissions.allRequired && !initialized && loading))
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        <div className="text-center p-8">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!permissions.checked
              ? "Đang kiểm tra quyền truy cập..."
              : "Đang khởi tạo hệ thống quản lý thói quen..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Quản lý Thói quen
                </h1>
                <p className="text-sm text-slate-500">
                  FlexBookmark - Habit Management System
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="group relative p-2.5 text-slate-600 hover:text-green-600 transition-all duration-200 rounded-xl hover:bg-green-50 disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  loading ? "animate-spin" : "group-hover:rotate-180"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="group p-2.5 text-red-600 hover:text-red-700 transition-all duration-200 rounded-xl hover:bg-red-50"
              title="Đăng xuất"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {getActiveHabits().length}
                </p>
                <p className="text-sm text-slate-600">
                  Thói quen đang hoạt động
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {todayStats.completed}
                </p>
                <p className="text-sm text-slate-600">Hoàn thành hôm nay</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {todayStats.remaining}
                </p>
                <p className="text-sm text-slate-600">Còn lại hôm nay</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {todayStats.completionRate}%
                </p>
                <p className="text-sm text-slate-600">Tỉ lệ hoàn thành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tabs and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab("active")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === "active"
                    ? "bg-green-500 text-white"
                    : "bg-white/60 text-slate-600 hover:bg-white/80"
                }`}
              >
                Đang hoạt động ({getActiveHabits().length})
              </button>
              <button
                onClick={() => setSelectedTab("archived")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === "archived"
                    ? "bg-slate-500 text-white"
                    : "bg-white/60 text-slate-600 hover:bg-white/80"
                }`}
              >
                Lưu trữ ({habits.filter((h) => h.isArchived).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(e.target.value as HabitCategory | "all")
                }
                className="px-3 py-2 bg-white/60 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="health">Sức khỏe</option>
                <option value="fitness">Thể dục</option>
                <option value="productivity">Năng suất</option>
                <option value="mindfulness">Thiền định</option>
                <option value="learning">Học tập</option>
                <option value="social">Xã hội</option>
                <option value="finance">Tài chính</option>
                <option value="creativity">Sáng tạo</option>
                <option value="other">Khác</option>
              </select>

              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as HabitType | "all")
                }
                className="px-3 py-2 bg-white/60 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tất cả loại</option>
                <option value="good">Thói quen tốt</option>
                <option value="bad">Thói quen xấu</option>
              </select>

              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Thêm thói quen
              </button>
            </div>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map((habit) => {
              const isCompletedToday = isHabitCompletedToday(habit);
              const stats = calculateHabitStats(habit);

              return (
                <div
                  key={habit.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: habit.colorCode }}
                        ></div>
                        {habit.emoji && (
                          <span className="text-lg">{habit.emoji}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {habit.name}
                        </h3>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
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
                        onClick={() =>
                          handleArchiveHabit(habit.id, !habit.isArchived)
                        }
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
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
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
                  </div>

                  {habit.description && (
                    <p className="text-sm text-slate-600 mb-4">
                      {habit.description}
                    </p>
                  )}

                  {/* Habit Progress Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {habit.habitType === "good" ? "Mục tiêu" : "Giới hạn"}:
                      </span>
                      <span className="font-medium">
                        {habit.habitType === "good"
                          ? habit.goal || 1
                          : habit.limit || 0}
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
                  {selectedTab === "active" && (
                    <button
                      onClick={() => handleToggleHabitToday(habit.id)}
                      disabled={loading}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
                        isCompletedToday
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isCompletedToday
                        ? "Đã hoàn thành hôm nay"
                        : "Đánh dấu hoàn thành"}
                    </button>
                  )}
                </div>
              );
            })}

            {filteredHabits.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {selectedTab === "active"
                    ? "Chưa có thói quen nào"
                    : "Chưa có thói quen lưu trữ"}
                </h3>
                <p className="text-slate-600 mb-4">
                  {selectedTab === "active"
                    ? "Hãy tạo thói quen đầu tiên để bắt đầu hành trình cải thiện bản thân"
                    : "Các thói quen đã lưu trữ sẽ hiển thị ở đây"}
                </p>
                {selectedTab === "active" && (
                  <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Tạo thói quen đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Habit Dialog */}
      {(isCreateDialogOpen || editingHabit) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
            </h3>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên thói quen *
                  </label>
                  <input
                    type="text"
                    value={editingHabit ? editingHabit.name : newHabitForm.name}
                    onChange={(e) => {
                      if (editingHabit) {
                        setEditingHabit({
                          ...editingHabit,
                          name: e.target.value,
                        });
                      } else {
                        setNewHabitForm({
                          ...newHabitForm,
                          name: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Vd: Uống 2 lít nước mỗi ngày"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={
                      editingHabit
                        ? editingHabit.description || ""
                        : newHabitForm.description || ""
                    }
                    onChange={(e) => {
                      if (editingHabit) {
                        setEditingHabit({
                          ...editingHabit,
                          description: e.target.value,
                        });
                      } else {
                        setNewHabitForm({
                          ...newHabitForm,
                          description: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Mô tả chi tiết về thói quen này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loại thói quen
                  </label>
                  <select
                    value={
                      editingHabit
                        ? editingHabit.habitType
                        : newHabitForm.habitType
                    }
                    onChange={(e) => {
                      const habitType = e.target.value as HabitType;
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, habitType });
                      } else {
                        setNewHabitForm({ ...newHabitForm, habitType });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="good">Thói quen tốt (muốn duy trì)</option>
                    <option value="bad">Thói quen xấu (muốn hạn chế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mức độ khó
                  </label>
                  <select
                    value={
                      editingHabit
                        ? editingHabit.difficultyLevel
                        : newHabitForm.difficultyLevel
                    }
                    onChange={(e) => {
                      const difficultyLevel = parseInt(
                        e.target.value
                      ) as DifficultyLevel;
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, difficultyLevel });
                      } else {
                        setNewHabitForm({ ...newHabitForm, difficultyLevel });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value={1}>Mức 1 - Rất dễ</option>
                    <option value={2}>Mức 2 - Dễ</option>
                    <option value={3}>Mức 3 - Trung bình</option>
                    <option value={4}>Mức 4 - Khó</option>
                    <option value={5}>Mức 5 - Rất khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={
                      editingHabit
                        ? editingHabit.category
                        : newHabitForm.category
                    }
                    onChange={(e) => {
                      const category = e.target.value as HabitCategory;
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, category });
                      } else {
                        setNewHabitForm({ ...newHabitForm, category });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="health">🏥 Sức khỏe</option>
                    <option value="fitness">💪 Thể dục</option>
                    <option value="productivity">⚡ Năng suất</option>
                    <option value="mindfulness">🧘 Thiền định</option>
                    <option value="learning">📚 Học tập</option>
                    <option value="social">👥 Xã hội</option>
                    <option value="finance">💰 Tài chính</option>
                    <option value="creativity">🎨 Sáng tạo</option>
                    <option value="other">📌 Khác</option>
                  </select>
                </div>

                {/* Goal/Limit based on habit type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {(editingHabit
                      ? editingHabit.habitType
                      : newHabitForm.habitType) === "good"
                      ? "Mục tiêu hàng ngày"
                      : "Giới hạn tối đa"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      (editingHabit
                        ? editingHabit.habitType
                        : newHabitForm.habitType) === "good"
                        ? editingHabit
                          ? editingHabit.goal || ""
                          : newHabitForm.goal || ""
                        : editingHabit
                        ? editingHabit.limit || ""
                        : newHabitForm.limit || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      const currentType = editingHabit
                        ? editingHabit.habitType
                        : newHabitForm.habitType;

                      if (editingHabit) {
                        if (currentType === "good") {
                          setEditingHabit({ ...editingHabit, goal: value });
                        } else {
                          setEditingHabit({ ...editingHabit, limit: value });
                        }
                      } else {
                        if (currentType === "good") {
                          setNewHabitForm({ ...newHabitForm, goal: value });
                        } else {
                          setNewHabitForm({ ...newHabitForm, limit: value });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={
                      (editingHabit
                        ? editingHabit.habitType
                        : newHabitForm.habitType) === "good"
                        ? "Vd: 2 (2 lít nước)"
                        : "Vd: 1 (tối đa 1 ly cà phê)"
                    }
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-slate-900 mb-4">
                  Tùy chọn nâng cao
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đơn vị đo (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={
                        editingHabit
                          ? editingHabit.unit || ""
                          : newHabitForm.unit || ""
                      }
                      onChange={(e) => {
                        if (editingHabit) {
                          setEditingHabit({
                            ...editingHabit,
                            unit: e.target.value,
                          });
                        } else {
                          setNewHabitForm({
                            ...newHabitForm,
                            unit: e.target.value,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Vd: ly, phút, trang..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Thời gian thực hiện (tùy chọn)
                    </label>
                    <input
                      type="time"
                      value={
                        editingHabit
                          ? editingHabit.startTime || ""
                          : newHabitForm.startTime || ""
                      }
                      onChange={(e) => {
                        if (editingHabit) {
                          setEditingHabit({
                            ...editingHabit,
                            startTime: e.target.value,
                          });
                        } else {
                          setNewHabitForm({
                            ...newHabitForm,
                            startTime: e.target.value,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Lý do/Động lực (tùy chọn)
                    </label>
                    <textarea
                      value={
                        editingHabit
                          ? editingHabit.whyReason || ""
                          : newHabitForm.whyReason || ""
                      }
                      onChange={(e) => {
                        if (editingHabit) {
                          setEditingHabit({
                            ...editingHabit,
                            whyReason: e.target.value,
                          });
                        } else {
                          setNewHabitForm({
                            ...newHabitForm,
                            whyReason: e.target.value,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                      placeholder="Tại sao bạn muốn thay đổi thói quen này?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Màu sắc
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          editingHabit
                            ? editingHabit.colorCode
                            : newHabitForm.colorCode
                        }
                        onChange={(e) => {
                          if (editingHabit) {
                            setEditingHabit({
                              ...editingHabit,
                              colorCode: e.target.value,
                            });
                          } else {
                            setNewHabitForm({
                              ...newHabitForm,
                              colorCode: e.target.value,
                            });
                          }
                        }}
                        className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-sm text-slate-600">
                        Chọn màu đại diện
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Emoji (tùy chọn)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={
                        editingHabit
                          ? editingHabit.emoji || ""
                          : newHabitForm.emoji || ""
                      }
                      onChange={(e) => {
                        if (editingHabit) {
                          setEditingHabit({
                            ...editingHabit,
                            emoji: e.target.value,
                          });
                        } else {
                          setNewHabitForm({
                            ...newHabitForm,
                            emoji: e.target.value,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="💧"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingHabit(null);
                  resetForm();
                }}
                className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={
                  editingHabit
                    ? () => handleUpdateSubmit(editingHabit)
                    : handleCreateSubmit
                }
                disabled={
                  loading ||
                  !(editingHabit?.name?.trim() || newHabitForm.name?.trim())
                }
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading
                  ? "Đang xử lý..."
                  : editingHabit
                  ? "Cập nhật thói quen"
                  : "Tạo thói quen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
