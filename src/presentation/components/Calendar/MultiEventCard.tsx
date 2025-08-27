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

interface MultiEventCardProps {
  events: CalendarEvent[];
  dimensions: EventDimensions;
  widthPercent: number;
  left: number;
  zIndex: number;
  onSelectItem: (event: CalendarEvent) => void;
}

const MultiEventCard: React.FC<MultiEventCardProps> = ({
  events,
  dimensions,
  widthPercent,
  left,
  zIndex,
  onSelectItem,
}) => {
  // Adjust height for margin bottom (2px)
  const adjustedHeight = Math.max(28, dimensions.height - 2);

  // If only one event, render normally
  if (events.length === 1) {
    const event = events[0];
    const bgColor =
      "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
    const dotColor = "bg-blue-500";

    const handleCardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectItem(event);
    };

    return (
      <div
        className={`absolute rounded p-2 cursor-pointer transition-all text-xs shadow-sm border ${bgColor}`}
        style={{
          top: `${dimensions.top}px`,
          height: `${adjustedHeight - 6}px`,
          width: `${widthPercent}%`,
          left: `${left}%`,
          zIndex,
          minHeight: "28px",
        }}
        onClick={handleCardClick}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-1 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 mt-0.5`}
            ></span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {event.title || event.summary}
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

          {adjustedHeight > 60 && event.description && (
            <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
              {event.description}
            </div>
          )}

          {adjustedHeight > 80 && event.location && (
            <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate mt-1">
              📍 {event.location}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multiple events - render as stacked/grouped card
  const bgColor =
    "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200 dark:from-blue-900/30 dark:to-purple-900/30 dark:border-blue-800 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/40 dark:hover:to-purple-800/40";

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For multiple events, show the first one or you could implement a picker
    onSelectItem(events[0]);
  };

  const eventHeight = Math.max(
    20,
    (adjustedHeight - 6 - (events.length - 1) * 2) / events.length
  );

  return (
    <div
      className={`absolute rounded p-1 cursor-pointer transition-all text-xs shadow-sm border-2 ${bgColor}`}
      style={{
        top: `${dimensions.top}px`,
        height: `${adjustedHeight - 6}px`,
        width: `${widthPercent}%`,
        left: `${left}%`,
        zIndex,
        minHeight: "28px",
      }}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full gap-0.5">
        {/* Header showing it's a multi-event */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex -space-x-0.5">
            {events.slice(0, 3).map((_, index) => (
              <span
                key={index}
                className={`w-1.5 h-1.5 rounded-full bg-blue-500 ring-1 ring-white dark:ring-gray-800`}
                style={{ zIndex: events.length - index }}
              ></span>
            ))}
            {events.length > 3 && (
              <span className="text-[8px] text-gray-600 dark:text-gray-400 ml-1">
                +{events.length - 3}
              </span>
            )}
          </div>
          <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300 truncate">
            {events.length} sự kiện
          </div>
          <div className="text-[8px] text-gray-600 dark:text-gray-400">
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

        {/* List of events */}
        <div className="flex-1 space-y-0.5 overflow-hidden">
          {events
            .slice(0, Math.floor(adjustedHeight / 20))
            .map((event, index) => (
              <div
                key={event.id}
                className="flex items-center gap-1 min-h-[16px] cursor-pointer hover:bg-white/50 dark:hover:bg-black/20 rounded px-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(event);
                }}
              >
                <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate text-[9px]">
                    {event.title || event.summary}
                  </div>
                </div>
              </div>
            ))}

          {/* Show "and X more" if there are too many events */}
          {events.length > Math.floor(adjustedHeight / 20) && (
            <div className="text-[8px] text-gray-600 dark:text-gray-400 px-1">
              +{events.length - Math.floor(adjustedHeight / 20)} more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiEventCard;
