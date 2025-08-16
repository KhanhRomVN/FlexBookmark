import React, { useMemo, useState, useEffect } from "react";
import {
  format,
  parseISO,
  getHours,
  getMinutes,
  isSameDay,
  addDays,
  startOfDay,
  endOfDay,
  isToday,
  isSameHour,
  isSameMinute,
  addHours,
} from "date-fns";
import { CalendarEvent, Task } from "../../tab/TaskAndEvent";

interface TimeLinePanelProps {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  onSelectItem: (item: CalendarEvent | Task) => void;
  loading: boolean;
  error: string | null;
}

const TimeLinePanel: React.FC<TimeLinePanelProps> = ({
  date,
  events,
  tasks,
  onSelectItem,
  loading,
  error,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper function to safely parse dates
  const safeParseDate = (dateValue: Date | string | undefined): Date | null => {
    if (!dateValue) return null;

    try {
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }

      const parsed = parseISO(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.warn("Failed to parse date:", dateValue, error);
      return null;
    }
  };

  const itemsByHour = useMemo(() => {
    const hourMap: Record<number, (CalendarEvent | Task)[]> = {};

    // Initialize hours
    for (let hour = 0; hour < 24; hour++) {
      hourMap[hour] = [];
    }

    // Process events for the selected date
    events.forEach((event) => {
      const startDate = safeParseDate(event.start);
      if (startDate && isSameDay(startDate, date)) {
        const hour = getHours(startDate);
        hourMap[hour].push(event);
      }
    });

    // Process tasks for the selected date
    tasks.forEach((task) => {
      const dueDate = safeParseDate(task.due);
      if (dueDate && isSameDay(dueDate, date)) {
        const hour = getHours(dueDate);
        hourMap[hour].push(task);
      }
    });

    // Sort items within each hour by time
    Object.keys(hourMap).forEach((hourKey) => {
      const hour = parseInt(hourKey);
      hourMap[hour].sort((a, b) => {
        const aTime = safeParseDate("start" in a ? a.start : a.due);
        const bTime = safeParseDate("start" in b ? b.start : b.due);

        if (!aTime || !bTime) return 0;
        return aTime.getTime() - bTime.getTime();
      });
    });

    return hourMap;
  }, [events, tasks, date]);

  const hasItems = useMemo(() => {
    return Object.values(itemsByHour).some((items) => items.length > 0);
  }, [itemsByHour]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const currentTimePosition = useMemo(() => {
    if (!isToday(date)) return null;

    const now = new Date();
    const hour = getHours(now);
    const minute = getMinutes(now);
    return hour + minute / 60;
  }, [currentTime, date]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang tải sự kiện và công việc...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 p-4">
        <div className="text-center text-red-500 dark:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Vui lòng kiểm tra kết nối tài khoản Google của bạn
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">
          {format(date, "EEEE, MMMM d, yyyy")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {events.length + tasks.length} sự kiện và công việc
        </p>
      </div>

      <div className="flex-1 overflow-auto relative">
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-20 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: `${60 + (currentTimePosition / 24) * (24 * 64)}px` }}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}

        <div className="flex">
          {/* Time column */}
          <div className="w-20 shrink-0 bg-gray-50 dark:bg-gray-900">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="h-16 border-b border-gray-100 dark:border-gray-700 flex items-center justify-end pr-2 text-sm text-gray-500 dark:text-gray-400"
              >
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div
            className={`flex-1 border-l border-gray-100 dark:border-gray-700 ${
              isToday(date) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
            }`}
          >
            {Array.from({ length: 24 }).map((_, hour) => {
              const items = itemsByHour[hour] || [];

              return (
                <div
                  key={hour}
                  className="h-16 border-b border-gray-100 dark:border-gray-700 relative px-2"
                >
                  {items.map((item, itemIndex) => {
                    const isExpanded = expandedItems.has(item.id);
                    const itemDate = safeParseDate(
                      "start" in item ? item.start : item.due
                    );
                    const minutes = itemDate ? getMinutes(itemDate) : 0;
                    const top = (minutes / 60) * 64;

                    return (
                      <div
                        key={item.id}
                        className={`absolute left-2 right-2 rounded p-2 text-xs cursor-pointer transition-all z-${
                          5 + itemIndex
                        } ${
                          "start" in item
                            ? "bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200"
                            : item.completed
                            ? "bg-green-100 border border-green-200 dark:bg-green-900/30 dark:border-green-800 hover:bg-green-200"
                            : "bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 hover:bg-yellow-200"
                        }`}
                        style={{
                          top: `${top}px`,
                          height: "28px",
                          marginLeft: `${itemIndex * 4}px`,
                          zIndex: 5 + itemIndex,
                        }}
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="flex items-center">
                          <span className="truncate flex-1 font-medium">
                            {item.title}
                          </span>
                          <div className="ml-2 flex items-center gap-1">
                            {itemDate && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-300">
                                {format(itemDate, "h:mm")}
                              </span>
                            )}
                            {"start" in item ? (
                              <span className="bg-blue-500 text-white text-[10px] px-1 rounded">
                                E
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  item.completed
                                    ? "bg-green-500 text-white"
                                    : "bg-yellow-500 text-white"
                                }`}
                              >
                                T
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div
                            className="absolute z-50 top-full left-0 right-0 mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-60"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-medium mb-1">{item.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {itemDate && format(itemDate, "h:mm a")}
                            </div>

                            {"description" in item && item.description && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {item.description}
                              </div>
                            )}

                            {"notes" in item && item.notes && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {item.notes}
                              </div>
                            )}

                            <button
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                              onClick={() => onSelectItem(item)}
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Show empty state for current hour if no items */}
                  {items.length === 0 &&
                    isToday(date) &&
                    getHours(currentTime) === hour && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-dashed border-gray-300 dark:border-gray-600">
                          Trống
                        </span>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall empty state */}
        {!hasItems && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6"
                />
              </svg>
              <p className="text-lg font-medium mb-2">Không có sự kiện nào</p>
              <p className="text-sm">
                Không có sự kiện hoặc công việc nào cho ngày{" "}
                {format(date, "dd/MM/yyyy")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeLinePanel;
