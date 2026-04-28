import React from "react";
import { IconEye } from "@/components/shared";
import type { TimelineDayHeaderCell, TimelineMonthGroup } from "./timelineViewModel";

type TimelineGridMotion = "left" | "right" | "neutral";

interface TimelineGridHeaderProps {
  clearHoveredMilestonePopup: () => void;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  handleTimelineZoomWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
  monthGroups: TimelineMonthGroup[];
  openEventModalForDay: (day: string) => void;
  projectColumnWidth: number;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  showTaskCol: boolean;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemStickyLeft: number;
  taskLabelColumnIndex: number;
  taskLabelStickyLeft: number;
  taskColumnWidth: number;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridTemplate: string;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  toggleProjectColumn: () => void;
  toggleSubsystemColumn: () => void;
  toggleTaskColumn: () => void;
  children?: React.ReactNode;
}

export const TimelineGridHeader: React.FC<TimelineGridHeaderProps> = ({
  clearHoveredMilestonePopup,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  handleTimelineZoomWheel,
  hasProjectColumn,
  monthGroups,
  openEventModalForDay,
  projectColumnWidth,
  showProjectCol,
  showSubsystemCol,
  showTaskCol,
  subsystemColumnIndex,
  subsystemColumnWidth,
  subsystemStickyLeft,
  taskLabelColumnIndex,
  taskLabelStickyLeft,
  taskColumnWidth,
  timelineDayCellRefs,
  timelineDayHeaderCells,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridRef,
  timelineGridTemplate,
  timelineShellRef,
  toggleProjectColumn,
  toggleSubsystemColumn,
  toggleTaskColumn,
  children,
}) => (
  <div
    ref={timelineShellRef}
    className={`timeline-shell ${timelineFilterMotionClass}`}
    onWheel={handleTimelineZoomWheel}
    style={{
      overflowX: "auto",
      padding: 0,
      background: "var(--bg-panel)",
      borderRadius: 0,
      border: "1px solid var(--border-base)",
      position: "relative",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      justifySelf: "stretch",
    }}
  >
    <div
      className="timeline-grid-motion"
      data-period-motion={timelineGridMotion.direction ?? undefined}
      key={`timeline-grid-${timelineGridMotion.token}`}
      ref={timelineGridRef}
      style={{
        display: "grid",
        width: "100%",
        minWidth: `${gridMinWidth}px`,
        gridTemplateColumns: timelineGridTemplate,
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <button
        aria-label={`${showSubsystemCol ? "Hide" : "Show"} subsystem column`}
        aria-pressed={showSubsystemCol}
        className={`sticky-label timeline-column-header timeline-column-header-button timeline-column-motion${showSubsystemCol ? "" : " is-hidden"}`}
        onClick={toggleSubsystemColumn}
        title={`${showSubsystemCol ? "Hide" : "Show"} subsystem column`}
        style={{
          gridRow: showSubsystemCol ? "1 / span 2" : "1",
          gridColumn: `${subsystemColumnIndex}`,
          width: `${subsystemColumnWidth}px`,
          minWidth: `${subsystemColumnWidth}px`,
          maxWidth: `${subsystemColumnWidth}px`,
          padding: showSubsystemCol ? "10px 12px" : "4px",
          fontWeight: "bold",
          borderRight: "1px solid var(--border-base)",
          borderBottom: "1px solid var(--border-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: showSubsystemCol ? "space-between" : "center",
          gap: "0.3rem",
          boxSizing: "border-box",
          height: "100%",
          position: "sticky",
          left: `${subsystemStickyLeft}px`,
          zIndex: 10030,
          background: "var(--bg-panel)",
        }}
        type="button"
      >
        {showSubsystemCol ? <span className="timeline-column-header-label">Subsystem</span> : null}
        <span
          aria-hidden="true"
          className={`timeline-column-visibility-icon${showSubsystemCol ? " is-active" : ""}`}
        >
          <IconEye />
        </span>
      </button>

      <button
        aria-label={`${showTaskCol ? "Hide" : "Show"} task column`}
        aria-pressed={showTaskCol}
        className={`sticky-label timeline-column-header timeline-column-header-button timeline-column-motion${showTaskCol ? "" : " is-hidden"}`}
        onClick={toggleTaskColumn}
        title={`${showTaskCol ? "Hide" : "Show"} task column`}
        style={{
          gridRow: showTaskCol ? "1 / span 2" : "1",
          gridColumn: `${taskLabelColumnIndex}`,
          width: `${taskColumnWidth}px`,
          minWidth: `${taskColumnWidth}px`,
          maxWidth: `${taskColumnWidth}px`,
          padding: showTaskCol ? "10px 12px" : "4px",
          fontWeight: "bold",
          borderRight: "1px solid var(--border-base)",
          borderBottom: "1px solid var(--border-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: showTaskCol ? "space-between" : "center",
          gap: "0.3rem",
          boxSizing: "border-box",
          height: "100%",
          position: "sticky",
          left: `${taskLabelStickyLeft}px`,
          zIndex: 10030,
          background: "var(--bg-panel)",
        }}
        type="button"
      >
        {showTaskCol ? <span className="timeline-column-header-label">Task</span> : null}
        <span aria-hidden="true" className={`timeline-column-visibility-icon${showTaskCol ? " is-active" : ""}`}>
          <IconEye />
        </span>
      </button>

      {hasProjectColumn ? (
        <button
          aria-label={`${showProjectCol ? "Hide" : "Show"} project column`}
          aria-pressed={showProjectCol}
          className={`sticky-label timeline-column-header timeline-column-header-button timeline-column-motion${showProjectCol ? "" : " is-hidden"}`}
          onClick={toggleProjectColumn}
          title={`${showProjectCol ? "Hide" : "Show"} project column`}
          style={{
            gridRow: showProjectCol ? "1 / span 2" : "1",
            gridColumn: "1",
            width: `${projectColumnWidth}px`,
            minWidth: `${projectColumnWidth}px`,
            maxWidth: `${projectColumnWidth}px`,
            padding: showProjectCol ? "10px 12px" : "4px",
            fontWeight: "bold",
            borderRight: "1px solid var(--border-base)",
            borderBottom: "1px solid var(--border-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: showProjectCol ? "space-between" : "center",
            gap: "0.3rem",
            boxSizing: "border-box",
            height: "100%",
            position: "sticky",
            left: 0,
            zIndex: 10031,
            background: "var(--bg-panel)",
          }}
          type="button"
        >
          {showProjectCol ? <span className="timeline-column-header-label">Project</span> : null}
          <span
            aria-hidden="true"
            className={`timeline-column-visibility-icon${showProjectCol ? " is-active" : ""}`}
          >
            <IconEye />
          </span>
        </button>
      ) : null}

      {(() => {
        let currentColumn = firstDayGridColumn;
        return monthGroups.map((group, index) => {
          const start = currentColumn;
          currentColumn += group.span;
          return (
            <div
              key={`month-${index}`}
              style={{
                gridRow: "1",
                gridColumn: `${start} / span ${group.span}`,
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "6px 0",
                borderBottom: "1px solid var(--border-base)",
                borderRight: "1px solid var(--border-base)",
                textTransform: "uppercase",
                color: "var(--meco-blue)",
                background: "var(--bg-row-alt)",
                position: "sticky",
                top: 0,
                zIndex: 12,
                boxSizing: "border-box",
              }}
            >
              {group.month}
            </div>
          );
        });
      })()}

      {timelineDayHeaderCells.map((cell, dayIndex) => (
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
          data-popup-start-day={cell.primaryEventStartDay}
          data-popup-end-day={cell.primaryEventEndDay}
        >
          <span style={{ whiteSpace: "nowrap", fontSize: "8px" }}>{cell.weekdayLabel}</span>
          <button
            className={`timeline-day-number-button${cell.eventsOnDay.length ? " has-event" : ""}`}
            onClick={() => openEventModalForDay(cell.day)}
            title={cell.eventsOnDay.length ? `Edit milestone on ${cell.day}` : `Add milestone on ${cell.day}`}
            type="button"
          >
            <strong
              style={{
                fontSize: "11px",
                color: cell.dayStyle ? cell.dayStyle.chipText : "var(--text-title)",
              }}
            >
              {cell.dayNumberLabel}
            </strong>
          </button>
        </div>
      ))}
    </div>
    {children}
  </div>
);
