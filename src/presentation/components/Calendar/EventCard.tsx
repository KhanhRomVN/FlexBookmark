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
  availableSlotHeight?: number;
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
  availableSlotHeight?: number;
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
  availableSlotHeight,
}) => {
  const bgColor =
    "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
  const dotColor = "bg-blue-500";

  // FIXED: Improved height calculation with better logic
  const calculateEventHeight = () => {
    // Use the height from dimensions (which should already include slot expansion scaling)
    let calculatedHeight = dimensions.height;

    // If availableSlotHeight is provided and is expanded (> 64), ensure we use appropriate height
    const effectiveSlotHeight =
      availableSlotHeight || dimensions.availableSlotHeight || 64;

    if (effectiveSlotHeight > 64) {
      // Slot has been expanded, scale our event proportionally
      const expansionRatio = effectiveSlotHeight / 64;

      // Calculate base height from original event duration
      const originalBaseHeight = Math.max(30, (dimensions.duration / 60) * 64);

      // Scale it up but limit to reasonable bounds
      const scaledHeight = originalBaseHeight * Math.min(expansionRatio, 3); // Max 3x expansion

      // Ensure we don't exceed the slot bounds
      const maxAllowedHeight = effectiveSlotHeight * 0.85; // Use up to 85% of slot height

      calculatedHeight = Math.min(scaledHeight, maxAllowedHeight);
    }

    // Ensure minimum height for readability
    return Math.max(calculatedHeight, 28);
  };

  const adjustedHeight = calculateEventHeight();

  // Handle card click - directly open EventDialog
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectItem(event);
  };

  // DEBUGGING: Log height calculation
  console.log(
    `EventCard: ${event.title}, originalHeight: ${
      dimensions.height
    }, availableSlotHeight: ${
      availableSlotHeight || dimensions.availableSlotHeight || 64
    }, adjustedHeight: ${adjustedHeight}`
  );

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

        {/* Show description if event is tall enough */}
        {adjustedHeight > 60 && event.description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-3 flex-1 overflow-hidden">
            {event.description}
          </div>
        )}

        {/* Show location if event is very tall */}
        {adjustedHeight > 80 && event.location && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate mt-1">
            📍 {event.location}
          </div>
        )}

        {/* Show additional content for very expanded slots */}
        {adjustedHeight > 120 && event.description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-2 flex-1 overflow-y-auto">
            <div className="leading-tight">{event.description}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
