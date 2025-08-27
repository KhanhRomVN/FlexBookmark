import React, { useMemo, useState, useEffect } from "react";
import {
  format,
  parseISO,
  getHours,
  getMinutes,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  differenceInMinutes,
  isSameDay,
} from "date-fns";
import type { CalendarEvent } from "../../types/calendar";
import MultiEventCard from "./MultiEventCard";

interface TaskEvent {
  id: string;
  startTime: Date;
  endTime: Date;
  events: CalendarEvent[];
  maxConcurrentEvents: number;
}

interface EventLayout {
  events: CalendarEvent[];
  width: number;
  left: number;
  zIndex: number;
  dimensions: {
    top: number;
    height: number;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    duration: number;
    requiredHeight?: number;
  };
}

interface TimeLinePanelProps {
  date: Date;
  events: CalendarEvent[];
  onSelectItem: (item: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (date: Date, hour: number) => void;
  loading: boolean;
  error: string | null;
}

/**
 * Enhanced EventOverlapProcessor for timeline calendar
 * Ensures overlapping events are properly grouped to avoid visual conflicts
 */
class EventOverlapProcessor {
  static processEventOverlaps(events: CalendarEvent[]): TaskEvent[] {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = events
      .filter((event) => this.parseEventTime(event.start) !== null)
      .sort((a, b) => {
        const startA = this.parseEventTime(a.start)!.getTime();
        const startB = this.parseEventTime(b.start)!.getTime();
        return startA - startB;
      });

    const overlapGroups = this.findOverlapGroups(sortedEvents);
    const taskEvents: TaskEvent[] = [];

    overlapGroups.forEach((group, groupIndex) => {
      if (group.length === 1) {
        // Single event - no overlap
        const event = group[0];
        const startTime = this.parseEventTime(event.start)!;
        const endTime = this.parseEventTime(event.end)!;

        taskEvents.push({
          id: `task-event-${groupIndex}-${startTime.getTime()}`,
          startTime,
          endTime,
          events: [event],
          maxConcurrentEvents: 1,
        });
      } else {
        // Multiple overlapping events - create segments
        const segments = this.createOverlapSegments(group);

        segments.forEach((segment, segmentIndex) => {
          taskEvents.push({
            id: `task-event-${groupIndex}-${segmentIndex}-${segment.startTime.getTime()}`,
            startTime: segment.startTime,
            endTime: segment.endTime,
            events: segment.events,
            maxConcurrentEvents: segment.events.length,
          });
        });
      }
    });

    return taskEvents;
  }

  /**
   * Find groups of events that overlap with each other
   */
  private static findOverlapGroups(
    sortedEvents: CalendarEvent[]
  ): CalendarEvent[][] {
    const groups: CalendarEvent[][] = [];
    const processed = new Set<string>();

    for (const event of sortedEvents) {
      if (processed.has(event.id)) continue;

      const group = this.findAllOverlappingEvents(
        event,
        sortedEvents,
        processed
      );
      if (group.length > 0) {
        groups.push(group);
        group.forEach((e) => processed.add(e.id));
      }
    }

    return groups;
  }

  /**
   * Find all events that overlap with the given event (transitively)
   */
  private static findAllOverlappingEvents(
    targetEvent: CalendarEvent,
    allEvents: CalendarEvent[],
    processed: Set<string>
  ): CalendarEvent[] {
    const group: CalendarEvent[] = [targetEvent];
    const toCheck = [targetEvent];

    while (toCheck.length > 0) {
      const currentEvent = toCheck.pop()!;

      for (const otherEvent of allEvents) {
        if (
          processed.has(otherEvent.id) ||
          group.some((e) => e.id === otherEvent.id) ||
          otherEvent.id === currentEvent.id
        ) {
          continue;
        }

        if (this.eventsOverlap(currentEvent, otherEvent)) {
          group.push(otherEvent);
          toCheck.push(otherEvent);
        }
      }
    }

    return group;
  }

  /**
   * Check if two events overlap in time
   */
  private static eventsOverlap(
    event1: CalendarEvent,
    event2: CalendarEvent
  ): boolean {
    const start1 = this.parseEventTime(event1.start);
    const end1 = this.parseEventTime(event1.end);
    const start2 = this.parseEventTime(event2.start);
    const end2 = this.parseEventTime(event2.end);

    if (!start1 || !end1 || !start2 || !end2) return false;

    return (
      start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime()
    );
  }

  /**
   * Create time segments for overlapping events
   * This ensures that events sharing the same time period are grouped together
   */
  private static createOverlapSegments(
    overlappingEvents: CalendarEvent[]
  ): Array<{
    startTime: Date;
    endTime: Date;
    events: CalendarEvent[];
  }> {
    // Get all unique time points
    const timePoints = this.extractTimePoints(overlappingEvents);
    const segments: Array<{
      startTime: Date;
      endTime: Date;
      events: CalendarEvent[];
    }> = [];

    // Create segments between consecutive time points
    for (let i = 0; i < timePoints.length - 1; i++) {
      const segmentStart = timePoints[i];
      const segmentEnd = timePoints[i + 1];

      // Find all events that cover this segment
      const segmentEvents = overlappingEvents.filter((event) => {
        const eventStart = this.parseEventTime(event.start)!;
        const eventEnd = this.parseEventTime(event.end)!;

        return (
          eventStart.getTime() <= segmentStart.getTime() &&
          eventEnd.getTime() > segmentStart.getTime()
        );
      });

      if (segmentEvents.length > 0) {
        segments.push({
          startTime: segmentStart,
          endTime: segmentEnd,
          events: segmentEvents,
        });
      }
    }

    return segments;
  }

  private static extractTimePoints(events: CalendarEvent[]): Date[] {
    const timePoints: Date[] = [];

    events.forEach((event) => {
      const startTime = this.parseEventTime(event.start);
      const endTime = this.parseEventTime(event.end);

      if (startTime) timePoints.push(startTime);
      if (endTime) timePoints.push(endTime);
    });

    // Remove duplicates and sort
    const uniqueTimePoints = Array.from(
      new Set(timePoints.map((t) => t.getTime()))
    )
      .map((time) => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());

    return uniqueTimePoints;
  }

  private static parseEventTime(
    dateValue: Date | string | undefined
  ): Date | null {
    if (!dateValue) return null;

    try {
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }

      if (typeof dateValue === "string") {
        const parsed = parseISO(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

const TimeLinePanel: React.FC<TimeLinePanelProps> = ({
  date,
  events,
  onSelectItem,
  onDateChange,
  onCreateEvent,
  loading,
  error,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper function để tính toán chiều cao cần thiết cho MultiEventCard
  const calculateRequiredHeight = (events: CalendarEvent[]) => {
    if (events.length === 1) {
      return null; // Use default height for single events
    }

    // For multiple events:
    const headerHeight = 20;
    const eventHeight = 18;
    const gapHeight = 2;
    const paddingHeight = 8;
    const footerHeight = 12; // "Click để xem chi tiết"

    const totalEventsHeight = events.length * eventHeight;
    const totalGapsHeight = (events.length - 1) * gapHeight;

    return (
      headerHeight +
      totalEventsHeight +
      totalGapsHeight +
      paddingHeight +
      footerHeight
    );
  };

  // Helper function được định nghĩa trước khi sử dụng
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [date]);

  const goToPreviousWeek = () => onDateChange(subWeeks(date, 1));
  const goToNextWeek = () => onDateChange(addWeeks(date, 1));
  const goToCurrentWeek = () => onDateChange(new Date());

  // Calculate dynamic heights for time slots based on event requirements
  const timeSlotHeights = useMemo(() => {
    const heights: Record<string, Record<number, number>> = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      heights[dayKey] = {};

      // Initialize all hours with default height
      for (let hour = 1; hour <= 24; hour++) {
        heights[dayKey][hour] = 64; // Default 64px height
      }

      // Filter events for this day
      const dayEvents = events
        .filter((event) => safeParseDate(event.start) !== null)
        .filter((event) => {
          const startDate = safeParseDate(event.start)!;
          return isSameDay(startDate, day);
        });

      if (dayEvents.length === 0) return;

      // Apply improved overlap processing
      const taskEvents = EventOverlapProcessor.processEventOverlaps(dayEvents);

      // Calculate required heights based on events
      taskEvents.forEach((taskEvent) => {
        if (taskEvent.events.length > 1) {
          const startHour = getHours(taskEvent.startTime);
          const actualStartHour = startHour === 0 ? 24 : startHour;

          const requiredHeight = calculateRequiredHeight(taskEvent.events);

          if (requiredHeight) {
            // Set the height for the primary hour to accommodate the full event
            const newHeight = Math.max(
              heights[dayKey][actualStartHour],
              requiredHeight + 16 // Add some padding
            );

            heights[dayKey][actualStartHour] = newHeight;
          }
        }
      });
    });

    return heights;
  }, [events, weekDays, safeParseDate, calculateRequiredHeight]);

  // FIXED: Calculate cumulative heights for position calculation
  const cumulativeHeights = useMemo(() => {
    const cumulative: Record<string, Record<number, number>> = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      cumulative[dayKey] = {};

      let totalHeight = 0;
      for (let hour = 1; hour <= 24; hour++) {
        cumulative[dayKey][hour] = totalHeight;
        // Use the maximum height across all days for this hour to keep consistency
        let maxHeightForHour = 64;
        weekDays.forEach((weekDay) => {
          const weekDayKey = format(weekDay, "yyyy-MM-dd");
          const weekDayHeight = timeSlotHeights[weekDayKey]?.[hour] || 64;
          maxHeightForHour = Math.max(maxHeightForHour, weekDayHeight);
        });
        totalHeight += maxHeightForHour;
      }
    });

    return cumulative;
  }, [timeSlotHeights, weekDays]);

  // FIXED: Helper function to calculate correct position using cumulative heights
  const calculateSegmentDimensions = (taskEvent: TaskEvent, dayKey: string) => {
    const startDate = taskEvent.startTime;
    const endDate = taskEvent.endTime;

    let startHour = getHours(startDate);
    const startMinute = getMinutes(startDate);

    let endHour = getHours(endDate);
    const endMinute = getMinutes(endDate);

    // Convert to our 1-24 system
    if (startHour === 0) startHour = 24;
    if (endHour === 0) endHour = 24;

    // FIXED: Use cumulative heights for correct positioning
    const baseCumulativeHeight = cumulativeHeights[dayKey]?.[startHour] || 0;
    const topPosition =
      baseCumulativeHeight +
      (startMinute / 60) * (timeSlotHeights[dayKey]?.[startHour] || 64);

    const durationInMinutes = differenceInMinutes(endDate, startDate);
    let originalHeight = Math.max(30, (durationInMinutes / 60) * 64);

    // Calculate required height for multi-event cards
    const requiredHeight = calculateRequiredHeight(taskEvent.events);

    // FIXED: For multi-event cards, use the expanded height from timeSlotHeights
    let finalHeight = originalHeight;
    if (requiredHeight && taskEvent.events.length > 1) {
      const expandedSlotHeight = timeSlotHeights[dayKey]?.[startHour] || 64;
      finalHeight = Math.min(requiredHeight, expandedSlotHeight - 8); // Leave some padding
    }

    return {
      top: topPosition,
      height: finalHeight,
      startHour,
      startMinute,
      endHour,
      endMinute,
      duration: durationInMinutes,
      requiredHeight: requiredHeight,
    };
  };

  // Enhanced event processing với improved overlap algorithm
  const eventsByDate = useMemo(() => {
    const dateMap: Record<string, EventLayout[]> = {};

    // Initialize structure
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      dateMap[dayKey] = [];
    });

    // Process events cho từng ngày
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");

      // Filter events for this day
      const dayEvents = events
        .filter((event) => safeParseDate(event.start) !== null)
        .filter((event) => {
          const startDate = safeParseDate(event.start)!;
          return isSameDay(startDate, day);
        });

      if (dayEvents.length === 0) return;

      // Apply improved overlap processing
      const taskEvents = EventOverlapProcessor.processEventOverlaps(dayEvents);

      // Convert TaskEvents to EventLayouts
      const eventLayouts: EventLayout[] = [];

      taskEvents.forEach((taskEvent, taskIndex) => {
        // FIXED: Pass dayKey to calculateSegmentDimensions
        const segmentDimensions = calculateSegmentDimensions(taskEvent, dayKey);

        // Create ONE EventLayout per TaskEvent (not per individual event)
        eventLayouts.push({
          events: taskEvent.events,
          width: 95,
          left: 2.5,
          zIndex: 5 + taskIndex,
          dimensions: segmentDimensions,
        });
      });

      dateMap[dayKey] = eventLayouts;
    });

    return dateMap;
  }, [events, weekDays, safeParseDate, calculateSegmentDimensions]);

  const hasEvents = useMemo(() => {
    return Object.values(eventsByDate).some((events) => events.length > 0);
  }, [eventsByDate]);

  const handleTimeSlotClick = (
    day: Date,
    hour: number,
    event: React.MouseEvent
  ) => {
    if ((event.target as HTMLElement).closest("[data-event-card]")) {
      return;
    }

    if (onCreateEvent) {
      onCreateEvent(day, hour);
    }
  };

  const currentTimePosition = useMemo(() => {
    if (!isToday(date)) return null;

    const now = new Date();
    let hour = getHours(now);
    const minute = getMinutes(now);

    if (hour === 0) hour = 24;

    // FIXED: Use cumulative heights for current time position
    const todayKey = format(new Date(), "yyyy-MM-dd");
    let totalHeight = cumulativeHeights[todayKey]?.[hour] || 0;

    // Add the portion of current hour
    const currentHourHeight = timeSlotHeights[todayKey]?.[hour] || 64;
    totalHeight += (minute / 60) * currentHourHeight;

    return totalHeight;
  }, [currentTime, date, timeSlotHeights, cumulativeHeights]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang tải sự kiện...
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
            Vui lòng kiểm tra kết nối tài khoản Google của bạn
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header with navigation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">
            Tuần {format(weekDays[0], "d MMM")} -{" "}
            {format(weekDays[6], "d MMM, yyyy")}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Tuần trước"
            >
              <svg
                className="w-5 h-5"
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
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Tuần hiện tại"
            >
              Hôm nay
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Tuần sau"
            >
              <svg
                className="w-5 h-5"
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
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {events.length} sự kiện
        </p>
      </div>

      <div className="flex-1 overflow-auto relative">
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            className="absolute left-20 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: `${40 + currentTimePosition}px` }}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}

        <div className="flex">
          {/* Time column with dynamic heights */}
          <div className="w-20 shrink-0 bg-gray-50 dark:bg-gray-900">
            <div className="h-10 border-b border-gray-200 dark:border-gray-700"></div>

            {Array.from({ length: 24 }).map((_, index) => {
              const hour = index + 1;
              const displayHour = hour === 24 ? 0 : hour;

              // Calculate the maximum height needed across all days for this hour
              let maxHeightForHour = 64;
              weekDays.forEach((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayHeight = timeSlotHeights[dayKey]?.[hour] || 64;
                maxHeightForHour = Math.max(maxHeightForHour, dayHeight);
              });

              return (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
                  style={{ height: `${maxHeightForHour}px` }}
                >
                  {format(new Date().setHours(displayHour, 0), "h a")}
                </div>
              );
            })}
          </div>

          {/* Days columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEventLayouts = eventsByDate[dayKey] || [];

            return (
              <div
                key={dayKey}
                className={`w-[calc((100%-5rem)/7)] border-l border-gray-200 dark:border-gray-700 ${
                  isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                } relative`}
              >
                <div className="h-10 text-center py-2 text-xs font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  {format(day, "EEE d")}
                </div>

                {/* Time slots background with dynamic heights */}
                {Array.from({ length: 24 }).map((_, index) => {
                  const hour = index + 1;

                  // Use the same height calculation as the time column
                  let maxHeightForHour = 64;
                  weekDays.forEach((weekDay) => {
                    const weekDayKey = format(weekDay, "yyyy-MM-dd");
                    const weekDayHeight =
                      timeSlotHeights[weekDayKey]?.[hour] || 64;
                    maxHeightForHour = Math.max(
                      maxHeightForHour,
                      weekDayHeight
                    );
                  });

                  return (
                    <div
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      style={{ height: `${maxHeightForHour}px` }}
                      onClick={(e) => handleTimeSlotClick(day, hour, e)}
                      title={`Tạo sự kiện mới lúc ${format(
                        new Date().setHours(hour === 24 ? 0 : hour, 0),
                        "h:mm a"
                      )}`}
                    />
                  );
                })}

                {/* Enhanced Events overlay with improved overlap processing */}
                <div className="absolute top-10 left-0 right-0 bottom-0 pointer-events-none">
                  {dayEventLayouts.map((eventLayout, index) => (
                    <div
                      key={`segment-${index}-${
                        eventLayout.events[0]?.id || index
                      }`}
                      data-event-card
                      className="pointer-events-auto"
                    >
                      <MultiEventCard
                        events={eventLayout.events}
                        dimensions={eventLayout.dimensions}
                        widthPercent={eventLayout.width}
                        left={eventLayout.left}
                        zIndex={eventLayout.zIndex}
                        onSelectItem={onSelectItem}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasEvents && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6"
                />
              </svg>
              <p className="text-sm font-medium mb-1">Không có sự kiện nào</p>
              <p className="text-xs">Không có sự kiện nào trong tuần này</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeLinePanel;
