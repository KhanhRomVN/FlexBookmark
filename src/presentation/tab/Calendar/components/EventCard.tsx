// EventCard.tsx - Fixed to EXACTLY match MultiEventCard's single event rendering
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
  // FIXED: Use EXACTLY the same logic as MultiEventCard for single events
  const calculateOptimalHeight = () => {
    // For single events, use the dimension height - EXACTLY as MultiEventCard does
    const singleEventHeight = Math.max(dimensions.height, 40);
    return singleEventHeight;
  };

  const cardHeight = calculateOptimalHeight();

  // Use exactly the same colors and styles as MultiEventCard single event
  const bgColor =
    "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
  const dotColor = "bg-blue-500";

  // Handle card click - exactly as MultiEventCard does
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectItem(event);
  };

  // This is EXACTLY the same render structure as MultiEventCard for single events
  return (
    <div
      className={`absolute rounded-lg p-3 cursor-pointer transition-all text-xs shadow-sm border ${bgColor}`}
      style={{
        top: `${dimensions.top}px`,
        height: `${cardHeight}px`, // EXACTLY as MultiEventCard does it
        width: `${widthPercent}%`,
        left: `${left}%`,
        zIndex,
        minHeight: "32px", // EXACTLY as MultiEventCard
      }}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-2 mb-1">
          <span
            className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 mt-1`}
          ></span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white leading-tight">
              {event.title || event.summary}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
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

        {cardHeight > 50 && event.description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-2 flex-1 overflow-hidden">
            <div className="line-clamp-3 leading-tight">
              {event.description}
            </div>
          </div>
        )}

        {event.location && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate">
            📍 {event.location}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
