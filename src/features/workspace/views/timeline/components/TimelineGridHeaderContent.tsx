import React from "react";

import {
  buildTimelineHiddenColumnToggles,
  buildTimelineMonthHeaderCells,
  getTimelineHiddenToggleLeft,
} from "../model/timelineGridHeaderData";
import type { TimelineGridHeaderProps } from "../timelineGridTypes";
import { TimelineDayHeaderRow } from "./TimelineDayHeaderRow";
import { TimelineFixedColumnHeader } from "./TimelineFixedColumnHeader";
import { TimelineHiddenColumnToggles } from "./TimelineHiddenColumnToggles";
import { TimelineMonthHeaderRow } from "./TimelineMonthHeaderRow";

export function TimelineGridHeaderContent({
  firstDayGridColumn,
  onOpenMilestoneDetails,
  gridMinWidth,
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
      className={`timeline-shell ${projectColumnWidth === 28 || subsystemColumnWidth === 28 ? "is-compact " : ""}${timelineFilterMotionClass}${isWeekView ? " is-week-view" : ""}`}
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
          <TimelineFixedColumnHeader
            gridColumn={subsystemColumnIndex}
            isVisible={showSubsystemCol}
            label="Subsystem"
            left={subsystemStickyLeft}
            onToggle={toggleSubsystemColumn}
            width={subsystemColumnWidth}
            zIndex={10030}
          />
        ) : null}

        {hasProjectColumn && showProjectCol ? (
          <TimelineFixedColumnHeader
            gridColumn="1"
            isVisible={showProjectCol}
            label="Project"
            left={0}
            onToggle={toggleProjectColumn}
            width={projectColumnWidth}
            zIndex={10031}
          />
        ) : null}

        <div className="timeline-task-name-header" style={{ gridColumn: firstDayGridColumn - 1,
          gridRow: "1 / span 2", left: visibleFixedColumnWidth }}>Task / status</div>
        <TimelineMonthHeaderRow cells={monthHeaderCells} />
        <TimelineDayHeaderRow
        onOpenMilestoneDetails={onOpenMilestoneDetails}
          cells={timelineDayHeaderCells}
          firstDayGridColumn={firstDayGridColumn}
          handleTimelineHeaderDayClick={handleTimelineHeaderDayClick}
          isWeekView={isWeekView}
          timelineDayCellRefs={timelineDayCellRefs}
        />
      </div>
      <TimelineHiddenColumnToggles left={hiddenToggleLeft} toggles={hiddenColumnToggles} />
      {children}
    </div>
  );
}
