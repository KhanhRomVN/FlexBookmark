import React from "react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "../../types/calendar";

interface EventCardProps {
  event: CalendarEvent;
  onViewDetails: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
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

  const startDate = safeParseDate(event.start);
  const endDate = safeParseDate(event.end);

  // Fake data for demonstration (replace with actual data when available)
  const fakeData = {
    priority: "high",
    hasNotification: true,
    subtaskCount: 3,
    attachmentCount: 2,
    tagCount: 1,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-64 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {startDate && format(startDate, "HH:mm")}
            {endDate && ` - ${format(endDate, "HH:mm")}`}
          </div>
          {endDate && startDate && !isSameDay(startDate, endDate) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(endDate, "MMM d")}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
            {event.description}
          </p>
        )}

        {/* Location */}
        {event.location && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">📍</span>
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {/* Priority */}
            {fakeData.priority && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {fakeData.priority}
              </span>
            )}

            {/* Notification */}
            {fakeData.hasNotification && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                </svg>
              </span>
            )}

            {/* Subtask count */}
            {fakeData.subtaskCount > 0 && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {fakeData.subtaskCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Attachment count */}
            {fakeData.attachmentCount > 0 && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                {fakeData.attachmentCount}
              </span>
            )}

            {/* Tag count */}
            {fakeData.tagCount > 0 && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {fakeData.tagCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View details button */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
        <button
          className="text-xs text-blue-500 hover:text-blue-700 font-medium w-full text-left"
          onClick={onViewDetails}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
};

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export default EventCard;
