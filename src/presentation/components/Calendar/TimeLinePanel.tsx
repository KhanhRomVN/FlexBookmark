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
  differenceInMinutes,
  isSameDay,
} from "date-fns";
import type { CalendarEvent } from "../../types/calendar";
import EventCard from "./EventCard";

interface TimeLinePanelProps {
  date: Date;
  events: CalendarEvent[];
  onSelectItem: (item: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
  loading: boolean;
  error: string | null;
}

const TimeLinePanel: React.FC<TimeLinePanelProps> = ({
  date,
  events,
  onSelectItem,
  onDateChange,
  onCreateEvent,
  loading,
  error,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Remove expandedItems state since we're not using inline popups anymore

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

  // Group events by date
  const eventsByDate = useMemo(() => {
    const dateMap: Record<string, CalendarEvent[]> = {};

    // Initialize structure
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      dateMap[dayKey] = [];
    });

    // Process events - filter out events with invalid start dates
    events
      .filter((event) => safeParseDate(event.start) !== null)
      .forEach((event) => {
        const startDate = safeParseDate(event.start)!;
        const dayKey = format(startDate, "yyyy-MM-dd");

        if (dateMap[dayKey]) {
          dateMap[dayKey].push(event);
        }
      });

    return dateMap;
  }, [events, weekDays]);

  const hasEvents = useMemo(() => {
    return Object.values(eventsByDate).some((events) => events.length > 0);
  }, [eventsByDate]);

  // Remove toggleItem function since we're not using it anymore

  // Handle click on time slot to create new event
  const handleTimeSlotClick = (
    day: Date,
    hour: number,
    event: React.MouseEvent
  ) => {
    // Prevent event bubbling from EventCard
    if ((event.target as HTMLElement).closest("[data-event-card]")) {
      return;
    }

    if (onCreateEvent) {
      onCreateEvent(day, hour);
    }
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

  // Helper function to calculate event position and height
  const calculateEventDimensions = (event: CalendarEvent) => {
    const startDate = safeParseDate(event.start);
    const endDate = safeParseDate(event.end) || startDate;

    if (!startDate || !endDate) return null;

    let startHour = getHours(startDate);
    const startMinute = getMinutes(startDate);

    let endHour = getHours(endDate);
    const endMinute = getMinutes(endDate);

    // Convert to our 1-24 system
    if (startHour === 0) startHour = 24;
    if (endHour === 0) endHour = 24;

    // Calculate position (64px per hour, starting from hour 1)
    const topPosition = (startHour - 1) * 64 + (startMinute / 60) * 64;

    // Calculate height
    let durationInMinutes;
    if (isSameDay(startDate, endDate)) {
      // Same day event
      durationInMinutes = differenceInMinutes(endDate, startDate);
    } else {
      // Multi-day event - only show until end of day
      const endOfStartDay = new Date(startDate);
      endOfStartDay.setHours(23, 59, 59, 999);
      durationInMinutes = differenceInMinutes(endOfStartDay, startDate);
    }

    // Minimum height of 30px for very short events
    const height = Math.max(30, (durationInMinutes / 60) * 64);

    return {
      top: topPosition,
      height,
      startHour,
      startMinute,
      endHour,
      endMinute,
      duration: durationInMinutes,
    };
  };

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
            const dayEvents = eventsByDate[dayKey] || [];

            return (
              <div
                key={dayKey}
                className={`w-[calc((100%-5rem)/7)] border-l border-gray-200 dark:border-gray-700 ${
                  isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                } relative`}
              >
                <div className="h-10 text-center py-2 text-xs font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  {format(day, "EEE d")}
                </div>

                {/* Time slots background - Clickable */}
                {Array.from({ length: 24 }).map((_, index) => {
                  const hour = index + 1; // 1 to 24
                  return (
                    <div
                      key={index}
                      className="h-16 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      onClick={(e) => handleTimeSlotClick(day, hour, e)}
                      title={`Tạo sự kiện mới lúc ${format(
                        new Date().setHours(hour === 24 ? 0 : hour, 0),
                        "h:mm a"
                      )}`}
                    />
                  );
                })}

                {/* Events overlay */}
                <div className="absolute top-10 left-0 right-0 bottom-0 pointer-events-none">
                  {dayEvents.map((event, eventIndex) => {
                    const dimensions = calculateEventDimensions(event);
                    if (!dimensions) return null;

                    const totalEvents = dayEvents.length;
                    // If only one event, use full width (95%), otherwise distribute evenly
                    const widthPercent =
                      totalEvents === 1 ? 95 : Math.max(95 / totalEvents, 30);
                    const left =
                      totalEvents === 1 ? 2.5 : (eventIndex * 95) / totalEvents; // Center single event

                    return (
                      <div
                        key={event.id}
                        data-event-card
                        className="pointer-events-auto"
                      >
                        <EventCard
                          event={event}
                          dimensions={dimensions}
                          widthPercent={widthPercent}
                          left={left}
                          zIndex={5 + eventIndex}
                          isExpanded={false} // No longer using expanded state
                          onToggle={() => {}} // No longer needed but keeping for compatibility
                          onSelectItem={onSelectItem}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasEvents && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
