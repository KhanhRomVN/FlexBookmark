// src/presentation/components/TaskManager/KanttChartStyle/GanttTimelineHeader.tsx

import React from "react";

interface TimelineHeaderProps {
  timeRange: "day" | "month" | "year";
  startDate?: Date;
  endDate?: Date;
  totalWidth: number;
  headerHeight: number;
}

const GanttTimelineHeader: React.FC<TimelineHeaderProps> = ({
  timeRange,
  startDate,
  endDate,
  totalWidth,
  headerHeight,
}) => {
  const safeStart = startDate || new Date(2000, 0, 1);
  const safeEnd = endDate || new Date(2500, 11, 31);

  // tỉ lệ chiều cao
  const topHeight = headerHeight * 0.6;
  const bottomHeight = headerHeight - topHeight;

  const units: { label: string; width: number; isTop: boolean }[] = [];

  if (timeRange === "day") {
    // top row: năm
    const yearWidth = totalWidth; // full width
    units.push({
      label: `${safeStart.getFullYear()}`,
      width: yearWidth,
      isTop: true,
    });

    // bottom row: từng giờ, mỗi giờ vuông
    for (let h = 0; h < 24; h++) {
      units.push({ label: `${h}:00`, width: bottomHeight, isTop: false });
    }
  }

  if (timeRange === "month") {
    // loop từng tháng trong khoảng
    let current = new Date(safeStart.getFullYear(), safeStart.getMonth(), 1);

    while (current <= safeEnd) {
      const y = current.getFullYear();
      const m = current.getMonth();

      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const monthWidth = daysInMonth * bottomHeight;

      // top row: tháng
      units.push({
        label: `${m + 1}/${y}`,
        width: monthWidth,
        isTop: true,
      });

      // bottom row: ngày
      for (let d = 1; d <= daysInMonth; d++) {
        units.push({
          label: `${d}`,
          width: bottomHeight,
          isTop: false,
        });
      }

      current.setMonth(m + 1);
    }
  }

  if (timeRange === "year") {
    // loop năm
    let currentYear = safeStart.getFullYear();
    const endYear = safeEnd.getFullYear();

    while (currentYear <= endYear) {
      // 12 tháng
      const yearWidth = 12 * bottomHeight;

      // top row: năm
      units.push({
        label: `${currentYear}`,
        width: yearWidth,
        isTop: true,
      });

      // bottom row: tháng
      for (let m = 1; m <= 12; m++) {
        units.push({
          label: `${m}`,
          width: bottomHeight,
          isTop: false,
        });
      }

      currentYear++;
    }
  }

  return (
    <div className="flex flex-col border-b border-gray-300 overflow-x-auto">
      {/* top row */}
      <div className="flex border-b border-gray-200">
        {units
          .filter((u) => u.isTop)
          .map((u, idx) => (
            <div
              key={`top-${idx}`}
              style={{
                width: `${u.width}px`,
                height: `${topHeight}px`,
              }}
              className="flex items-center justify-center border-r border-gray-200 text-sm font-medium"
            >
              {u.label}
            </div>
          ))}
      </div>

      {/* bottom row */}
      <div className="flex">
        {units
          .filter((u) => !u.isTop)
          .map((u, idx) => (
            <div
              key={`bottom-${idx}`}
              style={{
                width: `${u.width}px`,
                height: `${bottomHeight}px`,
              }}
              className="flex items-center justify-center border-r border-gray-200 text-xs"
            >
              {u.label}
            </div>
          ))}
      </div>
    </div>
  );
};

export default GanttTimelineHeader;
