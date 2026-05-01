import React from "react";
import type { BootstrapPayload } from "@/types";
import type { TaskRecord } from "@/types";
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
  TimelineProjectRow,
} from "./timelineViewModel";

interface TimelineProjectGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  clearHoveredMilestonePopup: () => void;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  project: TimelineProjectRow;
  projectIndex: number;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystemColumnIndex: number;
  subsystemStickyLeft: number;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyLeft: number;
  taskDependencyCountsById: Record<string, TimelineTaskDependencyCounts>;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineGridTemplate: string;
  toggleProject: (id: string) => void;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
}

export const TimelineProjectGroup: React.FC<TimelineProjectGroupProps> = ({
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  clearHoveredMilestonePopup,
  collapsedProjects,
  collapsedSubsystems,
  disciplinesById,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  hoveredSubsystemId,
  hoverTaskRow,
  hoverSubsystemRow,
  project,
  projectIndex,
  selectSubsystemRow,
  selectTaskRow,
  selectedSubsystemId,
  showProjectCol,
  showSubsystemCol,
  subsystemColumnIndex,
  subsystemStickyLeft,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyLeft,
  taskDependencyCountsById,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleProject,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const buildOpaqueSurfaceFill = (surfaceBase: string, accent: string) =>
    `color-mix(in srgb, ${surfaceBase} 86%, ${accent} 14%)`;
  const getTaskDependencyCounts = (taskId: string) =>
    getTaskDependencyCountsFromLookup(taskDependencyCountsById, taskId);
  const projectCollapsed = collapsedProjects[project.id] ?? false;
  const projectRowCount = projectCollapsed
    ? 1
    : project.subsystems.reduce((total, subsystem) => {
        const subsystemCollapsed = collapsedSubsystems[subsystem.id] ?? false;
        return total + (subsystemCollapsed ? 1 : Math.max(1, subsystem.tasks.length));
      }, 0);
  const collapsedSummarySpan = showSubsystemCol ? 1 : 0;
  const collapsedSummaryStart = subsystemColumnIndex;
  const collapsedSummaryStickyLeft = subsystemStickyLeft;
  const projectBackground = projectIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  const shouldRotateProjectLabel = !projectCollapsed && projectRowCount > 1;
  const projectLabelRotation = getTimelineMergedCellRotation(projectRowCount);
  const renderStatusIconCell = (
    task: TimelineProjectRow["tasks"][number],
    gridRow: string | number,
    compact = false,
  ) => (
    <TimelineTaskStatusCell
      clearHoveredMilestonePopup={clearHoveredMilestonePopup}
      clearHoveredTaskRow={clearHoveredTaskRow}
      compact={compact}
      gridRow={gridRow}
      hoverTaskRow={hoverTaskRow}
      key={`status-icon-${project.id}-${task.id}`}
      onOpenTask={openTaskDetailModal}
      ownerId={project.id}
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
        background: projectBackground,
        borderBottom: "1px solid var(--border-base)",
        position: "relative",
      }}
      data-row-motion={undefined}
      data-timeline-row={`project:${project.id}`}
    >
      {showProjectCol ? (
        <div
          className="timeline-merged-cell-column timeline-column-motion timeline-row-motion-item"
          data-timeline-column="project"
          style={{
            gridRow: `1 / span ${Math.max(1, projectRowCount)}`,
            gridColumn: "1",
            position: "sticky",
            left: 0,
            zIndex: 10022,
            background: projectBackground,
            borderRight: "1px solid var(--border-base)",
            display: "flex",
            flexDirection: projectCollapsed ? "row" : "column",
            justifyContent: projectCollapsed ? "flex-start" : "center",
            alignItems: "center",
            minHeight: "38px",
            padding: projectCollapsed ? "0 12px" : "8px 6px",
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          <button
            className="subsystem-toggle"
            aria-expanded={!projectCollapsed}
            aria-label={projectCollapsed ? "Expand project" : "Collapse project"}
            onClick={() => toggleProject(project.id)}
            title={projectCollapsed ? "Expand project" : "Collapse project"}
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              fontSize: "12px",
              color: "var(--text-copy)",
              marginRight: projectCollapsed ? "6px" : 0,
              position: projectCollapsed ? "static" : "absolute",
              top: projectCollapsed ? undefined : "4px",
              right: projectCollapsed ? undefined : "4px",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <TimelineCollapseArrow isCollapsed={projectCollapsed} />
          </button>
          <div
            className={`timeline-merged-cell-text${shouldRotateProjectLabel ? " is-rotated" : ""}`}
            style={
              shouldRotateProjectLabel
                ? ({
                    ["--timeline-merged-cell-rotation" as const]:
                      projectLabelRotation,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={project.name}>
              {project.name}
            </span>
            <span className="timeline-merged-cell-meta">
              {project.completeCount}/{project.taskCount}
            </span>
          </div>
        </div>
      ) : null}

      {projectCollapsed ? (
        <>
          {collapsedSummarySpan > 0 ? (
            <div
              className="timeline-merged-cell-column timeline-column-motion"
              style={{
                gridRow: "1",
                gridColumn: `${collapsedSummaryStart} / span ${collapsedSummarySpan}`,
                position: "sticky",
                left: `${collapsedSummaryStickyLeft}px`,
                zIndex: 10021,
                background: projectBackground,
                borderRight: "1px solid var(--border-base)",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "0 12px",
                paddingRight: "52px",
                minHeight: "38px",
                color: "var(--text-copy)",
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {project.subsystems.length} subsystems / {project.taskCount} tasks
            </div>
          ) : null}
          <TimelineGridDaySlots
            clearHoveredMilestonePopup={clearHoveredMilestonePopup}
            firstDayGridColumn={firstDayGridColumn}
            gridRow="1"
            handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
            rowKey={`project-${project.id}-collapsed`}
            timelineDayHeaderCells={timelineDayHeaderCells}
          />
          {project.tasks.map((task) => (
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
                dependencyPresentation="outline"
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
        </>
      ) : (
        (() => {
          let rowCursor = 1;
          return project.subsystems.map((subsystem) => {
            const canToggleSubsystem = subsystem.tasks.length > 1;
            const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
            const taskCount = Math.max(1, subsystem.tasks.length);
            const subsystemRowStart = rowCursor;
            const subsystemRowCount = collapsed ? 1 : taskCount;
            rowCursor += subsystemRowCount;
            const groupBackground =
              subsystem.index % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
            const isSubsystemSelected = selectedSubsystemId === subsystem.id;
            const isSubsystemHovered = hoveredSubsystemId === subsystem.id;
            const subsystemBandFill = isSubsystemHovered
              ? buildOpaqueSurfaceFill(groupBackground, subsystem.color)
              : isSubsystemSelected
                ? buildOpaqueSurfaceFill(groupBackground, subsystem.color)
                : null;
            const subsystemSurfaceBackground = subsystemBandFill
              ? subsystemBandFill
              : groupBackground;
            const subsystemSurfaceBorderRight = subsystemBandFill
              ? "1px solid transparent"
              : "1px solid var(--border-base)";
            const shouldRotateSubsystemLabel = !collapsed && taskCount > 1;
            const subsystemLabelRotation = getTimelineMergedCellRotation(taskCount);

            return (
              <React.Fragment key={subsystem.id}>
                <div
                  aria-hidden="true"
                  className="timeline-row-highlight-anchor"
                  data-timeline-row-anchor={`subsystem:${subsystem.id}`}
                  style={{
                    gridRow: `${subsystemRowStart} / span ${subsystemRowCount}`,
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
                    style={buildTimelineSubsystemHighlightStyle(subsystem.color, {
                      gridRow: collapsed ? `${subsystemRowStart}` : `${subsystemRowStart} / span ${taskCount}`,
                      gridColumn: `${subsystemColumnIndex}`,
                      position: "sticky",
                      left: `${subsystemStickyLeft}px`,
                      zIndex: 10021,
                      background: subsystemSurfaceBackground,
                      borderRight: subsystemSurfaceBorderRight,
                      boxShadow: `inset 3px 0 0 ${subsystem.color}`,
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
                      <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={subsystem.name}>
                        {subsystem.name}
                      </span>
                    </div>
                    {!collapsed ? (
                      <span className="timeline-subsystem-counter-corner">
                        {subsystem.completeCount}/{subsystem.taskCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {collapsed ? (
                  <TimelineGridDaySlots
                    clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                    firstDayGridColumn={firstDayGridColumn}
                    gridRow={`${subsystemRowStart}`}
                    handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                    includeTopBorder={subsystemRowStart > 1}
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
                            gridRow: `${subsystemRowStart}`,
                            gridColumn: `${firstDayGridColumn} / -1`,
                          }}
                        />
                        {renderStatusIconCell(task, subsystemRowStart, true)}
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
                          gridRow: `${subsystemRowStart}`,
                          gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                          height: "8px",
                          margin: "0 2px",
                          position: "relative",
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
                    gridRow={`${subsystemRowStart}`}
                    handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                    onRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
                    onRowMouseLeave={clearHoveredSubsystemRow}
                    includeTopBorder={subsystemRowStart > 1}
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
                            gridRow: subsystemRowStart + taskIndex,
                            gridColumn: `${firstDayGridColumn} / -1`,
                          }}
                        />
                        {renderStatusIconCell(task, subsystemRowStart + taskIndex, false)}
                        <TimelineGridDaySlots
                          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                          firstDayGridColumn={firstDayGridColumn}
                          gridRow={subsystemRowStart + taskIndex}
                          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                          onRowClick={() => selectTaskRow(task)}
                          includeTopBorder={subsystemRowStart + taskIndex > 1}
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
                            gridRow: subsystemRowStart + taskIndex,
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
              </React.Fragment>
            );
          });
        })()
      )}
    </div>
  );
};
