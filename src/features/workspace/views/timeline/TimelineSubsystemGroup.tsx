import React from "react";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { TimelineCollapseArrow } from "./TimelineCollapseArrow";
import { TimelineGridDaySlots } from "./TimelineGridDaySlots";
import { TimelineTaskBar } from "./TimelineTaskBar";
import { TimelineTaskStatusCell } from "./TimelineTaskStatusCell";
import {
  buildTimelineSubsystemHighlightStyle,
  buildTimelineTaskToneStyle,
} from "./timelineTaskColors";
import {
  getTaskDependencyCountsFromLookup,
  type TimelineTaskDependencyCounts,
  type TimelineTaskStatusSignal,
} from "./timelineGridBodyUtils";
import { getTimelineMergedCellRotation } from "./timelineViewModel";
import type {
  TimelineDayHeaderCell,
  TimelineSubsystemRow,
} from "./timelineViewModel";

interface TimelineSubsystemGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  clearHoveredMilestonePopup: () => void;
  collapsedSubsystems: Record<string, boolean>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyLeft: number;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemIndex: number;
  subsystemStickyLeft: number;
  taskDependencyCountsById: Record<string, TimelineTaskDependencyCounts>;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineGridTemplate: string;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
}

export const TimelineSubsystemGroup: React.FC<TimelineSubsystemGroupProps> = ({
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  clearHoveredMilestonePopup,
  collapsedSubsystems,
  disciplinesById,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  hoveredSubsystemId,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyLeft,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  selectTaskRow,
  selectedSubsystemId,
  showProjectCol,
  showSubsystemCol,
  subsystem,
  subsystemColumnIndex,
  subsystemIndex,
  subsystemStickyLeft,
  taskDependencyCountsById,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const buildOpaqueSurfaceFill = (surfaceBase: string, accent: string) =>
    `color-mix(in srgb, ${surfaceBase} 86%, ${accent} 14%)`;
  const getTaskDependencyCounts = (taskId: string) =>
    getTaskDependencyCountsFromLookup(taskDependencyCountsById, taskId);
  const canToggleSubsystem = subsystem.tasks.length > 1;
  const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
  const taskCount = Math.max(1, subsystem.tasks.length);
  const groupBackground = subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  const accentColor = subsystem.color;
  const isSubsystemHovered = hoveredSubsystemId === subsystem.id;
  const isSubsystemSelected = selectedSubsystemId === subsystem.id;
  const subsystemBandFill = isSubsystemHovered
    ? buildOpaqueSurfaceFill(groupBackground, accentColor)
    : isSubsystemSelected
      ? buildOpaqueSurfaceFill(groupBackground, accentColor)
      : null;
  const subsystemSurfaceBackground = subsystemBandFill
    ? subsystemBandFill
    : groupBackground;
  const subsystemSurfaceBorderRight = subsystemBandFill
    ? "1px solid transparent"
    : "1px solid var(--border-base)";
  const shouldRotateSubsystemLabel = !collapsed && taskCount > 1;
  const subsystemLabelRotation = getTimelineMergedCellRotation(taskCount);
  const renderStatusIconCell = (
    task: TimelineSubsystemRow["tasks"][number],
    gridRow: string | number,
    compact = false,
  ) => (
    <TimelineTaskStatusCell
      clearHoveredMilestonePopup={clearHoveredMilestonePopup}
      clearHoveredTaskRow={clearHoveredTaskRow}
      compact={compact}
      gridRow={gridRow}
      hoverTaskRow={hoverTaskRow}
      key={`status-icon-${subsystem.id}-${task.id}`}
      onOpenTask={openTaskDetailModal}
      ownerId={subsystem.id}
      statusIconColumnIndex={statusIconColumnIndex}
      statusIconColumnWidth={statusIconColumnWidth}
      statusIconStickyLeft={statusIconStickyLeft}
      task={task}
      taskStatusSignalsById={taskStatusSignalsById}
    />
  );

  return (
    <div
      className="subsystem-group"
      style={{
        display: "grid",
        width: "100%",
        minWidth: `${gridMinWidth}px`,
        gridTemplateColumns: timelineGridTemplate,
        gridAutoRows: "38px",
        background: groupBackground,
        borderBottom: "1px solid var(--border-base)",
        position: "relative",
      }}
      key={subsystem.id}
    >
      <div
        aria-hidden="true"
        className="timeline-row-highlight-anchor"
        data-timeline-row-anchor={`subsystem:${subsystem.id}`}
        style={{
          gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
          gridColumn: `${firstDayGridColumn} / -1`,
        }}
      />
      {showSubsystemCol ? (
        <div
          aria-pressed={isSubsystemSelected}
          className="timeline-merged-cell-column timeline-column-motion timeline-row-motion-item timeline-row-selectable"
          data-timeline-column="subsystem"
          onClick={() => selectSubsystemRow(subsystem.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectSubsystemRow(subsystem.id);
            }
          }}
          onMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onMouseLeave={clearHoveredSubsystemRow}
          role="button"
          tabIndex={0}
          style={buildTimelineSubsystemHighlightStyle(accentColor, {
            gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
            gridColumn: `${subsystemColumnIndex}`,
            position: "sticky",
            left: `${subsystemStickyLeft}px`,
            zIndex: 10021,
            background: subsystemSurfaceBackground,
            borderRight: subsystemSurfaceBorderRight,
            boxShadow: `inset 3px 0 0 ${accentColor}`,
            display: "flex",
            flexDirection: collapsed ? "row" : "column",
            justifyContent: collapsed ? "flex-start" : "center",
            alignItems: "center",
            minHeight: "38px",
            padding: collapsed ? "0 12px" : "8px 6px",
            overflow: collapsed ? "hidden" : "visible",
            boxSizing: "border-box",
          })}
        >
          {canToggleSubsystem ? (
            <button
              className="subsystem-toggle"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand subsystem" : "Collapse subsystem"}
              onClick={(event) => {
                event.stopPropagation();
                toggleSubsystem(subsystem.id);
              }}
              title={collapsed ? "Expand subsystem" : "Collapse subsystem"}
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "12px",
                color: "var(--text-copy)",
                marginRight: collapsed ? "6px" : 0,
                position: collapsed ? "static" : "absolute",
                top: collapsed ? undefined : "4px",
                right: collapsed ? undefined : "4px",
                zIndex: 1,
                flexShrink: 0,
              }}
            >
              <TimelineCollapseArrow isCollapsed={collapsed} />
            </button>
          ) : null}
          <div
            className={`timeline-merged-cell-text${shouldRotateSubsystemLabel ? " is-rotated" : ""}`}
            style={
              shouldRotateSubsystemLabel
                ? ({
                    ["--timeline-merged-cell-rotation" as const]:
                      subsystemLabelRotation,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "0.55rem",
                  height: "0.55rem",
                  borderRadius: "999px",
                  flexShrink: 0,
                  background: accentColor,
                  boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.08)",
                }}
              />
              <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={subsystem.name}>
                {subsystem.name}
              </span>
            </span>
          </div>
          {!collapsed ? (
            <span className="timeline-subsystem-counter-corner">
              {subsystem.completeCount}/{subsystem.taskCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {showProjectCol ? (
        <div
          className="timeline-merged-cell-column timeline-column-motion"
          data-timeline-column="project"
          style={{
            gridRow: `1 / span ${taskCount}`,
            gridColumn: "1",
            minHeight: "38px",
            padding: "10px 12px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-title)",
            borderRight: "1px solid var(--border-base)",
            boxShadow: `inset 3px 0 0 ${accentColor}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            position: "sticky",
            left: 0,
            zIndex: 10022,
            background: groupBackground,
            overflow: "visible",
            whiteSpace: "nowrap",
          }}
          title={subsystem.projectName}
        >
          <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={subsystem.projectName}>
            {subsystem.projectName}
          </span>
        </div>
      ) : null}

      {collapsed ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow="1"
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          onRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onRowMouseLeave={clearHoveredSubsystemRow}
          rowKey={`subsystem-${subsystem.id}-collapsed`}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {collapsed &&
        subsystem.tasks.map((task) => (
          <React.Fragment key={task.id}>
            <div
              aria-hidden="true"
              className="timeline-row-highlight-anchor"
              data-timeline-row-anchor={`task:${task.id}`}
              style={{
                gridRow: "1",
                gridColumn: `${firstDayGridColumn} / -1`,
              }}
            />
            {renderStatusIconCell(task, "1", true)}
            <TimelineTaskBar
              compact
              dependencyCounts={getTaskDependencyCounts(task.id)}
              onMouseEnter={() => {
                hoverTaskRow(task.id);
                clearHoveredMilestonePopup();
              }}
              onMouseLeave={clearHoveredTaskRow}
              onOpenTask={openTaskDetailModal}
              style={buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
                gridRow: "1",
                gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                height: "8px",
                margin: "0 2px",
                position: "relative",
                zIndex: 10018,
                borderRadius: "2px",
                border: "none",
                cursor: "pointer",
                alignSelf: "center",
                minWidth: 0,
                padding: 0,
                opacity: 0.7,
              })}
                spillsLeft={task.spillsLeft}
                spillsRight={task.spillsRight}
                task={task}
                title={`${task.title} (${task.status})`}
              />
          </React.Fragment>
        ))}

      {!collapsed && subsystem.tasks.length === 0 ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow="1"
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          onRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onRowMouseLeave={clearHoveredSubsystemRow}
          rowKey={`subsystem-${subsystem.id}-empty`}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {!collapsed
        ? subsystem.tasks.map((task, taskIndex) => (
            <React.Fragment key={task.id}>
              <div
                aria-hidden="true"
                className="timeline-row-highlight-anchor"
                data-timeline-row-anchor={`task:${task.id}`}
                style={{
                  gridRow: taskIndex + 1,
                  gridColumn: `${firstDayGridColumn} / -1`,
                }}
              />
              {renderStatusIconCell(task, taskIndex + 1)}
              <TimelineGridDaySlots
                clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                firstDayGridColumn={firstDayGridColumn}
                gridRow={taskIndex + 1}
                handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                onRowClick={() => selectTaskRow(task)}
                includeTopBorder={taskIndex > 0}
                onRowMouseEnter={() => {
                  clearHoveredTaskRow();
                  hoverSubsystemRow(subsystem.id);
                }}
                onRowMouseLeave={clearHoveredSubsystemRow}
                rowKey={`subsystem-${subsystem.id}-task-${task.id}`}
                timelineDayHeaderCells={timelineDayHeaderCells}
              />
              <TimelineTaskBar
                dependencyCounts={getTaskDependencyCounts(task.id)}
                onMouseEnter={() => {
                  hoverTaskRow(task.id);
                  clearHoveredMilestonePopup();
                }}
                onMouseLeave={clearHoveredTaskRow}
                onOpenTask={openTaskDetailModal}
                style={buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
                  gridRow: taskIndex + 1,
                  gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                  margin: "4px 4px",
                  position: "relative",
                  zIndex: 10018,
                  borderRadius: "4px",
                  border: "none",
                  color: "#fff",
                  fontSize: "0.7rem",
                  textAlign: "left",
                  padding: "0 8px",
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  alignSelf: "center",
                  minWidth: 0,
                })}
                spillsLeft={task.spillsLeft}
                spillsRight={task.spillsRight}
                task={task}
                title={`View details for ${task.title}`}
              />
            </React.Fragment>
          ))
        : null}
    </div>
  );
};
