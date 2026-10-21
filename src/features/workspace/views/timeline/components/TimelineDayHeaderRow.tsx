import { Diamond } from "lucide-react";
import { WorkspacePopover } from "@/features/workspace/shared/ui/WorkspacePopover";
import { datePortion } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type React from "react";

import type { TimelineDayHeaderCell } from "../timelineViewModel";

interface TimelineDayHeaderRowProps {
  cells: TimelineDayHeaderCell[];
  onOpenMilestoneDetails: (milestone: MilestoneRecord) => void;
  firstDayGridColumn: number;
  handleTimelineHeaderDayClick: (day: string) => void;
  isWeekView: boolean;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export function TimelineDayHeaderRow({
  cells,
  firstDayGridColumn,
  onOpenMilestoneDetails,
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
          data-week-start={new Date(`${cell.day}T12:00:00`).getDay() === 1 || undefined}
          ref={(node) => {
            timelineDayCellRefs.current[cell.day] = node;
          }}
          key={cell.day}
          style={{
            gridRow: "2",
            gridColumn: dayIndex + firstDayGridColumn,
            textAlign: "center",
            fontSize: "9px",
            padding: "6px 0",
            borderRight: "1px solid var(--border-base)",
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
            background: "var(--bg-panel)",
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
                color: "var(--text-title)",
                fontWeight: 700,
              }}
            >
              {cell.dayNumberLabel}
            </strong>
          </button>
          {cell.milestonesOnDay.some((milestone) => dayIndex === 0 || datePortion(milestone.startAt) === cell.day) &&
            <WorkspacePopover className="timeline-milestone-marker" label={`Milestones on ${cell.day}`}
              trigger={<><Diamond size={12} aria-hidden="true" /><span>{cell.milestonesOnDay.length > 1 ? `${cell.milestonesOnDay.length} milestones` : cell.milestonesOnDay[0].title}</span></>}>
              {(close) => <ul className="timeline-reference-list">{cell.milestonesOnDay.map((milestone) => <li key={milestone.id}>
                <button type="button" className="text-link" onClick={() => { close(); onOpenMilestoneDetails(milestone); }}>{milestone.title}</button>
                <span>{datePortion(milestone.startAt)}{milestone.endAt ? ` – ${datePortion(milestone.endAt)}` : ""}</span>
              </li>)}</ul>}
            </WorkspacePopover>}
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
