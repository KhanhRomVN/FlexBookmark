// src/presentation/components/TaskManager/GanttChartStyle/GanttTimelinePanel.tsx

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Task, Priority, Status } from "../../../types/task";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GanttTimelinePanelProps {
  allTasks: Task[];
  groupedTasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  timeRange: string;
  containerWidth: number;
  headerHeight: number;
  rowHeight: number;
}

const STATUS_COLORS: Record<Status, string> = {
  backlog: "#6B7280",
  todo: "#3B82F6",
  "in-progress": "#F59E0B",
  done: "#10B981",
  overdue: "#EF4444",
  archive: "#374151",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#94A3B8",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

type TimeRange = "day" | "month" | "year";

interface TimelineHeaderProps {
  timeRange: TimeRange;
  startDate: Date;
  endDate: Date;
  containerWidth: number;
  headerHeight: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  timeRange,
  startDate,
  endDate,
  containerWidth,
  headerHeight,
}) => {
  const generateTimeUnits = () => {
    const bottomUnits: Array<{
      label: string;
      date: Date;
      width: number;
      isCurrent: boolean;
    }> = [];
    const topUnits: Array<{ label: string; date: Date; width: number }> = [];
    const gridLines: number[] = [];

    // Calculate total duration and width per unit
    const totalMs = endDate.getTime() - startDate.getTime();
    const now = new Date();

    let current = new Date(startDate);
    let accumulatedWidth = 0;

    // Generate bottom-level units based on time range
    switch (timeRange) {
      case "day": {
        // Hours for day view
        while (current <= endDate) {
          const next = new Date(current.getTime() + 60 * 60 * 1000); // Add 1 hour
          const durationMs =
            Math.min(next.getTime(), endDate.getTime()) - current.getTime();
          const width = Math.max(60, (durationMs / totalMs) * containerWidth); // Minimum 60px per hour

          // Check if this hour is the current hour
          const isCurrent = now >= current && now < next;

          bottomUnits.push({
            label: current.getHours().toString().padStart(2, "0"),
            date: new Date(current),
            width: width,
            isCurrent: isCurrent,
          });

          // Grid line at the end of each unit (between units)
          accumulatedWidth += width;
          if (current < endDate) {
            gridLines.push(accumulatedWidth);
          }

          current = next;
        }
        break;
      }
      case "month": {
        // Days for month view
        while (current <= endDate) {
          const next = new Date(current.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
          const durationMs =
            Math.min(next.getTime(), endDate.getTime()) - current.getTime();
          const width = Math.max(30, (durationMs / totalMs) * containerWidth); // Minimum 30px per day

          // Check if this day is today
          const isCurrent =
            now.getFullYear() === current.getFullYear() &&
            now.getMonth() === current.getMonth() &&
            now.getDate() === current.getDate();

          bottomUnits.push({
            label: current.getDate().toString(),
            date: new Date(current),
            width: width,
            isCurrent: isCurrent,
          });

          // Grid line at the end of each unit
          accumulatedWidth += width;
          if (current < endDate) {
            gridLines.push(accumulatedWidth);
          }

          current = next;
        }
        break;
      }
      case "year": {
        // Months for year view
        while (current <= endDate) {
          const next = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
          );
          const actualNext = next > endDate ? endDate : next;
          const durationMs = actualNext.getTime() - current.getTime();
          const width = Math.max(80, (durationMs / totalMs) * containerWidth); // Minimum 80px per month

          // Check if this month is the current month
          const isCurrent =
            now.getFullYear() === current.getFullYear() &&
            now.getMonth() === current.getMonth();

          bottomUnits.push({
            label: current.toLocaleDateString("en-US", { month: "short" }),
            date: new Date(current),
            width: width,
            isCurrent: isCurrent,
          });

          // Grid line at the end of each unit
          accumulatedWidth += width;
          if (current < endDate) {
            gridLines.push(accumulatedWidth);
          }

          current = next;
        }
        break;
      }
    }

    // Generate top-level units by grouping bottom units
    const topUnitsMap = new Map<
      string,
      { label: string; date: Date; width: number; units: number }
    >();

    bottomUnits.forEach((unit) => {
      let topKey: string;
      let topLabel: string;

      switch (timeRange) {
        case "day":
          // Group hours by day
          topKey = unit.date.toDateString();
          topLabel = unit.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          break;
        case "month":
          // Group days by month
          topKey = `${unit.date.getFullYear()}-${unit.date.getMonth()}`;
          topLabel = unit.date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          break;
        case "year":
          // Group months by year
          topKey = unit.date.getFullYear().toString();
          topLabel = unit.date.getFullYear().toString();
          break;
        default:
          topKey = "default";
          topLabel = "Default";
      }

      if (topUnitsMap.has(topKey)) {
        const existing = topUnitsMap.get(topKey)!;
        existing.width += unit.width;
        existing.units += 1;
      } else {
        topUnitsMap.set(topKey, {
          label: topLabel,
          date: new Date(unit.date),
          width: unit.width,
          units: 1,
        });
      }
    });

    // Convert map to array
    const topUnitsArray = Array.from(topUnitsMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const totalBottomWidth = bottomUnits.reduce(
      (sum, unit) => sum + unit.width,
      0
    );

    return {
      topUnits: topUnitsArray,
      bottomUnits,
      totalBottomWidth: Math.max(totalBottomWidth, containerWidth),
      gridLines: gridLines,
    };
  };

  const { topUnits, bottomUnits, totalBottomWidth, gridLines } =
    generateTimeUnits();

  return (
    <div
      className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 relative"
      style={{ height: headerHeight }}
    >
      {/* Top row - Main time units - 1/2 of header height */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-600"
        style={{
          height: headerHeight / 2,
          width: totalBottomWidth,
        }}
      >
        {topUnits.map((unit, index) => (
          <div
            key={`${unit.label}-${index}`}
            className="flex-shrink-0 px-1 text-center bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            style={{ width: unit.width }}
          >
            <div
              className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate"
              style={{ fontSize: "11px" }}
            >
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row - Sub units with current time highlighting */}
      <div
        className="flex relative"
        style={{
          height: headerHeight / 2,
          width: totalBottomWidth,
        }}
      >
        {bottomUnits.map((unit, index) => (
          <div
            key={`${unit.label}-${unit.date.getTime()}-${index}`}
            className={`flex-shrink-0 text-center relative flex items-center justify-center ${
              index % 2 === 0
                ? "bg-gray-100 dark:bg-gray-700"
                : "bg-gray-200 dark:bg-gray-600"
            }`}
            style={{
              width: unit.width,
            }}
          >
            {unit.isCurrent ? (
              <div
                className="bg-blue-500 dark:bg-blue-600 rounded-xl px-2 py-1"
                style={{ minWidth: "20px" }}
              >
                <div
                  className="text-white dark:text-white font-bold truncate leading-none text-center"
                  style={{
                    fontSize: "10px",
                    lineHeight: "1",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {unit.label}
                </div>
              </div>
            ) : (
              <div
                className="text-gray-500 dark:text-gray-400 truncate leading-none font-medium"
                style={{
                  fontSize: "10px",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                }}
              >
                {unit.label}
              </div>
            )}
          </div>
        ))}

        {/* Grid lines positioned between bottom units */}
        {gridLines.map((position, i) => (
          <div
            key={`grid-${i}`}
            className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-500"
            style={{ left: position - 0.5 }} // Offset by half pixel for perfect alignment
          />
        ))}
      </div>
    </div>
  );
};

const GanttTimelinePanel: React.FC<GanttTimelinePanelProps> = ({
  allTasks,
  groupedTasks,
  onTaskClick,
  timeRange,
  containerWidth,
  headerHeight,
  rowHeight,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Calculate timeline boundaries based on actual task dates
  const { timelineStart, timelineEnd, timelineWidth, gridLines } =
    useMemo(() => {
      if (allTasks.length === 0) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        return {
          timelineStart: start,
          timelineEnd: end,
          timelineWidth: 1200,
          gridLines: [],
        };
      }

      const startDates = allTasks.map((task) => new Date(task.startDate!));
      const endDates = allTasks.map((task) => new Date(task.dueDate!));

      const minStart = new Date(
        Math.min(...startDates.map((d) => d.getTime()))
      );
      const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

      // Add padding based on time range
      let start = new Date(minStart);
      let end = new Date(maxEnd);

      switch (timeRange) {
        case "day":
          // Start from beginning of day, end at end of day
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "month":
          // Start from beginning of month, pad end
          start.setDate(1);
          end.setMonth(end.getMonth() + 1, 0); // Last day of next month
          break;
        case "year":
          // Start from beginning of year, pad end
          start.setMonth(0, 1);
          end.setFullYear(end.getFullYear() + 1, 0, 0); // Last day of next year
          break;
      }

      // Calculate timeline width and grid lines
      const totalMs = end.getTime() - start.getTime();
      const gridLines: number[] = [];
      let current = new Date(start);
      let accumulatedWidth = 0;

      // Generate consistent width calculation
      let calculatedWidth = containerWidth;
      switch (timeRange) {
        case "day":
          calculatedWidth = Math.max(containerWidth, 60 * 24); // 60px per hour
          break;
        case "month":
          const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
          calculatedWidth = Math.max(containerWidth, totalDays * 30); // 30px per day
          break;
        case "year":
          const totalMonths =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) +
            1;
          calculatedWidth = Math.max(containerWidth, totalMonths * 80); // 80px per month
          break;
      }

      // Generate grid lines that match header calculation
      switch (timeRange) {
        case "day": {
          while (current <= end) {
            const next = new Date(current.getTime() + 60 * 60 * 1000);
            const durationMs =
              Math.min(next.getTime(), end.getTime()) - current.getTime();
            const width = Math.max(
              60,
              (durationMs / totalMs) * calculatedWidth
            );

            accumulatedWidth += width;
            if (current < end) {
              gridLines.push(accumulatedWidth);
            }
            current = next;
          }
          break;
        }
        case "month": {
          while (current <= end) {
            const next = new Date(current.getTime() + 24 * 60 * 60 * 1000);
            const durationMs =
              Math.min(next.getTime(), end.getTime()) - current.getTime();
            const width = Math.max(
              30,
              (durationMs / totalMs) * calculatedWidth
            );

            accumulatedWidth += width;
            if (current < end) {
              gridLines.push(accumulatedWidth);
            }
            current = next;
          }
          break;
        }
        case "year": {
          while (current <= end) {
            const next = new Date(
              current.getFullYear(),
              current.getMonth() + 1,
              1
            );
            const actualNext = next > end ? end : next;
            const durationMs = actualNext.getTime() - current.getTime();
            const width = Math.max(
              80,
              (durationMs / totalMs) * calculatedWidth
            );

            accumulatedWidth += width;
            if (current < end) {
              gridLines.push(accumulatedWidth);
            }
            current = next;
          }
          break;
        }
      }

      return {
        timelineStart: start,
        timelineEnd: end,
        timelineWidth: calculatedWidth,
        gridLines: gridLines.filter(
          (pos) => pos >= 0 && pos <= calculatedWidth
        ),
      };
    }, [allTasks, timeRange, containerWidth]);

  // Calculate current time position for timeline content
  const calculateCurrentTimePosition = () => {
    const now = new Date();
    const totalMs = timelineEnd.getTime() - timelineStart.getTime();

    if (now < timelineStart || now > timelineEnd) {
      return null;
    }

    const currentTimeMs = now.getTime() - timelineStart.getTime();
    const position = (currentTimeMs / totalMs) * timelineWidth;

    return Math.max(0, Math.min(position, timelineWidth));
  };

  const currentTimePosition = calculateCurrentTimePosition();

  // Handle scroll functionality
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = containerWidth * 0.8;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll =
      direction === "left"
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  // Update scroll indicators
  useEffect(() => {
    const handleScrollUpdate = () => {
      if (!scrollContainerRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setScrollLeft(scrollLeft);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollUpdate);
      handleScrollUpdate(); // Initial check

      return () => {
        scrollContainer.removeEventListener("scroll", handleScrollUpdate);
      };
    }
  }, [timelineWidth]);

  // Calculate task bar positions and dimensions
  const calculateTaskPosition = (task: Task) => {
    const startDate = new Date(task.startDate!);
    const startTime = new Date(task.startTime!);
    const dueDate = new Date(task.dueDate!);
    const dueTime = new Date(task.dueTime!);

    // Combine date and time
    const combinedStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const combinedEnd = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      dueTime.getHours(),
      dueTime.getMinutes()
    );

    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    const taskStartMs = combinedStart.getTime() - timelineStart.getTime();
    const taskDurationMs = combinedEnd.getTime() - combinedStart.getTime();

    const left = (taskStartMs / totalMs) * timelineWidth;
    const width = Math.max((taskDurationMs / totalMs) * timelineWidth, 20);

    return { left: Math.max(left, 0), width };
  };

  // Task progress calculation
  const getTaskProgress = (task: Task) => {
    if (task.completed || task.status === "done") return 100;
    if (task.status === "in-progress") return 50;
    if (task.status === "todo") return 25;
    return 0;
  };

  const getTaskColor = (task: Task) => {
    return STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  };

  const getTaskPriorityColor = (task: Task) => {
    return PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  };

  // Generate gradient colors for varied appearance
  const getTaskGradient = (task: Task) => {
    const baseColor = getTaskColor(task);
    const priorityColor = getTaskPriorityColor(task);

    return `linear-gradient(135deg, ${baseColor} 0%, ${priorityColor} 100%)`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Custom Scroll Controls */}
      {(canScrollLeft || canScrollRight) && (
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-md ${
              canScrollLeft
                ? "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            } shadow-sm border border-gray-200 dark:border-gray-600 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded-md ${
              canScrollRight
                ? "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            } shadow-sm border border-gray-200 dark:border-gray-600 transition-colors`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Timeline Header */}
      <div className="overflow-hidden">
        <TimelineHeader
          timeRange={timeRange as TimeRange}
          startDate={timelineStart}
          endDate={timelineEnd}
          containerWidth={timelineWidth}
          headerHeight={headerHeight}
        />
      </div>

      {/* Timeline Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hide scrollbar for webkit browsers */}
        <style>{`
          .timeline-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          ref={timelineRef}
          className="relative timeline-scroll"
          style={{ width: timelineWidth }}
        >
          {Object.entries(groupedTasks).map(([collection, tasks]) => (
            <div key={collection}>
              {/* Collection Header Row */}
              {collection !== "No Collection" && (
                <div
                  className="border-b border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 relative"
                  style={{ height: rowHeight }}
                >
                  <div className="h-full flex items-center px-4">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📁 {collection}
                    </span>
                  </div>
                  {/* Grid lines for collection header */}
                  {gridLines.map((position, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-blue-300 dark:bg-blue-600 opacity-40"
                      style={{ left: position }}
                    />
                  ))}
                </div>
              )}

              {/* Task Rows */}
              {tasks.map((task) => {
                const { left, width } = calculateTaskPosition(task);
                const progress = getTaskProgress(task);

                return (
                  <div
                    key={task.id}
                    className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
                    style={{ height: rowHeight }}
                  >
                    {/* Grid lines for task row */}
                    {gridLines.map((position, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-500 opacity-30"
                        style={{ left: position }}
                      />
                    ))}

                    <div className="relative h-full py-3 px-2">
                      {/* Task Bar */}
                      <div
                        className="absolute rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all group"
                        style={{
                          left: left,
                          width: width,
                          top: "12px",
                          height: "36px",
                          background: getTaskGradient(task),
                        }}
                        onClick={() => onTaskClick(task)}
                      >
                        {/* Progress Bar */}
                        <div
                          className="absolute top-0 left-0 h-full rounded-lg opacity-60"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: "rgba(255, 255, 255, 0.3)",
                          }}
                        />

                        {/* Task Label */}
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-white text-xs font-medium truncate drop-shadow-sm">
                            {task.title}
                          </span>
                        </div>

                        {/* Priority indicator dot */}
                        <div
                          className="absolute top-1 right-1 w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getTaskPriorityColor(task),
                            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                          }}
                        />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                          <div className="font-semibold">{task.title}</div>
                          <div className="text-gray-300">
                            Progress: {progress}% | Priority: {task.priority}
                          </div>
                          <div className="text-gray-300">
                            {new Date(task.startDate!).toLocaleDateString()} -{" "}
                            {new Date(task.dueDate!).toLocaleDateString()}
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Current time indicator line extending through all rows - only show if within timeline range */}
        {currentTimePosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-70 pointer-events-none z-10"
            style={{ left: currentTimePosition }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttTimelinePanel;
