import React from "react";
import { EditableHoverIndicator } from "@/features/workspace/shared";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { TimelineCollapseArrow } from "./TimelineCollapseArrow";
import { TimelineGridDaySlots } from "./TimelineGridDaySlots";
import { TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import {
  buildTimelineSubsystemHighlightStyle,
  buildTimelineTaskToneStyle,
  getTimelineRowHighlightHoverFill,
  getTimelineRowHighlightSelectedFill,
  getTimelineTaskDisciplineColor,
} from "./timelineTaskColors";
import { getTaskDependencyCounts } from "./timelineGridBodyUtils";
import type {
  TimelineDayHeaderCell,
  TimelineSubsystemRow,
} from "./timelineViewModel";

interface TimelineSubsystemGroupProps {
  bootstrap: BootstrapPayload;
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  clearHoveredMilestonePopup: () => void;
  collapsedSubsystems: Record<string, boolean>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  hoveredTaskId: string | null;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectedSubsystemId: string | null;
  selectedTaskId: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  showTaskCol: boolean;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemIndex: number;
  subsystemStickyLeft: number;
  taskLabelColumnIndex: number;
  taskLabelStickyLeft: number;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineGridTemplate: string;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
}

export const TimelineSubsystemGroup: React.FC<TimelineSubsystemGroupProps> = ({
  bootstrap,
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  clearHoveredMilestonePopup,
  collapsedSubsystems,
  disciplinesById,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  hoveredSubsystemId,
  hoveredTaskId,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  selectedSubsystemId,
  selectedTaskId,
  showProjectCol,
  showSubsystemCol,
  showTaskCol,
  subsystem,
  subsystemColumnIndex,
  subsystemIndex,
  subsystemStickyLeft,
  taskLabelColumnIndex,
  taskLabelStickyLeft,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const canToggleSubsystem = subsystem.tasks.length > 1;
  const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
  const taskCount = Math.max(1, subsystem.tasks.length);
  const groupBackground = subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  const accentColor = subsystem.color;
  const isSubsystemHovered = hoveredSubsystemId === subsystem.id;
  const isSubsystemSelected = selectedSubsystemId === subsystem.id;
  const hasSelectedTask = subsystem.tasks.some((task) => task.id === selectedTaskId);
  const hasHoveredTask = subsystem.tasks.some((task) => task.id === hoveredTaskId);
  const subsystemBandFill = isSubsystemHovered
    ? getTimelineRowHighlightHoverFill(accentColor)
    : isSubsystemSelected
      ? getTimelineRowHighlightSelectedFill(accentColor)
      : null;
  const subsystemSurfaceBackground = subsystemBandFill
    ? subsystemBandFill
    : hasSelectedTask || hasHoveredTask
      ? "transparent"
      : groupBackground;
  const subsystemSurfaceBorderRight = subsystemBandFill
    ? "1px solid transparent"
    : "1px solid var(--border-base)";
  const shouldRotateSubsystemLabel = !collapsed && taskCount > 1;

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
          <div className={`timeline-merged-cell-text${shouldRotateSubsystemLabel ? " is-rotated" : ""}`}>
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

      {collapsed && showTaskCol ? (
        <div
          className="timeline-column-motion timeline-subsystem-summary"
          data-timeline-column="task"
          onMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onMouseLeave={clearHoveredSubsystemRow}
          style={{
            gridRow: "1",
            gridColumn: `${taskLabelColumnIndex}`,
            position: "sticky",
            left: `${taskLabelStickyLeft}px`,
            zIndex: 10020,
            background: subsystemSurfaceBackground,
            borderRight: subsystemSurfaceBorderRight,
            boxShadow: `inset 3px 0 0 ${accentColor}`,
            boxSizing: "border-box",
            minHeight: "38px",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            fontSize: "0.72rem",
            color: "var(--text-copy)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subsystem.tasks.length} task{subsystem.tasks.length === 1 ? "" : "s"}
        </div>
      ) : null}

      {!collapsed && showTaskCol ? (
        <div
          className="timeline-column-motion timeline-row-motion-item timeline-task-column-fill"
          data-timeline-column="task"
          onMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onMouseLeave={clearHoveredSubsystemRow}
          style={{
            gridRow: `1 / span ${taskCount}`,
            gridColumn: `${taskLabelColumnIndex}`,
            position: "sticky",
            left: `${taskLabelStickyLeft}px`,
            zIndex: 10020,
            background: subsystemSurfaceBackground,
            borderRight: subsystemSurfaceBorderRight,
            boxShadow: `inset 3px 0 0 ${accentColor}`,
            boxSizing: "border-box",
          }}
        />
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
            <button
              className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
              data-tutorial-target="timeline-task-bar"
              onClick={() => openTaskDetailModal(task)}
              onMouseEnter={() => {
                hoverTaskRow(task.id);
                clearHoveredMilestonePopup();
              }}
              onMouseLeave={clearHoveredTaskRow}
              style={buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
                gridRow: "1",
                gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                height: "8px",
                margin: "0 2px",
                position: "relative",
                zIndex: 6,
                borderRadius: "2px",
                border: "none",
                cursor: "pointer",
                alignSelf: "center",
                minWidth: 0,
                padding: 0,
                opacity: 0.7,
              })}
              title={`${task.title} (${task.status})`}
              type="button"
            >
              <TimelineTaskStatusLogo compact status={task.status} />
              <EditableHoverIndicator className="editable-hover-indicator-compact" />
            </button>
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
              {showTaskCol ? (
                <button
                  className={`task-label timeline-task-label timeline-task-label-${task.status} timeline-column-motion timeline-row-motion-item`}
                  data-tutorial-target="timeline-task-label"
                  onClick={() => openTaskDetailModal(task)}
                  onMouseEnter={() => hoverTaskRow(task.id)}
                  onMouseLeave={clearHoveredTaskRow}
                  style={(() => {
                    const taskDisciplineColor = getTimelineTaskDisciplineColor(task.disciplineId, disciplinesById);
                    const taskRowFill =
                      hoveredTaskId === task.id
                        ? getTimelineRowHighlightHoverFill(taskDisciplineColor)
                        : selectedTaskId === task.id
                          ? getTimelineRowHighlightSelectedFill(taskDisciplineColor)
                          : subsystemBandFill;
                    return buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
                      "--timeline-task-row-fill": taskRowFill ?? groupBackground,
                      gridRow: taskIndex + 1,
                      gridColumn: `${taskLabelColumnIndex}`,
                      minHeight: "38px",
                      padding: "0 10px",
                      fontSize: "0.8rem",
                      border: "none",
                      borderRight: taskRowFill
                        ? "1px solid transparent"
                        : "1px solid var(--border-base)",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      position: "sticky",
                      left: `${taskLabelStickyLeft}px`,
                      zIndex: 10020,
                      overflow: "visible",
                      borderTop: taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                      borderRadius: 0,
                      textAlign: "left",
                      cursor: "pointer",
                    });
                  })()}
                  type="button"
                  >
                    <strong
                      className="timeline-task-label-title timeline-ellipsis-reveal"
                      data-full-text={task.title}
                      style={{
                        display: "block",
                        lineHeight: "1.2",
                      }}
                    >
                      {task.title}
                    </strong>
                </button>
              ) : null}
              <TimelineGridDaySlots
                clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                firstDayGridColumn={firstDayGridColumn}
                gridRow={taskIndex + 1}
                handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                includeTopBorder={taskIndex > 0}
                onRowMouseEnter={() => {
                  clearHoveredTaskRow();
                  hoverSubsystemRow(subsystem.id);
                }}
                onRowMouseLeave={clearHoveredSubsystemRow}
                rowKey={`subsystem-${subsystem.id}-task-${task.id}`}
                timelineDayHeaderCells={timelineDayHeaderCells}
              />
              <button
                className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                data-tutorial-target="timeline-task-bar"
                onClick={() => openTaskDetailModal(task)}
                onMouseEnter={() => {
                  hoverTaskRow(task.id);
                  clearHoveredMilestonePopup();
                }}
                onMouseLeave={clearHoveredTaskRow}
                style={buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
                  gridRow: taskIndex + 1,
                  gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                  margin: "4px 4px",
                  position: "relative",
                  zIndex: 6,
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
                title={`View details for ${task.title}`}
                type="button"
              >
                <TimelineTaskStatusLogo status={task.status} />
                {task.title}
                {(() => {
                  const dependencyCounts = getTaskDependencyCounts(task.id, bootstrap.taskDependencies);
                  if (dependencyCounts.incoming === 0 && dependencyCounts.outgoing === 0) {
                    return null;
                  }

                  return (
                    <span
                      aria-hidden="true"
                      style={{
                        marginLeft: "8px",
                        fontSize: "0.65rem",
                        opacity: 0.8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dependencyCounts.incoming > 0 ? `↙ ${dependencyCounts.incoming}` : ""}
                      {dependencyCounts.incoming > 0 && dependencyCounts.outgoing > 0 ? " " : ""}
                      {dependencyCounts.outgoing > 0 ? `↗ ${dependencyCounts.outgoing}` : ""}
                    </span>
                  );
                })()}
                <EditableHoverIndicator className="editable-hover-indicator-compact" />
              </button>
            </React.Fragment>
          ))
        : null}
    </div>
  );
};
