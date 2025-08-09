// FlexBookmark/src/presentation/tab/TaskAndEvent.tsx

import React, { useState, useEffect, useCallback } from "react";
import CalendarPanel from "../components/TaskAndEvent/CalendarPanel";
import TimeLinePanel from "../components/TaskAndEvent/TimeLinePanel";
import DetailPanel from "../components/TaskAndEvent/DetailPanel";
import { fetchGoogleEvents, fetchGoogleTasks } from "../../utils/googleApi";
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

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
  id: string;
  title: string;
  due?: Date;
  completed: boolean;
  notes?: string;
}

const TaskAndEvent: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [token, setToken] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarEvent | Task | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Silent check for existing Firebase auth
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        setToken(idToken);
        setAuthStatus("authenticated");
        return true;
      } catch (err) {
        console.error("Error retrieving token:", err);
      }
    }
    setAuthStatus("unauthenticated");
    return false;
  }, []);

  // Fetch data after authentication
  const fetchData = useCallback(async () => {
    if (authStatus !== "authenticated" || !token) return;
    setLoading(true);
    try {
      const [eventsData, tasksData] = await Promise.all([
        fetchGoogleEvents(token),
        fetchGoogleTasks(token),
      ]);
      setEvents(eventsData);
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      console.error("API Error:", err);
      setError("Lỗi kết nối với Google");
    } finally {
      setLoading(false);
    }
  }, [authStatus]);

  // Initialize authentication and data
  useEffect(() => {
    (async () => {
      const ok = await checkAuth();
      if (ok) {
        fetchData();
      }
    })();
  }, [checkAuth, fetchData]);

  // Trigger interactive Firebase login
  const handleLogin = () => {
    setAuthStatus("loading");
    chrome.runtime.sendMessage(
      { type: "getToken", interactive: true },
      (response: { token?: string; error?: string }) => {
        if (chrome.runtime.lastError || !response.token) {
          console.error(
            "Sign-in error:",
            chrome.runtime.lastError || response.error
          );
          setAuthStatus("unauthenticated");
          setError(
            response.error || "Authentication failed. Please try again."
          );
        } else {
          setToken(response.token);
          setAuthStatus("authenticated");
          fetchData();
        }
      }
    );
  };

  // Select item handlers
  const handleSelectItem = (item: CalendarEvent | Task) =>
    setSelectedItem(item);
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedItem(null);
  };

  // Panel widths
  const calendarWidth = selectedItem ? "30%" : "40%";
  const timelineWidth = selectedItem ? "40%" : "60%";
  const detailWidth = selectedItem ? "30%" : "0%";

  // Show login prompt if unauthenticated
  if (authStatus === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Cần đăng nhập Google</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Kết nối với tài khoản Google để đồng bộ lịch và công việc
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập với Google
          </button>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div
        className="h-full transition-all duration-300 ease-in-out overflow-y-auto"
        style={{ width: calendarWidth }}
      >
        <CalendarPanel
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          events={events}
          tasks={tasks}
        />
      </div>

      <div
        className="h-full transition-all duration-300 ease-in-out border-l border-r border-gray-200 dark:border-gray-700"
        style={{ width: timelineWidth }}
      >
        <TimeLinePanel
          date={selectedDate}
          events={events.filter(
            (e) => e.start.toDateString() === selectedDate.toDateString()
          )}
          tasks={tasks.filter(
            (t) => t.due && t.due.toDateString() === selectedDate.toDateString()
          )}
          onSelectItem={handleSelectItem}
          loading={loading}
          error={error}
        />
      </div>

      {selectedItem && (
        <div
          className="h-full transition-all duration-300 ease-in-out overflow-y-auto"
          style={{ width: detailWidth }}
        >
          <DetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TaskAndEvent;
