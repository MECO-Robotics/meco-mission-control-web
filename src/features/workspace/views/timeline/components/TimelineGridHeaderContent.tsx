import React from "react";
import { IconEye } from "@/components/shared/Icons";

import {
  buildTimelineHiddenColumnToggles,
  buildTimelineMonthHeaderCells,
  getTimelineHiddenToggleLeft,
} from "../model/timelineGridHeaderData";
import type { TimelineGridHeaderProps } from "../timelineGridHeaderTypes";

export function TimelineGridHeaderContent({
  clearHoveredMilestonePopup,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  handleTimelineHeaderDayClick,
  handleTimelineZoomWheel,
  hasProjectColumn,
  isScrolling,
  isWeekView,
  monthGroups,
  projectColumnWidth,
  showProjectCol,
  showSubsystemCol,
  subsystemColumnIndex,
  subsystemColumnWidth,
  subsystemStickyLeft,
  timelineDayCellRefs,
  timelineDayHeaderCells,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridRef,
  timelineGridTemplate,
  timelineZoom,
  timelineShellRef,
  toggleProjectColumn,
  toggleSubsystemColumn,
  children,
}: TimelineGridHeaderProps) {
  const hiddenColumnToggles = buildTimelineHiddenColumnToggles({
    hasProjectColumn,
    showProjectCol,
    showSubsystemCol,
    toggleProjectColumn,
    toggleSubsystemColumn,
  });
  const hiddenToggleLeft = getTimelineHiddenToggleLeft(
    projectColumnWidth,
    subsystemColumnWidth,
    hiddenColumnToggles.length,
  );
  const monthHeaderCells = React.useMemo(
    () => buildTimelineMonthHeaderCells(monthGroups, firstDayGridColumn),
    [firstDayGridColumn, monthGroups],
  );
  const visibleFixedColumnWidth =
    (showProjectCol ? projectColumnWidth : 0) + (showSubsystemCol ? subsystemColumnWidth : 0);
  const minimumDayWidth =
    timelineDayHeaderCells.length > 0
      ? Math.max(0, Math.round((gridMinWidth - visibleFixedColumnWidth) / timelineDayHeaderCells.length))
      : 0;
  const timelineTaskBarEdgeGap = Math.max(2, Math.round(minimumDayWidth * 0.08));

  return (
    <div
      ref={timelineShellRef}
      className={`timeline-shell ${timelineFilterMotionClass}${isWeekView ? " is-week-view" : ""}`}
      data-is-scrolling={isScrolling ? "true" : undefined}
      onWheel={handleTimelineZoomWheel}
      style={{
        "--timeline-task-bar-edge-gap": `${timelineTaskBarEdgeGap}px`,
        "--timeline-zoom": timelineZoom,
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
        alignSelf: "stretch",
      } as React.CSSProperties & { "--timeline-zoom": number }}
    >
      <div
        className="timeline-grid-motion"
        data-period-motion={timelineGridMotion.direction ?? undefined}
        key={`timeline-grid-${timelineGridMotion.token}`}
        ref={timelineGridRef}
        style={{
          "--timeline-task-bar-edge-gap": `${timelineTaskBarEdgeGap}px`,
          "--timeline-zoom": timelineZoom,
          display: "grid",
          width: "100%",
          minWidth: `${gridMinWidth}px`,
          gridTemplateColumns: timelineGridTemplate,
          position: "relative",
          boxSizing: "border-box",
        } as React.CSSProperties}
      >
        {showSubsystemCol ? (
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
        ) : null}

        {hasProjectColumn && showProjectCol ? (
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

        {monthHeaderCells.map((group, index) => (
          <div
            key={`month-${index}`}
            style={{
              gridRow: "1",
              gridColumn: `${group.startColumn} / span ${group.span}`,
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
        ))}

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
              className={`timeline-day-number-button${cell.milestonesOnDay.length ? " has-milestone" : ""}`}
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
          </div>
        ))}
      </div>
      {hiddenColumnToggles.length > 0 ? (
        <div
          className="timeline-hidden-column-toggles"
          style={{
            left: `${hiddenToggleLeft}px`,
          }}
        >
          {hiddenColumnToggles.map((toggle) => (
            <button
              key={toggle.id}
              aria-label={toggle.label}
              className="timeline-column-overlay-toggle"
              onClick={toggle.onClick}
              title={toggle.label}
              type="button"
            >
              <span aria-hidden="true" className="timeline-column-visibility-icon">
                <IconEye />
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
