import React from "react";
import { format } from "date-fns";
import type { CalendarEvent } from "../../types/calendar";

interface EventDimensions {
  top: number;
  height: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  duration: number;
}

interface TimelineEventCardProps {
  event: CalendarEvent;
  dimensions: EventDimensions;
  widthPercent: number;
  left: number;
  zIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectItem: (event: CalendarEvent) => void;
}

const EventCard: React.FC<TimelineEventCardProps> = ({
  event,
  dimensions,
  widthPercent,
  left,
  zIndex,
  isExpanded,
  onToggle,
  onSelectItem,
}) => {
  const bgColor =
    "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
  const dotColor = "bg-blue-500";

  // Adjust height for margin bottom (2px)
  const adjustedHeight = Math.max(28, dimensions.height - 2);

  return (
    <div
      key={event.id}
      className={`absolute rounded p-2 cursor-pointer transition-all text-xs shadow-sm border ${bgColor}`}
      style={{
        top: `${dimensions.top}px`,
        height: `${adjustedHeight - 6}px`,
        width: `${widthPercent}%`,
        left: `${left}%`,
        zIndex,
        minHeight: "28px",
      }}
      onClick={onToggle}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-1 mb-1">
          <span
            className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 mt-0.5`}
          ></span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {event.title}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">
              {format(
                new Date().setHours(
                  dimensions.startHour === 24 ? 0 : dimensions.startHour,
                  dimensions.startMinute
                ),
                "h:mm"
              )}
              {dimensions.duration > 30 && (
                <>
                  {" - "}
                  {format(
                    new Date().setHours(
                      dimensions.endHour === 24 ? 0 : dimensions.endHour,
                      dimensions.endMinute
                    ),
                    "h:mm"
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Show description if event is tall enough */}
        {adjustedHeight > 60 && event.description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
            {event.description}
          </div>
        )}

        {/* Show location if event is very tall */}
        {adjustedHeight > 80 && event.location && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate mt-1">
            📍 {event.location}
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          className="absolute z-50 top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-60 max-w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-medium mb-1 text-sm">{event.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {format(
              new Date().setHours(
                dimensions.startHour === 24 ? 0 : dimensions.startHour,
                dimensions.startMinute
              ),
              "h:mm a"
            )}
            {dimensions.duration > 30 && (
              <>
                {" - "}
                {format(
                  new Date().setHours(
                    dimensions.endHour === 24 ? 0 : dimensions.endHour,
                    dimensions.endMinute
                  ),
                  "h:mm a"
                )}
              </>
            )}
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
};

export default EventCard;
