import type React from "react";

import type { TimelineDayHeaderCell } from "../timelineViewModel";

interface TimelineDayHeaderRowProps {
  cells: TimelineDayHeaderCell[];
  clearHoveredMilestonePopup: () => void;
  firstDayGridColumn: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  handleTimelineHeaderDayClick: (day: string) => void;
  isWeekView: boolean;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export function TimelineDayHeaderRow({
  cells,
  clearHoveredMilestonePopup,
  firstDayGridColumn,
  handleTimelineDayMouseEnter,
  handleTimelineHeaderDayClick,
  isWeekView,
  timelineDayCellRefs,
}: TimelineDayHeaderRowProps) {
  return (
    <>
      {cells.map((cell, dayIndex) => (
        <div
          className="timeline-day"
          data-timeline-day={cell.day}
          ref={(node) => {
            timelineDayCellRefs.current[cell.day] = node;
          }}
          onMouseEnter={handleTimelineDayMouseEnter}
          onMouseLeave={clearHoveredMilestonePopup}
          key={cell.day}
          style={{
            gridRow: "2",
            gridColumn: dayIndex + firstDayGridColumn,
            textAlign: "center",
            fontSize: "9px",
            padding: "6px 0",
            borderRight: `1px solid ${cell.dayStyle?.columnBorder ?? "var(--border-base)"}`,
            borderBottom: "2px solid var(--border-base)",
            color: "var(--text-copy)",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            lineHeight: "1.1",
            minWidth: 0,
            overflow: "visible",
            boxSizing: "border-box",
            position: "sticky",
            top: "27px",
            zIndex: 12,
            background: cell.dayStyle?.columnBackground ?? "var(--bg-panel)",
          }}
          data-popup-start-day={cell.primaryMilestoneStartDay}
          data-popup-end-day={cell.primaryMilestoneEndDay}
        >
          <span className="timeline-day-weekday-label timeline-day-weekday-label-full">
            {cell.weekdayLabel}
          </span>
          <span className="timeline-day-weekday-label timeline-day-weekday-label-compact">
            {cell.weekdayNarrowLabel}
          </span>
          <button
            className={`timeline-day-number-button${cell.milestonesOnDay.length ? " has-milestone" : ""}${cell.meetingsOnDay.length ? " has-event" : ""}`}
            onClick={() => handleTimelineHeaderDayClick(cell.day)}
            title={
              isWeekView
                ? cell.milestonesOnDay.length
                  ? `Edit milestone on ${cell.day}`
                  : `Add milestone on ${cell.day}`
                : `Open week of ${cell.day}`
            }
            type="button"
          >
            <strong
              style={{
                fontSize: "11px",
                color: cell.dayStyle ? cell.dayStyle.chipText : "var(--text-title)",
                fontWeight: 700,
              }}
            >
              {cell.dayNumberLabel}
            </strong>
          </button>
          {cell.meetingsOnDay.length > 0 ? (
            <span
              className={`timeline-day-event-chip${cell.meetingsOnDay.length > 1 ? " has-multiple" : ""}`}
              title={cell.meetingsOnDay.map((meeting) => meeting.title).join(", ")}
            >
              {cell.meetingsOnDay.length === 1 ? "Mtg" : `${cell.meetingsOnDay.length} mtgs`}
            </span>
          ) : null}
        </div>
      ))}
    </>
  );
}
