import React, { useState, useEffect, useCallback } from "react";
import CalendarPanel from "../components/TaskAndEvent/CalendarPanel";
import TimeLinePanel from "../components/TaskAndEvent/TimeLinePanel";
import { fetchGoogleEvents } from "../../utils/GGCalender";
import { fetchGoogleTasks, fetchGoogleTaskGroups } from "../../utils/GGTask";
import ChromeAuthManager, { AuthState } from "../../utils/chromeAuth";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface Task {
  folder: any;
  id: string;
  title: string;
  due?: Date;
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
      return e.start && isSameDate(e.start, selectedDate);
    } catch {
      return false;
    }
  });

  const filteredTasks = tasks.filter((t) => {
    try {
      return t.due && isSameDate(t.due, selectedDate);
    } catch {
      return false;
    }
  });

  // Show loading spinner during initialization
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
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
                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Kết nối với Google
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Đăng nhập để đồng bộ lịch và công việc từ tài khoản Google của bạn
          </p>

          {authState.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {authState.error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={authState.loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {authState.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
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
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Lịch & Công việc
          </h1>
          {authState.user && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {authState.user.picture && (
                <img
                  src={authState.user.picture}
                  alt={authState.user.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>{authState.user.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
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
            className="p-2 text-red-600 hover:text-red-700 transition-colors"
            title="Đăng xuất"
          >
            <svg
              className="w-5 h-5"
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

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
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
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <CalendarPanel
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            events={events}
            tasks={tasks}
          />
        </div>

        <div className="w-2/3 overflow-y-auto">
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
