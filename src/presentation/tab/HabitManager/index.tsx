// src/presentation/tab/HabitManager/index.tsx
import React, { useState } from "react";
import { useHabitData } from "./hooks/useHabitData";
import CreateHabitDialog from "./components/CreateHabitDialog";
import HabitCard from "./components/HabitCard";
import {
  Habit,
  HabitFormData,
  HabitType,
  HabitCategory,
  DifficultyLevel,
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

  // Component states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedTab, setSelectedTab] = useState<"active" | "archived">(
    "active"
  );
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "all">(
    "all"
  );
  const [filterType, setFilterType] = useState<HabitType | "all">("all");

  const [habitFormData, setHabitFormData] = useState<HabitFormData>({
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
    setHabitFormData({
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

  const handleCreateSubmit = async (formData: HabitFormData) => {
    await handleCreateHabit(formData);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSubmit = async (habit: Habit) => {
    await handleUpdateHabit(habit);
    setEditingHabit(null);
  };

  const handleToggleHabitToday = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const dayIndex = currentDay - 1;
    const currentValue = habit.dailyTracking[dayIndex] || 0;

    let newValue: number;

    if (habit.habitType === "good") {
      newValue = currentValue === 0 ? habit.goal || 1 : 0;
    } else {
      newValue = currentValue === 0 ? habit.limit || 1 : 0;
    }

    await handleUpdateDailyHabit(habitId, currentDay, newValue);
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

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setIsCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingHabit(null);
    resetForm();
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

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - 60% width - Habit List */}
        <div className="w-3/5 p-6 overflow-auto">
          <div className="max-w-none">
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

            {/* Habits List - Single Column */}
            <div className="space-y-4">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompleted={isHabitCompletedToday(habit)}
                  onToggleComplete={() => handleToggleHabitToday(habit.id)}
                  onEdit={() => openEditDialog(habit)}
                  onArchive={() =>
                    handleArchiveHabit(habit.id, !habit.isArchived)
                  }
                  onDelete={() => handleDeleteHabit(habit.id)}
                  loading={loading}
                  showActions={true}
                />
              ))}

              {filteredHabits.length === 0 && !loading && (
                <div className="text-center py-12">
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

        {/* Right Panel - 40% width - Empty for now */}
        <div className="w-2/5 p-6 border-l border-slate-200/50">
          <div className="h-full bg-white/30 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center">
            <div className="text-center text-slate-500">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Sắp có nội dung</p>
              <p className="text-sm">
                Panel này sẽ hiển thị thống kê và biểu đồ chi tiết
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Habit Dialog */}
      <CreateHabitDialog
        isOpen={isCreateDialogOpen}
        onClose={closeDialog}
        onSubmit={
          editingHabit
            ? () => handleUpdateSubmit(editingHabit)
            : handleCreateSubmit
        }
        editingHabit={editingHabit}
        loading={loading}
        formData={
          editingHabit
            ? {
                name: editingHabit.name,
                description: editingHabit.description,
                habitType: editingHabit.habitType,
                difficultyLevel: editingHabit.difficultyLevel,
                goal: editingHabit.goal,
                limit: editingHabit.limit,
                category: editingHabit.category,
                tags: editingHabit.tags,
                whyReason: editingHabit.whyReason,
                isQuantifiable: editingHabit.isQuantifiable,
                unit: editingHabit.unit,
                startTime: editingHabit.startTime,
                subtasks: editingHabit.subtasks,
                colorCode: editingHabit.colorCode,
                emoji: editingHabit.emoji,
              }
            : habitFormData
        }
        onFormChange={editingHabit ? () => {} : setHabitFormData}
      />
    </div>
  );
};

export default HabitManager;
