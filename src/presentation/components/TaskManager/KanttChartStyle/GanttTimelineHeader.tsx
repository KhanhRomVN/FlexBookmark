// src/presentation/components/TaskManager/KanttChartStyle/GanttTimelineHeader.tsx

import React from "react";

interface TimelineHeaderProps {
  timeRange: "day" | "month" | "year";
  startDate: Date;
  endDate: Date;
  timelineWidth: number;
  headerHeight: number;
  gridLines: number[];
}

const GanttTimelineHeader: React.FC<TimelineHeaderProps> = ({
  timeRange,
  startDate,
  endDate,
  timelineWidth,
  headerHeight,
  gridLines,
}) => {
  const generateTimeUnits = () => {
    const bottomUnits: Array<{
      label: string;
      date: Date;
      width: number;
      isCurrent: boolean;
    }> = [];

    const totalMs = endDate.getTime() - startDate.getTime();
    const now = new Date();

    let current = new Date(startDate);

    switch (timeRange) {
      case "day": {
        while (current <= endDate) {
          const next = new Date(current.getTime() + 60 * 60 * 1000);
          const durationMs =
            Math.min(next.getTime(), endDate.getTime()) - current.getTime();
          const width = (durationMs / totalMs) * timelineWidth;

          const isCurrent = now >= current && now < next;

          bottomUnits.push({
            label: current.getHours().toString().padStart(2, "0"),
            date: new Date(current),
            width: width,
            isCurrent: isCurrent,
          });

          current = next;
        }
        break;
      }
      case "month": {
        while (current <= endDate) {
          const next = new Date(current.getTime() + 24 * 60 * 60 * 1000);
          const durationMs =
            Math.min(next.getTime(), endDate.getTime()) - current.getTime();
          const width = (durationMs / totalMs) * timelineWidth;

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

          current = next;
        }
        break;
      }
      case "year": {
        while (current <= endDate) {
          const next = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
          );
          const actualNext = next > endDate ? endDate : next;
          const durationMs = actualNext.getTime() - current.getTime();
          const width = (durationMs / totalMs) * timelineWidth;

          const isCurrent =
            now.getFullYear() === current.getFullYear() &&
            now.getMonth() === current.getMonth();

          bottomUnits.push({
            label: current.toLocaleDateString("en-US", { month: "short" }),
            date: new Date(current),
            width: width,
            isCurrent: isCurrent,
          });

          current = next;
        }
        break;
      }
    }

    const topUnitsMap = new Map<
      string,
      { label: string; date: Date; width: number; units: number }
    >();

    bottomUnits.forEach((unit) => {
      let topKey: string;
      let topLabel: string;

      switch (timeRange) {
        case "day":
          topKey = unit.date.toDateString();
          topLabel = unit.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          break;
        case "month":
          topKey = `${unit.date.getFullYear()}-${unit.date.getMonth()}`;
          topLabel = unit.date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          break;
        case "year":
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

    const topUnitsArray = Array.from(topUnitsMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return {
      topUnits: topUnitsArray,
      bottomUnits,
    };
  };

  const { topUnits, bottomUnits } = generateTimeUnits();

  return (
    <div className="overflow-hidden relative">
      {/* Header Content */}
      <div
        className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 relative"
        style={{ height: headerHeight }}
      >
        {/* Top row - increased height */}
        <div
          className="flex border-b border-gray-200 dark:border-gray-600"
          style={{
            height: headerHeight * 0.6, // tăng chiều cao top row
            width: timelineWidth,
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

        {/* Bottom row - reduced height */}
        <div
          className="flex relative"
          style={{
            height: headerHeight * 0.4,
            width: timelineWidth,
          }}
        >
          {bottomUnits.map((unit, index) => (
            <div
              key={`${unit.label}-${unit.date.getTime()}-${index}`}
              className="flex-shrink-0 text-center relative flex items-center justify-center bg-transparent"
              style={{
                width: unit.width,
              }}
            >
              {unit.isCurrent ? (
                <div className="text-primary" style={{ minWidth: "16px" }}>
                  <div
                    className="text-white font-bold truncate leading-none text-center"
                    style={{
                      fontSize: "8px",
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
                    fontSize: "8px",
                    lineHeight: "1",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {unit.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttTimelineHeader;
