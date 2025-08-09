// FlexBookmark/src/presentation/components/TaskAndEvent/CalendarPanel.tsx

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
} from "date-fns";
import { CalendarEvent, Task } from "../../tab/TaskAndEvent";

interface CalendarPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  tasks: Task[];
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({
  selectedDate,
  onDateChange,
  events,
  tasks,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate }).reduce<
      Date[][]
    >((acc, day, index) => {
      if (index % 7 === 0) acc.push([]);
      acc[acc.length - 1].push(day);
      return acc;
    }, []);
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Đếm sự kiện và công việc cho ngày cụ thể
  const getDayEventsCount = (day: Date) => {
    const dayEvents = events.filter((e) =>
      isSameDay(parseISO(e.start.toString()), day)
    );
    const dayTasks = tasks.filter(
      (t) => t.due && isSameDay(parseISO(t.due.toString()), day)
    );
    return dayEvents.length + dayTasks.length;
  };

  return (
    <div className="h-full p-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          &lt;
        </button>
        <h2 className="text-xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          &gt;
        </button>
      </div>

      <div
        className="flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: "calc(100% - 60px)" }}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-4"
          >
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const dayEventsCount = getDayEventsCount(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <button
                    key={dayIndex}
                    onClick={() => onDateChange(day)}
                    className={`h-14 flex flex-col items-center justify-center rounded-lg transition-all
                      ${
                        isCurrentMonth
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-500"
                      } 
                      ${
                        isSelected
                          ? "bg-blue-500 text-white dark:bg-blue-600"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <span className="text-sm">{format(day, "d")}</span>
                    {dayEventsCount > 0 && (
                      <span
                        className={`text-xs ${
                          isSelected
                            ? "text-white"
                            : "text-blue-500 dark:text-blue-400"
                        }`}
                      >
                        {dayEventsCount}{" "}
                        {dayEventsCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPanel;
