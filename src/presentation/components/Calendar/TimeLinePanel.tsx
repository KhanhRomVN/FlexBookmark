import React, { useMemo, useState, useEffect } from "react";
import {
  format,
  parseISO,
  getHours,
  getMinutes,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
} from "date-fns";
import type { CalendarEvent } from "../../types/calendar";

interface TimeLinePanelProps {
  date: Date;
  events: CalendarEvent[];
  onSelectItem: (item: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
  loading: boolean;
  error: string | null;
}

const TimeLinePanel: React.FC<TimeLinePanelProps> = ({
  date,
  events,
  onSelectItem,
  onDateChange,
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

  // Calculate week days - always start with Monday
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday = 1
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [date]);

  // Navigation functions
  const goToPreviousWeek = () => {
    const prevWeek = subWeeks(date, 1);
    onDateChange(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(date, 1);
    onDateChange(nextWeek);
  };

  const goToCurrentWeek = () => {
    onDateChange(new Date());
  };

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

  // Group events by date and hour - starting from 1 AM
  const eventsByDateAndHour = useMemo(() => {
    const dateMap: Record<string, Record<number, CalendarEvent[]>> = {};

    // Initialize structure - hours 1-24 (1 AM to 12 AM next day)
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      dateMap[dayKey] = {};
      for (let hour = 1; hour <= 24; hour++) {
        dateMap[dayKey][hour] = [];
      }
    });

    // Process events - filter out events with invalid start dates
    events
      .filter((event) => safeParseDate(event.start) !== null)
      .forEach((event) => {
        const startDate = safeParseDate(event.start)!;
        const dayKey = format(startDate, "yyyy-MM-dd");
        let hour = getHours(startDate);
        // Convert 0 (midnight) to 24 for our 1-24 system
        if (hour === 0) hour = 24;

        if (dateMap[dayKey] && dateMap[dayKey][hour]) {
          dateMap[dayKey][hour].push(event);
        }
      });

    return dateMap;
  }, [events, weekDays]);

  const hasEvents = useMemo(() => {
    return Object.values(eventsByDateAndHour).some((day) =>
      Object.values(day).some((events) => events.length > 0)
    );
  }, [eventsByDateAndHour]);

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

  // Calculate current time position - adjusted for 1 AM start
  const currentTimePosition = useMemo(() => {
    if (!isToday(date)) return null;

    const now = new Date();
    let hour = getHours(now);
    const minute = getMinutes(now);

    // Convert to our 1-24 system
    if (hour === 0) hour = 24;

    // Position relative to 1 AM start (hour 1 = position 0)
    // Adjusted for header height (40px)
    return hour - 1 + minute / 60;
  }, [currentTime, date]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang tải sự kiện...
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
      {/* Header with navigation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">
            Tuần {format(weekDays[0], "d MMM")} -{" "}
            {format(weekDays[6], "d MMM, yyyy")}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Tuần trước"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Tuần hiện tại"
            >
              Hôm nay
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Tuần sau"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {events.length} sự kiện
        </p>
      </div>

      <div className="flex-1 overflow-auto relative">
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-20 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: `${40 + currentTimePosition * 64}px` }}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}

        <div className="flex">
          {/* Time column - starting from 1 AM, aligned with day headers */}
          <div className="w-20 shrink-0 bg-gray-50 dark:bg-gray-900">
            {/* Empty header space to align with day headers */}
            <div className="h-10 border-b border-gray-200 dark:border-gray-700"></div>

            {/* Time slots */}
            {Array.from({ length: 24 }).map((_, index) => {
              const hour = index + 1; // 1 to 24
              const displayHour = hour === 24 ? 0 : hour; // Display 24 as 0 (midnight)
              return (
                <div
                  key={hour}
                  className="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
                >
                  {format(new Date().setHours(displayHour, 0), "h a")}
                </div>
              );
            })}
          </div>

          {/* Days columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDateAndHour[dayKey] || {};

            return (
              <div
                key={dayKey}
                className={`w-[calc((100%-5rem)/7)] border-l border-gray-200 dark:border-gray-700 ${
                  isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="h-10 text-center py-2 text-xs font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  {format(day, "EEE d")}
                </div>

                {Array.from({ length: 24 }).map((_, index) => {
                  const hour = index + 1; // 1 to 24
                  const events = dayEvents[hour] || [];

                  return (
                    <div
                      key={`${dayKey}-${hour}`}
                      className="h-16 relative px-1 border-b border-gray-100 dark:border-gray-700"
                    >
                      {events.map((event, eventIndex) => {
                        const isExpanded = expandedItems.has(event.id);
                        const eventDate = safeParseDate(event.start);
                        const minutes = eventDate ? getMinutes(eventDate) : 0;
                        const top = (minutes / 60) * 64;
                        const totalEvents = events.length;
                        const widthPercent = 100 / totalEvents;
                        const left = eventIndex * widthPercent;

                        const bgColor =
                          "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
                        const dotColor = "bg-blue-500";

                        return (
                          <div
                            key={`${event.id}-${hour}`}
                            className={`absolute rounded p-1.5 cursor-pointer transition-all text-xs shadow-sm border ${bgColor}`}
                            style={{
                              top: `${top}px`,
                              height: "30px",
                              width: `${widthPercent}%`,
                              left: `${left}%`,
                              zIndex: 5 + eventIndex,
                            }}
                            onClick={() => toggleItem(event.id)}
                          >
                            <div className="flex items-center h-full gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}
                              ></span>
                              <span className="truncate flex-1 font-medium">
                                {event.title}
                              </span>
                              {eventDate && (
                                <span className="text-[10px] text-gray-600 dark:text-gray-300 flex-shrink-0">
                                  {format(eventDate, "h:mm")}
                                </span>
                              )}
                            </div>

                            {isExpanded && (
                              <div
                                className="absolute z-50 top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-60 max-w-80"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="font-medium mb-1 text-sm">
                                  {event.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {eventDate && format(eventDate, "h:mm a")}
                                </div>

                                {event.description && (
                                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
                                    {event.description}
                                  </div>
                                )}

                                {event.location && (
                                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                    📍 {event.location}
                                  </div>
                                )}

                                <button
                                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                                  onClick={() => onSelectItem(event)}
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasEvents && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
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
              <p className="text-sm font-medium mb-1">Không có sự kiện nào</p>
              <p className="text-xs">Không có sự kiện nào trong tuần này</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeLinePanel;
