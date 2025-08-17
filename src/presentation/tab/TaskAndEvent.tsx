import React, { useState, useEffect, useCallback } from "react";
import CalendarPanel from "../components/TaskAndEvent/CalendarPanel";
import TimeLinePanel from "../components/TaskAndEvent/TimeLinePanel";
import { fetchGoogleEvents } from "../../utils/GGCalender";
import { fetchGoogleTasks, fetchGoogleTaskGroups } from "../../utils/GGTask";
import ChromeAuthManager, { AuthState } from "../../utils/chromeAuth";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface Task {
  endTime: Date | string;
  folder: any;
  id: string;
  title: string;
  due?: Date | string;
  completed: boolean;
  notes?: string;
}

const TaskAndEvent: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarEvent | Task | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [taskLists, setTaskLists] = useState<any[]>([]);

  const authManager = ChromeAuthManager.getInstance();

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authManager.subscribe((newState) => {
      setAuthState(newState);
    });

    // Initialize auth
    authManager.initialize();

    return unsubscribe;
  }, [authManager]);

  // Fetch data when authenticated
  const fetchData = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.user?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      // First, get task lists
      const taskListsData = await fetchGoogleTaskGroups(
        authState.user.accessToken
      );
      setTaskLists(taskListsData);

      // Use the first task list (usually the default one) or '@default'
      const defaultTaskListId =
        taskListsData.length > 0 ? taskListsData[0].id : "@default";

      const [eventsData, tasksData] = await Promise.all([
        fetchGoogleEvents(authState.user.accessToken),
        fetchGoogleTasks(authState.user.accessToken, defaultTaskListId),
      ]);

      setEvents(eventsData);
      setTasks(tasksData);
    } catch (err) {
      console.error("API Error:", err);
      if (err instanceof Error) {
        setError(`Lỗi kết nối với Google APIs: ${err.message}`);
      } else {
        setError("Lỗi kết nối với Google APIs");
      }
    } finally {
      setLoading(false);
    }
  }, [authState.isAuthenticated, authState.user?.accessToken]);

  // Fetch data when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchData();
    }
  }, [authState.isAuthenticated, fetchData]);

  // Handle login
  const handleLogin = async () => {
    try {
      await authManager.login();
    } catch (err) {
      console.error("Login error:", err);
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authManager.logout();
      setEvents([]);
      setTasks([]);
      setTaskLists([]);
      setSelectedItem(null);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSelectItem = (item: CalendarEvent | Task) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchData();
  };

  // Helper function to safely compare dates
  const isSameDate = (date1: Date, date2: Date): boolean => {
    try {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Filter events and tasks for the selected date with error handling
  const filteredEvents = events.filter((e) => {
    try {
      const eventDate = e.start instanceof Date ? e.start : new Date(e.start);
      return isSameDate(eventDate, selectedDate);
    } catch {
      return false;
    }
  });

  const filteredTasks = tasks.filter((t) => {
    try {
      if (!t.due) return false;
      const taskDate = t.due instanceof Date ? t.due : new Date(t.due);
      return isSameDate(taskDate, selectedDate);
    } catch {
      return false;
    }
  });

  // Show loading spinner during initialization
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="text-center p-8">
          <div className="relative mb-8">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Đang khởi tạo...
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vui lòng đợi trong giây lát
          </p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
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
            Đăng nhập để đồng bộ lịch và công việc từ tài khoản Google của bạn
            một cách dễ dàng
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
            onClick={handleLogin}
            disabled={authState.loading}
            className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

            <div className="relative flex items-center justify-center gap-3">
              {authState.loading ? (
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
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </>
              )}
            </div>
          </button>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            Dữ liệu của bạn sẽ được bảo mật và chỉ dùng để đồng bộ thông tin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/30">
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
                  Lịch & Công việc
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quản lý thời gian hiệu quả
                </p>
              </div>
            </div>

            {authState.user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                {authState.user.picture && (
                  <img
                    src={authState.user.picture}
                    alt={authState.user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-blue-100 dark:ring-blue-900"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {authState.user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đã kết nối
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading && (
                <div className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-blue-950/50 animate-pulse"></div>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="group p-2.5 text-red-600 hover:text-red-700 transition-all duration-200 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border-b border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-3 px-4 py-3">
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
            <span className="flex-1 text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden gap-1">
        <div className="w-1/3 min-w-[350px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-r-2xl shadow-xl border-r border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          <CalendarPanel
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            events={events}
            tasks={tasks}
          />
        </div>

        <div className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-l-2xl shadow-xl overflow-hidden">
          <TimeLinePanel
            date={selectedDate}
            events={filteredEvents}
            tasks={filteredTasks}
            onSelectItem={handleSelectItem}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskAndEvent;
