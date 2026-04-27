import React from "react";
import { IconEye } from "@/components/shared";
import { EditableHoverIndicator } from "@/features/workspace/shared";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { formatTaskAssignees } from "@/features/workspace/shared/timelineEventHelpers";
import type {
  TimelineDayHeaderCell,
  TimelineMonthGroup,
  TimelineProjectRow,
  TimelineSubsystemRow,
  TimelineSharedDayBackground,
} from "@/features/workspace/views/timelineViewModel";

type TimelineGridMotion = "left" | "right" | "neutral";

interface TimelineGridBodyProps {
  bootstrap: BootstrapPayload;
  timelineDays: string[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridTemplate: string;
  gridMinWidth: number;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  monthGroups: TimelineMonthGroup[];
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineSharedDayBackgrounds: TimelineSharedDayBackground[];
  projectRows: TimelineProjectRow[];
  subsystemRows: TimelineSubsystemRow[];
  hasProjectColumn: boolean;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  showTaskCol: boolean;
  projectColumnWidth: number;
  subsystemColumnWidth: number;
  taskColumnWidth: number;
  subsystemColumnIndex: number;
  taskLabelColumnIndex: number;
  firstDayGridColumn: number;
  subsystemStickyLeft: number;
  taskLabelStickyLeft: number;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  toggleProjectColumn: () => void;
  toggleSubsystemColumn: () => void;
  toggleTaskColumn: () => void;
  toggleProject: (id: string) => void;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  openEventModalForDay: (day: string) => void;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  clearHoveredMilestonePopup: () => void;
}

export const TimelineGridBody: React.FC<TimelineGridBodyProps> = ({
  bootstrap,
  timelineDays,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridTemplate,
  gridMinWidth,
  timelineShellRef,
  timelineGridRef,
  timelineDayCellRefs,
  monthGroups,
  timelineDayHeaderCells,
  timelineSharedDayBackgrounds,
  projectRows,
  subsystemRows,
  hasProjectColumn,
  showProjectCol,
  showSubsystemCol,
  showTaskCol,
  projectColumnWidth,
  subsystemColumnWidth,
  taskColumnWidth,
  subsystemColumnIndex,
  taskLabelColumnIndex,
  firstDayGridColumn,
  subsystemStickyLeft,
  taskLabelStickyLeft,
  collapsedProjects,
  collapsedSubsystems,
  membersById,
  toggleProjectColumn,
  toggleSubsystemColumn,
  toggleTaskColumn,
  toggleProject,
  toggleSubsystem,
  openTaskDetailModal,
  openEventModalForDay,
  handleTimelineDayMouseEnter,
  clearHoveredMilestonePopup,
}) => {
  const getDependencyCounts = (taskId: string) => {
    const dependencies = bootstrap.taskDependencies ?? [];
    let incoming = 0;
    let outgoing = 0;

    dependencies.forEach((dependency) => {
      if (dependency.downstreamTaskId === taskId) {
        incoming += 1;
      }
      if (dependency.upstreamTaskId === taskId) {
        outgoing += 1;
      }
    });

    return { incoming, outgoing };
  };

  const renderTimelineDayGridCells = (
    rowKey: string,
    gridRow: string | number,
    includeTopBorder = false,
  ) =>
    timelineDayHeaderCells.map((cell, dayIndex) => (
      <div
        aria-hidden="true"
        className="timeline-day-slot"
        data-popup-end-day={cell.primaryEventEndDay}
        data-popup-start-day={cell.primaryEventStartDay}
        data-timeline-day={cell.day}
        data-timeline-grid-cell="true"
        key={`${rowKey}-${cell.day}`}
        onMouseEnter={handleTimelineDayMouseEnter}
        onMouseLeave={clearHoveredMilestonePopup}
        style={{
          gridRow,
          gridColumn: dayIndex + firstDayGridColumn,
          borderRight: `1px solid ${cell.dayStyle?.columnBorder ?? "var(--border-base)"}`,
          borderTop: includeTopBorder ? "1px solid var(--border-base)" : "none",
          background: cell.dayStyle?.columnBackground,
          minHeight: "44px",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 0,
        }}
      />
    ));

  const timeline = { days: timelineDays };

  return timeline.days.length ? (
    <div
      className={`timeline-shell ${timelineFilterMotionClass}`}
      ref={timelineShellRef}
      style={{
        overflowX: "auto",
        padding: 0,
        background: "var(--bg-panel)",
        borderRadius: 0,
        border: "1px solid var(--border-base)",
        position: "relative",
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
          <span
            aria-hidden="true"
            className={`timeline-column-visibility-icon${showTaskCol ? " is-active" : ""}`}
          >
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
              title={
                cell.eventsOnDay.length ? `Edit milestone on ${cell.day}` : `Add milestone on ${cell.day}`
              }
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

      {timelineSharedDayBackgrounds.length > 0 ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            minWidth: `${gridMinWidth}px`,
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {timelineSharedDayBackgrounds.map((backgroundColumn) => (
            <div
              className="timeline-day-slot"
              key={`timeline-shared-day-background-${backgroundColumn.day}`}
              style={{
                position: "absolute",
                left: `${backgroundColumn.left}px`,
                top: 0,
                width: `${backgroundColumn.width}px`,
                height: "100%",
                borderRight: `1px solid ${backgroundColumn.style?.columnBorder ?? "var(--border-base)"}`,
                background: backgroundColumn.style?.columnBackground,
              }}
            />
          ))}
        </div>
      ) : null}

      {hasProjectColumn ? (
        projectRows.map((project, projectIndex) => {
          const projectCollapsed = collapsedProjects[project.id] ?? false;
          const projectRowCount = projectCollapsed
            ? 1
            : project.subsystems.reduce((total, subsystem) => {
                const subsystemCollapsed = collapsedSubsystems[subsystem.id] ?? false;
                return total + (subsystemCollapsed ? 1 : Math.max(1, subsystem.tasks.length));
              }, 0);
          const collapsedSummarySpan = (showSubsystemCol ? 1 : 0) + (showTaskCol ? 1 : 0);
          const collapsedSummaryStart = showSubsystemCol ? subsystemColumnIndex : taskLabelColumnIndex;
          const collapsedSummaryStickyLeft = showSubsystemCol ? subsystemStickyLeft : taskLabelStickyLeft;
          const projectBackground = projectIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

          return (
            <div
              className="subsystem-group"
              key={project.id}
              style={{
                display: "grid",
                width: "100%",
                minWidth: `${gridMinWidth}px`,
                gridTemplateColumns: timelineGridTemplate,
                background: projectBackground,
                borderBottom: "1px solid var(--border-base)",
                position: "relative",
              }}
              data-timeline-row={`project:${project.id}`}
              data-row-motion={undefined}
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
                    minHeight: "44px",
                    padding: projectCollapsed ? "0 12px" : "8px 6px",
                    overflow: projectCollapsed ? "hidden" : "visible",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    className="subsystem-toggle"
                    onClick={() => toggleProject(project.id)}
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
                      {projectCollapsed ? ">" : "v"}
                  </button>
                  <div className={`timeline-merged-cell-text${projectCollapsed ? "" : " is-rotated"}`}>
                    <span
                      className="timeline-merged-cell-title timeline-ellipsis-reveal"
                      data-full-text={project.name}
                    >
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
                        padding: "0 12px",
                        minHeight: "44px",
                        color: "var(--text-copy)",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {project.subsystems.length} subsystems
                    </div>
                  ) : null}
                  {renderTimelineDayGridCells(`project-${project.id}-collapsed`, "1")}
                  {project.tasks.map((task) => (
                    <button
                      key={task.id}
                      className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                      data-tutorial-target="timeline-task-bar"
                      onClick={() => openTaskDetailModal(task)}
                      onMouseEnter={clearHoveredMilestonePopup}
                      style={{
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
                      }}
                      title={`${task.title} (${task.status})`}
                      type="button"
                    >
                      {(() => {
                        const dependencyCounts = getDependencyCounts(task.id);
                        if (dependencyCounts.incoming === 0 && dependencyCounts.outgoing === 0) {
                          return null;
                        }

                        return (
                          <span
                            style={{
                              position: "absolute",
                              inset: 0,
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                              borderRadius: "inherit",
                              pointerEvents: "none",
                              opacity: 0.75,
                            }}
                            aria-hidden="true"
                          />
                        );
                      })()}
                      <EditableHoverIndicator className="editable-hover-indicator-compact" />
                    </button>
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

                    return (
                      <React.Fragment key={subsystem.id}>
                        {showSubsystemCol ? (
                          <div
                            className="timeline-merged-cell-column timeline-column-motion timeline-row-motion-item"
                            data-timeline-column="subsystem"
                            style={{
                              gridRow: collapsed ? `${subsystemRowStart}` : `${subsystemRowStart} / span ${taskCount}`,
                              gridColumn: `${subsystemColumnIndex}`,
                              position: "sticky",
                              left: `${subsystemStickyLeft}px`,
                              zIndex: 10021,
                              background: groupBackground,
                              borderRight: "1px solid var(--border-base)",
                              display: "flex",
                              flexDirection: collapsed ? "row" : "column",
                              justifyContent: collapsed ? "flex-start" : "center",
                              alignItems: "center",
                              minHeight: "44px",
                              padding: collapsed ? "0 12px" : "8px 6px",
                              overflow: collapsed ? "hidden" : "visible",
                              boxSizing: "border-box",
                            }}
                          >
                            {canToggleSubsystem ? (
                              <button
                                className="subsystem-toggle"
                                onClick={() => toggleSubsystem(subsystem.id)}
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
                                {collapsed ? ">" : "v"}
                              </button>
                            ) : null}
                            <div className={`timeline-merged-cell-text${collapsed ? "" : " is-rotated"}`}>
                              <span
                                className="timeline-merged-cell-title timeline-ellipsis-reveal"
                                data-full-text={subsystem.name}
                              >
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

                        {collapsed && showTaskCol ? (
                          <div
                            className="timeline-column-motion"
                            data-timeline-column="task"
                            style={{
                              gridRow: `${subsystemRowStart}`,
                              gridColumn: `${taskLabelColumnIndex}`,
                              position: "sticky",
                              left: `${taskLabelStickyLeft}px`,
                              zIndex: 10020,
                              background: groupBackground,
                              borderRight: "1px solid var(--border-base)",
                              boxSizing: "border-box",
                              minHeight: "44px",
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
                            className="timeline-column-motion timeline-row-motion-item"
                            data-timeline-column="task"
                            style={{
                              gridRow: `${subsystemRowStart} / span ${taskCount}`,
                              gridColumn: `${taskLabelColumnIndex}`,
                              position: "sticky",
                              left: `${taskLabelStickyLeft}px`,
                              zIndex: 10020,
                              background: groupBackground,
                              borderRight: "1px solid var(--border-base)",
                              boxSizing: "border-box",
                            }}
                          />
                        ) : null}

                        {collapsed
                          ? renderTimelineDayGridCells(
                              `subsystem-${subsystem.id}-collapsed`,
                              `${subsystemRowStart}`,
                              subsystemRowStart > 1,
                            )
                          : null}

                        {collapsed &&
                          subsystem.tasks.map((task) => (
                            <button
                              key={task.id}
                              className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                              data-tutorial-target="timeline-task-bar"
                              onClick={() => openTaskDetailModal(task)}
                              onMouseEnter={clearHoveredMilestonePopup}
                              style={{
                                gridRow: subsystemRowStart,
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
                              }}
                              title={`${task.title} (${task.status})`}
                              type="button"
                            >
                              <EditableHoverIndicator className="editable-hover-indicator-compact" />
                            </button>
                          ))}

                        {!collapsed && subsystem.tasks.length === 0
                          ? renderTimelineDayGridCells(
                              `subsystem-${subsystem.id}-empty`,
                              `${subsystemRowStart}`,
                              subsystemRowStart > 1,
                            )
                          : null}

                        {!collapsed
                          ? subsystem.tasks.map((task, taskIndex) => (
                              <React.Fragment key={task.id}>
                                {showTaskCol ? (
                                  <button
                                    className="task-label timeline-column-motion timeline-row-motion-item"
                                    data-tutorial-target="timeline-task-label"
                                    onClick={() => openTaskDetailModal(task)}
                                    style={{
                                      gridRow: subsystemRowStart + taskIndex,
                                      gridColumn: `${taskLabelColumnIndex}`,
                                      minHeight: "44px",
                                      padding: "0 12px",
                                      fontSize: "0.8rem",
                                      border: "none",
                                      borderRight: "1px solid var(--border-base)",
                                      boxSizing: "border-box",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "center",
                                      alignItems: "flex-start",
                                      position: "sticky",
                                      left: `${taskLabelStickyLeft}px`,
                                      zIndex: 10020,
                                      background: groupBackground,
                                      overflow: "visible",
                                      borderTop: taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                                      borderRadius: 0,
                                      textAlign: "left",
                                      cursor: "pointer",
                                    }}
                                    type="button"
                                  >
                                    <strong
                                      className="timeline-task-label-title timeline-ellipsis-reveal"
                                      data-full-text={task.title}
                                      style={{
                                        display: "block",
                                        color: "var(--text-title)",
                                        lineHeight: "1.2",
                                      }}
                                    >
                                      {task.title}
                                    </strong>
                                    <span
                                      className="timeline-task-label-owner timeline-ellipsis-reveal"
                                      data-full-text={formatTaskAssignees(task, membersById)}
                                      style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}
                                    >
                                      {formatTaskAssignees(task, membersById)}
                                    </span>
                                    {(() => {
                                      const dependencyCounts = getDependencyCounts(task.id);
                                      if (
                                        dependencyCounts.incoming === 0 &&
                                        dependencyCounts.outgoing === 0
                                      ) {
                                        return null;
                                      }

                                      return (
                                        <span
                                          style={{
                                            fontSize: "0.65rem",
                                            color: "var(--meco-blue)",
                                            marginTop: "0.2rem",
                                          }}
                                        >
                                          {dependencyCounts.incoming > 0
                                            ? `Depends on ${dependencyCounts.incoming}`
                                            : ""}
                                          {dependencyCounts.incoming > 0 &&
                                          dependencyCounts.outgoing > 0
                                            ? " · "
                                            : ""}
                                          {dependencyCounts.outgoing > 0
                                            ? `Blocks ${dependencyCounts.outgoing}`
                                            : ""}
                                        </span>
                                      );
                                    })()}
                                  </button>
                                ) : null}
                                {renderTimelineDayGridCells(
                                  `subsystem-${subsystem.id}-task-${task.id}`,
                                  subsystemRowStart + taskIndex,
                                  subsystemRowStart + taskIndex > 1,
                                )}
                                <button
                                  className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                                  data-tutorial-target="timeline-task-bar"
                                  onClick={() => openTaskDetailModal(task)}
                                  onMouseEnter={clearHoveredMilestonePopup}
                                  style={{
                                    gridRow: subsystemRowStart + taskIndex,
                                    gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                                    margin: "6px 4px",
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
                                  }}
                                  title={`View details for ${task.title}`}
                                  type="button"
                                >
                                  {task.title}
                                  {(() => {
                                    const dependencyCounts = getDependencyCounts(task.id);
                                    if (
                                      dependencyCounts.incoming === 0 &&
                                      dependencyCounts.outgoing === 0
                                    ) {
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
                                        {dependencyCounts.incoming > 0 &&
                                        dependencyCounts.outgoing > 0
                                          ? " "
                                          : ""}
                                        {dependencyCounts.outgoing > 0 ? `↗ ${dependencyCounts.outgoing}` : ""}
                                      </span>
                                    );
                                  })()}
                                  <EditableHoverIndicator className="editable-hover-indicator-compact" />
                                </button>
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
        })
      ) : subsystemRows.length > 0 ? (
        subsystemRows.map((subsystem, subsystemIndex) => {
          const canToggleSubsystem = subsystem.tasks.length > 1;
          const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
          const taskCount = Math.max(1, subsystem.tasks.length);
          const groupBackground =
            subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

          return (
            <div
              className="subsystem-group"
              key={subsystem.id}
              style={{
                display: "grid",
                width: "100%",
                minWidth: `${gridMinWidth}px`,
                gridTemplateColumns: timelineGridTemplate,
                background: groupBackground,
                borderBottom: "1px solid var(--border-base)",
                position: "relative",
              }}
            >
              {showSubsystemCol ? (
                <div
                  className="timeline-merged-cell-column timeline-column-motion timeline-row-motion-item"
                  data-timeline-column="subsystem"
                  style={{
                    gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
                    gridColumn: `${subsystemColumnIndex}`,
                    position: "sticky",
                    left: `${subsystemStickyLeft}px`,
                    zIndex: 10021,
                    background: groupBackground,
                    borderRight: "1px solid var(--border-base)",
                    display: "flex",
                    flexDirection: collapsed ? "row" : "column",
                    justifyContent: collapsed ? "flex-start" : "center",
                    alignItems: "center",
                    minHeight: "44px",
                    padding: collapsed ? "0 12px" : "8px 6px",
                    overflow: collapsed ? "hidden" : "visible",
                    boxSizing: "border-box",
                  }}
                >
                  {canToggleSubsystem ? (
                    <button
                      className="subsystem-toggle"
                      onClick={() => toggleSubsystem(subsystem.id)}
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
                      {collapsed ? ">" : "v"}
                    </button>
                  ) : null}
                  <div className={`timeline-merged-cell-text${collapsed ? "" : " is-rotated"}`}>
                    <span
                      className="timeline-merged-cell-title timeline-ellipsis-reveal"
                      data-full-text={subsystem.name}
                    >
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

              {showProjectCol ? (
                <div
                  className="timeline-merged-cell-column timeline-column-motion"
                  data-timeline-column="project"
                  style={{
                    gridRow: `1 / span ${taskCount}`,
                    gridColumn: "1",
                    minHeight: "44px",
                    padding: "10px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-title)",
                    borderRight: "1px solid var(--border-base)",
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
                  <span
                    className="timeline-merged-cell-title timeline-ellipsis-reveal"
                    data-full-text={subsystem.projectName}
                  >
                    {subsystem.projectName}
                  </span>
                </div>
              ) : null}

              {collapsed && showTaskCol ? (
                <div
                  className="timeline-column-motion"
                  data-timeline-column="task"
                  style={{
                    gridRow: "1",
                    gridColumn: `${taskLabelColumnIndex}`,
                    position: "sticky",
                    left: `${taskLabelStickyLeft}px`,
                    zIndex: 10020,
                    background: groupBackground,
                    borderRight: "1px solid var(--border-base)",
                    boxSizing: "border-box",
                    minHeight: "44px",
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
                  className="timeline-column-motion timeline-row-motion-item"
                  data-timeline-column="task"
                  style={{
                    gridRow: `1 / span ${taskCount}`,
                    gridColumn: `${taskLabelColumnIndex}`,
                    position: "sticky",
                    left: `${taskLabelStickyLeft}px`,
                    zIndex: 10020,
                    background: groupBackground,
                    borderRight: "1px solid var(--border-base)",
                    boxSizing: "border-box",
                  }}
                />
              ) : null}

              {collapsed ? renderTimelineDayGridCells(`subsystem-${subsystem.id}-collapsed`, "1") : null}

              {collapsed &&
                subsystem.tasks.map((task) => (
                  <button
                    key={task.id}
                    className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                    data-tutorial-target="timeline-task-bar"
                    onClick={() => openTaskDetailModal(task)}
                    onMouseEnter={clearHoveredMilestonePopup}
                    style={{
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
                    }}
                    title={`${task.title} (${task.status})`}
                    type="button"
                  >
                    <EditableHoverIndicator className="editable-hover-indicator-compact" />
                  </button>
                ))}

              {!collapsed && subsystem.tasks.length === 0
                ? renderTimelineDayGridCells(`subsystem-${subsystem.id}-empty`, "1")
                : null}

              {!collapsed
                ? subsystem.tasks.map((task, taskIndex) => (
                    <React.Fragment key={task.id}>
                      {showTaskCol ? (
                        <button
                          className="task-label timeline-column-motion timeline-row-motion-item"
                          data-tutorial-target="timeline-task-label"
                          onClick={() => openTaskDetailModal(task)}
                          style={{
                            gridRow: taskIndex + 1,
                            gridColumn: `${taskLabelColumnIndex}`,
                            minHeight: "44px",
                            padding: "0 12px",
                            fontSize: "0.8rem",
                            border: "none",
                            borderRight: "1px solid var(--border-base)",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            position: "sticky",
                            left: `${taskLabelStickyLeft}px`,
                            zIndex: 10020,
                            background: groupBackground,
                            overflow: "visible",
                            borderTop: taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                            borderRadius: 0,
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                          type="button"
                        >
                          <strong
                            className="timeline-task-label-title timeline-ellipsis-reveal"
                            data-full-text={task.title}
                            style={{
                              display: "block",
                              color: "var(--text-title)",
                              lineHeight: "1.2",
                            }}
                          >
                            {task.title}
                          </strong>
                          <span
                            className="timeline-task-label-owner timeline-ellipsis-reveal"
                            data-full-text={formatTaskAssignees(task, membersById)}
                            style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}
                          >
                            {formatTaskAssignees(task, membersById)}
                          </span>
                        </button>
                      ) : null}
                      {renderTimelineDayGridCells(
                        `subsystem-${subsystem.id}-task-${task.id}`,
                        taskIndex + 1,
                        taskIndex > 0,
                      )}
                      <button
                        className={`timeline-bar timeline-${task.status} editable-hover-target timeline-row-motion-item`}
                        data-tutorial-target="timeline-task-bar"
                        onClick={() => openTaskDetailModal(task)}
                        onMouseEnter={clearHoveredMilestonePopup}
                        style={{
                          gridRow: taskIndex + 1,
                          gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                          margin: "6px 4px",
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
                        }}
                        title={`View details for ${task.title}`}
                        type="button"
                      >
                        {task.title}
                        <EditableHoverIndicator className="editable-hover-indicator-compact" />
                      </button>
                    </React.Fragment>
                  ))
                : null}
            </div>
          );
        })
      ) : (
        <p className="section-copy">
          Add a milestone or create a task to populate the subsystem timeline.
        </p>
      )}
    </div>
  ) : (
    <p className="section-copy">Add a milestone or create a task to populate the subsystem timeline.</p>
  );
};
