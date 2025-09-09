import React, { useState } from "react";
import CalendarPanel from "./components/CalendarPanel";
import TimeLinePanel from "./components/TimeLinePanel";
import EventDialog from "./components/EventDialog";
import { useCalendar } from "./hooks/useCalendar";
import { useAuth } from "../../../contexts/AuthContext";
import type { CalendarEvent } from "./types";
import { PermissionGuard } from "../../components/common/PermissionGuard";

const Calendar: React.FC = () => {
  const {
    selectedDate,
    events,
    loading,
    error,
    authError,
    filteredEvents,
    calendars,
    handleDateChange,
    handleSelectItem,
    handleRefresh,
    handleToggleCalendar,
    handleSaveEvent,
    handleRetryAuth,
  } = useCalendar();

  const { authState, login, logout } = useAuth();

  // State for EventDialog
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  const [createEventHour, setCreateEventHour] = useState<number | null>(null);

  // Handle click on existing event
  const handleSelectEventWithDialog = (event: CalendarEvent) => {
    handleSelectItem(event);
    setSelectedEvent(event);
    setIsCreateMode(false);
    setCreateEventDate(null);
    setCreateEventHour(null);
    setIsEventDialogOpen(true);
  };

  // Handle click on empty slot to create new event
  const handleCreateEvent = (selectedDate: Date, hour: number) => {
    if (!authState.isAuthenticated) {
      return;
    }

    setSelectedEvent(null);
    setIsCreateMode(true);
    setCreateEventDate(selectedDate);
    setCreateEventHour(hour);
    setIsEventDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    setIsCreateMode(false);
    setCreateEventDate(null);
    setCreateEventHour(null);
  };

  // Save event (both edit and create)
  const handleSaveEventWithDialog = (event: CalendarEvent) => {
    if (handleSaveEvent) {
      handleSaveEvent(event);
    }
    handleCloseDialog();
  };

  return (
    <PermissionGuard>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/30">
        {!authState.isAuthenticated ? (
          // Show unified authentication UI from PermissionGuard
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md mx-4">
              {/* Logo */}
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-xl">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6 6m0-6l-6 6"
                    />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
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
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Kết nối với Google
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Đăng nhập để sử dụng tất cả tính năng của FlexBookmark với quyền
                truy cập đầy đủ
              </p>
              {authState.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
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
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      {authState.error}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={login}
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                      </svg>
                      <span>Đăng nhập với Google</span>
                    </>
                  )}
                </div>
              </button>
              <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                Bạn sẽ được chuyển hướng đến Google để cấp tất cả quyền cần
                thiết
              </p>
            </div>
          </div>
        ) : (
          // Show calendar content if authenticated with all permissions
          <>
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
                          d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6 6m0-6l-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        Lịch Google
                      </h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Quản lý thời gian hiệu quả
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="group relative p-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-50"
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                        0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={logout}
                    className="group p-2.5 text-red-600 hover:text-red-700
                    transition-all duration-200 rounded-xl hover:bg-red-50
                    dark:hover:bg-red-950/50"
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
                        d="M17 16l4-4m0 0l-4-4m4
                        4H7m6 4v1a3 3 0 01-3
                        3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Authentication Error Alert */}
              {authError && error && (
                <div className="mx-4 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
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
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Lỗi Xác Thực
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {error}
                      </p>
                      <button
                        onClick={handleRetryAuth}
                        disabled={loading}
                        className="mt-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-md transition-colors"
                      >
                        {loading ? "Đang xử lý..." : "Đăng nhập lại"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* General Error Alert */}
              {!authError && error && (
                <div className="mx-4 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Thông Báo
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {error}
                      </p>
                      <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="mt-2 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-md transition-colors"
                      >
                        {loading ? "Đang thử lại..." : "Thử lại"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main content - Only show if authenticated and no auth errors */}
            <div className="flex flex-1 overflow-hidden gap-1">
              <div
                className="w-1/4 min-w-[300px] bg-white/60 dark:bg-slate-800/60
                  backdrop-blur-xl rounded-r-2xl shadow-xl border-r border-slate-200/50
                  dark:border-slate-700/50 overflow-hidden"
              >
                <CalendarPanel
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  events={events}
                  calendars={calendars}
                  onToggleCalendar={handleToggleCalendar}
                />
              </div>
              <div
                className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm
                  rounded-l-2xl shadow-xl overflow-hidden"
              >
                <TimeLinePanel
                  date={selectedDate}
                  events={filteredEvents}
                  onSelectItem={handleSelectEventWithDialog}
                  onDateChange={handleDateChange}
                  onCreateEvent={handleCreateEvent}
                  loading={loading}
                  error={!authError ? error : null}
                />
              </div>
            </div>

            {/* Event Dialog */}
            <EventDialog
              isOpen={isEventDialogOpen}
              onClose={handleCloseDialog}
              event={selectedEvent}
              onSave={handleSaveEventWithDialog}
              isCreateMode={isCreateMode}
              initialDate={createEventDate || undefined}
              initialHour={createEventHour || undefined}
            />
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default Calendar;
