// src/presentation/components/TaskManager/KanttChartStyle/GanttTimelinePanel.tsx

import React from "react";
import { Task } from "../../../types/task";
import GanttTimelineHeader from "./GanttTimelineHeader";
import GanttTimelineBody from "./GanttTimelineBody";

interface GanttTimelinePanelProps {
  allTasks: Task[];
  groupedTasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  timeRange: string;
  containerWidth: number;
  headerHeight: number;
  rowHeight: number;
}

const GanttTimelinePanel: React.FC<GanttTimelinePanelProps> = ({
  allTasks,
  groupedTasks,
  onTaskClick,
  timeRange,
  containerWidth,
  headerHeight,
  rowHeight,
}) => {
  // Tính toán timeline boundaries và grid lines
  const {
    timelineStart,
    timelineEnd,
    timelineWidth,
    gridLines,
    currentTimePosition,
  } = React.useMemo(() => {
    if (allTasks.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      return {
        timelineStart: start,
        timelineEnd: end,
        timelineWidth: 1200,
        gridLines: [],
        currentTimePosition: null,
      };
    }

    const startDates = allTasks.map((task) => new Date(task.startDate!));
    const endDates = allTasks.map((task) => new Date(task.dueDate!));

    const minStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    let start = new Date(minStart);
    let end = new Date(maxEnd);

    switch (timeRange) {
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case "year":
        start.setMonth(0, 1);
        end.setFullYear(end.getFullYear() + 1, 0, 0);
        break;
    }

    let calculatedWidth = containerWidth;
    const totalMs = end.getTime() - start.getTime();

    switch (timeRange) {
      case "day":
        calculatedWidth = Math.max(containerWidth, 60 * 24);
        break;
      case "month":
        const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
        calculatedWidth = Math.max(containerWidth, totalDays * 30);
        break;
      case "year":
        const totalMonths =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()) +
          1;
        calculatedWidth = Math.max(containerWidth, totalMonths * 80);
        break;
    }

    const gridLines: number[] = [];
    let current = new Date(start);
    let accumulatedWidth = 0;

    switch (timeRange) {
      case "day": {
        while (current <= end) {
          const next = new Date(current.getTime() + 60 * 60 * 1000);
          const durationMs =
            Math.min(next.getTime(), end.getTime()) - current.getTime();
          const width = (durationMs / totalMs) * calculatedWidth;

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
          const width = (durationMs / totalMs) * calculatedWidth;

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
          const width = (durationMs / totalMs) * calculatedWidth;

          accumulatedWidth += width;
          if (current < end) {
            gridLines.push(accumulatedWidth);
          }
          current = next;
        }
        break;
      }
    }

    // Tính toán vị trí current time
    const now = new Date();
    let currentTimePos = null;
    if (now >= start && now <= end) {
      const currentMs = now.getTime() - start.getTime();
      currentTimePos = (currentMs / totalMs) * calculatedWidth;
    }

    return {
      timelineStart: start,
      timelineEnd: end,
      timelineWidth: calculatedWidth,
      gridLines: gridLines.filter((pos) => pos >= 0 && pos <= calculatedWidth),
      currentTimePosition: currentTimePos,
    };
  }, [allTasks, timeRange, containerWidth]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Header */}
      <GanttTimelineHeader
        timeRange={timeRange as "day" | "month" | "year"}
        startDate={timelineStart}
        endDate={timelineEnd}
        timelineWidth={timelineWidth}
        headerHeight={headerHeight}
        gridLines={gridLines}
      />

      {/* Body với các thanh Gantt */}
      <GanttTimelineBody
        allTasks={allTasks}
        groupedTasks={groupedTasks}
        onTaskClick={onTaskClick}
        timelineStart={timelineStart}
        timelineEnd={timelineEnd}
        timelineWidth={timelineWidth}
        rowHeight={rowHeight}
        gridLines={gridLines}
      />

      {/* Current Time Line - Render ở cấp cao nhất */}
      {currentTimePosition !== null && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${currentTimePosition}px`,
            top: `${headerHeight}px`, // Bắt đầu từ sau header
            width: "2px",
            height: "calc(100% - " + headerHeight + "px)", // Chiều cao từ header đến cuối
            backgroundColor: "#EF4444",
            zIndex: 1000,
            opacity: 0.8,
          }}
        >
          {/* Current time indicator dot ở header */}
          <div
            className="absolute w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"
            style={{
              top: `-${headerHeight / 2 + 6}px`, // Đặt ở giữa header
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1001,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GanttTimelinePanel;
