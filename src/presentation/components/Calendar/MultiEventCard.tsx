// MultiEventCard.tsx - Enhanced logging to debug height differences
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
  requiredHeight?: number;
  availableSlotHeight?: number;
}

interface MultiEventCardProps {
  events: CalendarEvent[];
  dimensions: EventDimensions;
  widthPercent: number;
  left: number;
  zIndex: number;
  onSelectItem: (event: CalendarEvent) => void;
  availableSlotHeight?: number;
}

const MultiEventCard: React.FC<MultiEventCardProps> = ({
  events,
  dimensions,
  widthPercent,
  left,
  zIndex,
  onSelectItem,
  availableSlotHeight,
}) => {
  // ENHANCED LOGGING: Log all input props for debugging
  console.log("=== MultiEventCard DEBUG START ===");
  console.log("Events count:", events.length);
  console.log("Dimensions received:", {
    top: dimensions.top,
    height: dimensions.height,
    startHour: dimensions.startHour,
    startMinute: dimensions.startMinute,
    endHour: dimensions.endHour,
    endMinute: dimensions.endMinute,
    duration: dimensions.duration,
    requiredHeight: dimensions.requiredHeight,
    availableSlotHeight: dimensions.availableSlotHeight,
  });
  console.log("Props availableSlotHeight:", availableSlotHeight);
  console.log("Style props:", { widthPercent, left, zIndex });

  // FIXED: Use the calculated height from dimensions to show ALL events
  const calculateOptimalHeight = () => {
    console.log("calculateOptimalHeight called for", events.length, "events");

    if (events.length === 1) {
      // For single events, use the dimension height
      const singleEventHeight = Math.max(dimensions.height, 40);
      console.log("SINGLE EVENT HEIGHT CALCULATION:");
      console.log("  - dimensions.height:", dimensions.height);
      console.log("  - Math.max(dimensions.height, 40):", singleEventHeight);
      return singleEventHeight;
    }

    // For multiple events, use the required height from dimensions
    if (dimensions.requiredHeight) {
      console.log(
        "MULTI EVENT - Using dimensions.requiredHeight:",
        dimensions.requiredHeight
      );
      return dimensions.requiredHeight;
    }

    // Fallback calculation if requiredHeight is not available - NO FOOTER
    const headerHeight = 36;
    const eventItemHeight = 32;
    const eventSpacing = 6;
    const paddingHeight = 20;
    const borderSpacing = 12;

    const totalEventsHeight = events.length * eventItemHeight;
    const totalSpacingHeight = Math.max(0, (events.length - 1) * eventSpacing);

    const totalRequiredHeight =
      headerHeight +
      totalEventsHeight +
      totalSpacingHeight +
      paddingHeight +
      borderSpacing;

    const fallbackHeight = Math.max(100, totalRequiredHeight);

    console.log("MULTI EVENT - Fallback calculation:");
    console.log("  - headerHeight:", headerHeight);
    console.log("  - eventItemHeight:", eventItemHeight);
    console.log("  - eventSpacing:", eventSpacing);
    console.log("  - paddingHeight:", paddingHeight);
    console.log("  - borderSpacing:", borderSpacing);
    console.log("  - totalEventsHeight:", totalEventsHeight);
    console.log("  - totalSpacingHeight:", totalSpacingHeight);
    console.log("  - totalRequiredHeight:", totalRequiredHeight);
    console.log("  - fallbackHeight:", fallbackHeight);

    return fallbackHeight;
  };

  const cardHeight = calculateOptimalHeight();
  const isMultiEvent = events.length > 1;

  console.log("Final cardHeight:", cardHeight);
  console.log("isMultiEvent:", isMultiEvent);

  // Single event rendering
  if (!isMultiEvent) {
    const event = events[0];
    const bgColor =
      "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800/40";
    const dotColor = "bg-blue-500";

    const handleCardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectItem(event);
    };

    console.log("RENDERING SINGLE EVENT:");
    console.log("  - Event title:", event.title || event.summary);
    console.log("  - Final style.height:", `${cardHeight}px`);
    console.log("  - Final style.top:", `${dimensions.top}px`);
    console.log("  - Final style.width:", `${widthPercent}%`);
    console.log("  - Final style.left:", `${left}%`);
    console.log("  - Final style.zIndex:", zIndex);
    console.log("  - minHeight:", "32px");
    console.log("=== MultiEventCard SINGLE EVENT DEBUG END ===");

    return (
      <div
        className={`absolute rounded-lg p-3 cursor-pointer transition-all text-xs shadow-sm border ${bgColor}`}
        style={{
          top: `${dimensions.top}px`,
          height: `${cardHeight}px`,
          width: `${widthPercent}%`,
          left: `${left}%`,
          zIndex,
          minHeight: "32px",
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
  }

  // Multiple events rendering
  const bgColor =
    "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 dark:from-blue-900/40 dark:to-purple-900/40 dark:border-blue-700 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/50 dark:hover:to-purple-800/50";

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectItem(events[0]); // Select first event to open dialog
  };

  console.log("RENDERING MULTI EVENT:");
  console.log("  - Events count:", events.length);
  console.log("  - Final style.height:", `${cardHeight}px`);
  console.log("  - Final style.top:", `${dimensions.top}px`);
  console.log("  - Final style.width:", `${widthPercent}%`);
  console.log("  - Final style.left:", `${left}%`);
  console.log("  - Final style.zIndex:", zIndex);
  console.log("  - minHeight:", "80px");
  console.log("=== MultiEventCard MULTI EVENT DEBUG END ===");

  return (
    <div
      className={`absolute rounded-lg cursor-pointer transition-all text-xs shadow-lg border-2 ${bgColor} overflow-hidden`}
      style={{
        top: `${dimensions.top}px`,
        height: `${cardHeight}px`,
        width: `${widthPercent}%`,
        left: `${left}%`,
        zIndex,
        minHeight: "80px",
      }}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full p-3">
        {/* Header with event count and time - FIXED height */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-300/50 dark:border-blue-600/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {events.slice(0, 4).map((_, index) => (
                <span
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-800 border border-blue-300 dark:border-blue-600`}
                  style={{ zIndex: events.length - index }}
                ></span>
              ))}
              {events.length > 4 && (
                <span className="text-[9px] text-blue-700 dark:text-blue-300 ml-1 font-bold">
                  +{events.length - 4}
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-full">
              {events.length} events
            </div>
          </div>
          <div className="text-[9px] text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
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

        {/* Events list - FIXED to show ALL events with proper scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex items-start gap-2 cursor-pointer hover:bg-white/70 dark:hover:bg-black/30 rounded-md px-2 py-1.5 transition-all duration-200 group border border-transparent hover:border-blue-200 dark:hover:border-blue-700 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(event);
                }}
                title={
                  event.description
                    ? `${event.title || event.summary}: ${event.description}`
                    : event.title || event.summary
                }
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 group-hover:scale-110 group-hover:bg-blue-600 transition-all"></span>
                <div className="flex-1 min-w-0">
                  {/* Event title - FIXED: Allow wrapping for full display */}
                  <div className="font-medium text-gray-900 dark:text-white text-[11px] group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-tight break-words">
                    {event.title || event.summary}
                  </div>

                  {/* Event location if available */}
                  {event.location && (
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight truncate">
                      📍 {event.location}
                    </div>
                  )}

                  {/* Event description preview for very tall cards */}
                  {cardHeight > 200 && event.description && (
                    <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2 leading-tight opacity-75">
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiEventCard;
