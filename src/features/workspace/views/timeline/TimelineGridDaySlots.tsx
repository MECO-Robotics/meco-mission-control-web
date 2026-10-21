import React from "react";
import type { TimelineDayHeaderCell } from "./timelineViewModel";

interface TimelineGridDaySlotsProps {
  firstDayGridColumn: number;
  gridRow: string | number;
  includeTopBorder?: boolean;
  onRowClick?: () => void;
  onRowMouseEnter?: () => void;
  onRowMouseLeave?: () => void;
  rowKey: string;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
}

export const TimelineGridDaySlots: React.FC<TimelineGridDaySlotsProps> = ({
  firstDayGridColumn,
  gridRow,
  includeTopBorder = false,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  rowKey,
  timelineDayHeaderCells,
}) =>
  timelineDayHeaderCells.map((cell, dayIndex) => (
    <div
      aria-hidden="true"
      className="timeline-day-slot"
      data-popup-end-day={cell.primaryMilestoneEndDay}
      data-popup-start-day={cell.primaryMilestoneStartDay}
      data-timeline-day={cell.day}
      data-weekend={[0, 6].includes(new Date(`${cell.day}T12:00:00`).getDay()) || undefined}
      data-week-start={new Date(`${cell.day}T12:00:00`).getDay() === 1 || undefined}
      data-timeline-grid-cell="true"
      key={`${rowKey}-${cell.day}`}
      onClick={onRowClick}
      onMouseEnter={() => {
        onRowMouseEnter?.();
      }}
      onMouseLeave={() => {
        onRowMouseLeave?.();
      }}
      style={{
        gridRow,
        gridColumn: dayIndex + firstDayGridColumn,
        borderRight: `1px solid ${cell.dayStyle?.columnBorder ?? "var(--border-base)"}`,
        borderTop: includeTopBorder ? "1px solid var(--border-base)" : "none",
        background: undefined,
        minHeight: "38px",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 0,
        cursor: onRowClick ? "pointer" : undefined,
      }}
    />
  ));
