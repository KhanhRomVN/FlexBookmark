import React, { useState, useEffect } from "react";
import { useHabitData } from "./hooks/useHabitData";
import type { Habit } from "./hooks/useHabitData";

const HabitManager: React.FC = () => {
  const {
    authState,
    habits,
    habitLogs,
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
    handleLogHabit,
    handleRefresh,
    handleForceReauth,
  } = useHabitData();

  // Habit management states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: "",
    description: "",
    frequency: "daily",
    targetCount: 1,
    color: "#3b82f6",
  });

  // Get current date stats
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayLogs = habitLogs.filter((log) => log.date === todayStr);
  const completedToday = todayLogs.filter((log) => log.completed).length;

  const handleCreateSubmit = async () => {
    if (!newHabit.name?.trim()) return;

    try {
      await handleCreateHabit({
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency as "daily" | "weekly" | "monthly",
        targetCount: newHabit.targetCount || 1,
        color: newHabit.color,
      });

      setNewHabit({
        name: "",
        description: "",
        frequency: "daily",
        targetCount: 1,
        color: "#3b82f6",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const existingLog = todayLogs.find((log) => log.habitId === habitId);

    try {
      await handleLogHabit({
        date: todayStr,
        habitId,
        completed: !existingLog?.completed,
        note: "",
      });
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
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

          {/* Permission Status */}
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
                  {habits.length}
                </p>
                <p className="text-sm text-slate-600">Tổng thói quen</p>
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
                  {completedToday}
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
                  {habits.length - completedToday}
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
                  {habits.length > 0
                    ? Math.round((completedToday / habits.length) * 100)
                    : 0}
                  %
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
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Thói quen của bạn
            </h2>
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

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const todayLog = todayLogs.find(
                (log) => log.habitId === habit.id
              );
              const isCompleted = todayLog?.completed || false;

              return (
                <div
                  key={habit.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      ></div>
                      <h3 className="font-semibold text-slate-900">
                        {habit.name}
                      </h3>
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

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-500">
                      <span className="capitalize">
                        {habit.frequency === "daily"
                          ? "Hàng ngày"
                          : habit.frequency === "weekly"
                          ? "Hàng tuần"
                          : "Hàng tháng"}
                      </span>
                      {habit.targetCount > 1 && ` • ${habit.targetCount} lần`}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {habit.currentCount}/{habit.targetCount}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
                      isCompleted
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                  </button>
                </div>
              );
            })}

            {habits.length === 0 && !loading && (
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
                  Chưa có thói quen nào
                </h3>
                <p className="text-slate-600 mb-4">
                  Hãy tạo thói quen đầu tiên để bắt đầu hành trình cải thiện bản
                  thân
                </p>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên thói quen
                </label>
                <input
                  type="text"
                  value={editingHabit ? editingHabit.name : newHabit.name}
                  onChange={(e) => {
                    if (editingHabit) {
                      setEditingHabit({
                        ...editingHabit,
                        name: e.target.value,
                      });
                    } else {
                      setNewHabit({ ...newHabit, name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nhập tên thói quen..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={
                    editingHabit
                      ? editingHabit.description
                      : newHabit.description
                  }
                  onChange={(e) => {
                    if (editingHabit) {
                      setEditingHabit({
                        ...editingHabit,
                        description: e.target.value,
                      });
                    } else {
                      setNewHabit({ ...newHabit, description: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Mô tả chi tiết về thói quen..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tần suất
                  </label>
                  <select
                    value={
                      editingHabit ? editingHabit.frequency : newHabit.frequency
                    }
                    onChange={(e) => {
                      const frequency = e.target.value as
                        | "daily"
                        | "weekly"
                        | "monthly";
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, frequency });
                      } else {
                        setNewHabit({ ...newHabit, frequency });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số lần mục tiêu
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={
                      editingHabit
                        ? editingHabit.targetCount
                        : newHabit.targetCount
                    }
                    onChange={(e) => {
                      const targetCount = parseInt(e.target.value) || 1;
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, targetCount });
                      } else {
                        setNewHabit({ ...newHabit, targetCount });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Màu sắc
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingHabit ? editingHabit.color : newHabit.color}
                    onChange={(e) => {
                      if (editingHabit) {
                        setEditingHabit({
                          ...editingHabit,
                          color: e.target.value,
                        });
                      } else {
                        setNewHabit({ ...newHabit, color: e.target.value });
                      }
                    }}
                    className="w-12 h-8 border border-slate-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">
                    Chọn màu đại diện cho thói quen
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingHabit(null);
                  setNewHabit({
                    name: "",
                    description: "",
                    frequency: "daily",
                    targetCount: 1,
                    color: "#3b82f6",
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={
                  editingHabit
                    ? () => {
                        handleUpdateHabit(editingHabit);
                        setEditingHabit(null);
                      }
                    : handleCreateSubmit
                }
                disabled={
                  !(editingHabit?.name?.trim() || newHabit.name?.trim())
                }
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {editingHabit ? "Cập nhật" : "Tạo thói quen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
