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
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const itemsByDate = useMemo(() => {
    const dateMap: { [dateKey: string]: { events: number; tasks: number } } =
      {};

    // Process events
    events.forEach((event) => {
      const eventStart =
        event.start instanceof Date
          ? event.start
          : parseISO(event.start as string);
      const dayKey = startOfDay(eventStart).toISOString();
      if (!dateMap[dayKey]) dateMap[dayKey] = { events: 0, tasks: 0 };
      dateMap[dayKey].events += 1;
    });

    // Process tasks
    tasks.forEach((task) => {
      if (!task.due) return;
      const taskDue =
        task.due instanceof Date ? task.due : parseISO(task.due as string);
      const dayKey = startOfDay(taskDue).toISOString();
      if (!dateMap[dayKey]) dateMap[dayKey] = { events: 0, tasks: 0 };
      dateMap[dayKey].tasks += 1;
    });

    return dateMap;
  }, [events, tasks]);

  const getDayEvents = (day: Date) => {
    const dayKey = startOfDay(day).toISOString();
    return itemsByDate[dayKey] || { events: 0, tasks: 0 };
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <h2 className="text-xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, index) => {
          const { events: eventCount, tasks: taskCount } = getDayEvents(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={index}
              onClick={() => onDateChange(day)}
              className={`flex flex-col items-center justify-start p-1 rounded-lg transition-all
                ${
                  isCurrentMonth
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                } 
                ${
                  isSelected
                    ? "bg-blue-500 text-white dark:bg-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }
                ${
                  isToday && !isSelected
                    ? "ring-2 ring-blue-400 dark:ring-blue-500"
                    : ""
                }`}
            >
              <span className="text-sm font-medium mb-1">
                {format(day, "d")}
              </span>

              <div className="flex flex-wrap justify-center gap-0.5">
                {eventCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
                {taskCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarPanel;
