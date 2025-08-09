// FlexBookmark/src/presentation/components/TaskAndEvent/TimeLinePanel.tsx

import React, { useMemo } from "react";
import { format, parseISO, isSameHour } from "date-fns";
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
  // Tạo timeline từ 0h đến 23h
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(date);
      hour.setHours(i, 0, 0, 0);
      return hour;
    });
  }, [date]);

  // Lấy các mục cho giờ cụ thể
  const getItemsForHour = (hour: Date) => {
    const hourEvents = events.filter((e) =>
      isSameHour(parseISO(e.start.toString()), hour)
    );

    const hourTasks = tasks.filter(
      (t) => t.due && isSameHour(parseISO(t.due.toString()), hour)
    );

    return [...hourEvents, ...hourTasks];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading events and tasks...
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
            Please check your Google account connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">{format(date, "EEEE, MMMM d")}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {events.length + tasks.length} events and tasks
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hours.map((hour, index) => {
          const items = getItemsForHour(hour);

          return (
            <div
              key={index}
              className="border-b border-gray-100 dark:border-gray-700"
            >
              <div className="flex">
                <div className="w-20 py-3 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                  {format(hour, "h a")}
                </div>

                <div className="flex-1 py-3">
                  {items.length === 0 ? (
                    <div className="text-gray-400 dark:text-gray-500 text-sm py-1">
                      No scheduled items
                    </div>
                  ) : (
                    items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        onClick={() => onSelectItem(item)}
                        className={`mb-2 p-3 rounded-lg cursor-pointer transition-all hover:shadow-md
                          ${
                            "start" in item
                              ? "bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              : "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{item.title}</h3>
                          {"start" in item ? (
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                              Event
                            </span>
                          ) : (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                item.completed
                                  ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                                  : "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                              }`}
                            >
                              {item.completed ? "Completed" : "Pending"}
                            </span>
                          )}
                        </div>

                        {"start" in item ? (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {format(parseISO(item.start.toString()), "h:mm a")}{" "}
                            - {format(parseISO(item.end.toString()), "h:mm a")}
                          </p>
                        ) : (
                          item.due && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Due:{" "}
                              {format(parseISO(item.due.toString()), "h:mm a")}
                            </p>
                          )
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeLinePanel;
