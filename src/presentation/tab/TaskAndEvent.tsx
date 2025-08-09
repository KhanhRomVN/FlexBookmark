// FlexBookmark/src/presentation/tab/TaskAndEvent.tsx

import React, { useState, useEffect, useCallback } from "react";
import CalendarPanel from "../components/TaskAndEvent/CalendarPanel";
import TimeLinePanel from "../components/TaskAndEvent/TimeLinePanel";
import DetailPanel from "../components/TaskAndEvent/DetailPanel";
import { fetchGoogleEvents, fetchGoogleTasks } from "../../utils/googleApi";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarEvent | Task | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dữ liệu từ Google API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsData, tasksData] = await Promise.all([
        fetchGoogleEvents(),
        fetchGoogleTasks(),
      ]);

      setEvents(eventsData);
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch data from Google services");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xử lý khi chọn một mục
  const handleSelectItem = (item: CalendarEvent | Task) => {
    setSelectedItem(item);
  };

  // Xử lý khi thay đổi ngày
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedItem(null); // Reset selection when date changes
  };

  // Tính toán kích thước panel
  const calendarWidth = selectedItem ? "30%" : "40%";
  const timelineWidth = selectedItem ? "40%" : "60%";
  const detailWidth = selectedItem ? "30%" : "0%";

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
