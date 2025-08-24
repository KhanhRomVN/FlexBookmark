import React, { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import type { CalendarEvent } from "../../types/calendar";

interface CalendarPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  calendars: any[];
  onToggleCalendar?: (calendarId: string) => void;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({
  selectedDate,
  onDateChange,
  events,
  calendars = [],
  onToggleCalendar,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const dueDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: dueDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const eventsByDate = useMemo(() => {
    const dateMap: { [dateKey: string]: number } = {};

    // Process events
    events.forEach((event) => {
      const eventStart =
        event.start instanceof Date
          ? event.start
          : parseISO(event.start as string);
      const dayKey = startOfDay(eventStart).toISOString();
      dateMap[dayKey] = (dateMap[dayKey] || 0) + 1;
    });

    return dateMap;
  }, [events]);

  const getDayEvents = (day: Date) => {
    const dayKey = startOfDay(day).toISOString();
    return eventsByDate[dayKey] || 0;
  };

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    let totalEvents = 0;

    Object.values(eventsByDate).forEach((count) => {
      totalEvents += count;
    });

    return { totalEvents };
  }, [eventsByDate]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={prevMonth}
          className="group p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
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

        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            {format(currentMonth, "MMMM")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {format(currentMonth, "yyyy")}
          </p>
        </div>

        <button
          onClick={nextMonth}
          className="group p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
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

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 py-3"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1 mb-6">
        {days.map((day, index) => {
          const eventCount = getDayEvents(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasActivity = eventCount > 0;

          return (
            <button
              key={index}
              onClick={() => onDateChange(day)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 hover:scale-105 min-h-[60px]
                ${
                  isCurrentMonth
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-500"
                } 
                ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl ring-4 ring-blue-200 dark:ring-blue-800"
                    : isToday
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-300 dark:ring-blue-700"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }
                ${
                  hasActivity && !isSelected && !isToday
                    ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                    : ""
                }`}
            >
              <span
                className={`text-base font-bold mb-1 ${
                  isSelected ? "text-white" : ""
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Activity indicators */}
              <div className="flex items-center justify-center gap-1 min-h-[12px]">
                {eventCount > 0 && (
                  <div
                    className={`flex items-center gap-0.5 ${
                      isSelected ? "text-blue-100" : "text-blue-500"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-blue-200" : "bg-blue-500"
                      } animate-pulse`}
                    ></div>
                    {eventCount > 1 && (
                      <span className="text-xs font-semibold">
                        {eventCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover effect */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
              )}

              {/* Today indicator */}
              {isToday && !isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white dark:border-slate-800 animate-bounce"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
              />
            </svg>
            Tổng quan tháng
          </h3>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            {format(currentMonth, "MMM yyyy")}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-700/30 rounded-xl border border-slate-200/30 dark:border-slate-600/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
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
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Sự kiện
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lịch hẹn & cuộc họp
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {monthlySummary.totalEvents}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              sự kiện
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {monthlySummary.totalEvents > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
              <span>Hoạt động trong tháng</span>
              <span>{monthlySummary.totalEvents} tổng cộng</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, monthlySummary.totalEvents * 4)}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Calendars List Section */}
      <div className="bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14-7v7m0 0v7m0-7h-7v7h7v-7z"
              />
            </svg>
            Danh sách lịch
          </h3>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            {calendars.length} lịch
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {calendars.length > 0 ? (
            calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-700/30 rounded-xl border border-slate-200/30 dark:border-slate-600/30 hover:bg-white/90 dark:hover:bg-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{
                      backgroundColor: calendar.backgroundColor || "#3B82F6",
                    }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
                      {calendar.summary || "Unnamed Calendar"}
                    </p>
                    {calendar.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {calendar.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onToggleCalendar?.(calendar.id)}
                  className="group p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  title={calendar.selected ? "Ẩn lịch" : "Hiện lịch"}
                >
                  {calendar.selected !== false ? (
                    <svg
                      className="w-4 h-4 text-green-500 group-hover:text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <svg
                className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6 6m0-6l-6 6"
                />
              </svg>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chưa có lịch nào
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
