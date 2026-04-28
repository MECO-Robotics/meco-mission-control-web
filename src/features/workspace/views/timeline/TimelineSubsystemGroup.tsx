import React from "react";
import { EditableHoverIndicator } from "@/features/workspace/shared";
import { formatTaskAssignees } from "@/features/workspace/shared/timelineEventHelpers";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { TimelineCollapseArrow } from "./TimelineCollapseArrow";
import { TimelineGridDaySlots } from "./TimelineGridDaySlots";
import { getTaskDependencyCounts } from "./timelineGridBodyUtils";
import type {
  TimelineDayHeaderCell,
  TimelineSubsystemRow,
} from "./timelineViewModel";

interface TimelineSubsystemGroupProps {
  bootstrap: BootstrapPayload;
  clearHoveredMilestonePopup: () => void;
  collapsedSubsystems: Record<string, boolean>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  membersById: Record<string, BootstrapPayload["members"][number]>;
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
  clearHoveredMilestonePopup,
  collapsedSubsystems,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  membersById,
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

  return (
    <div
      className="subsystem-group"
      style={{
        display: "grid",
        width: "100%",
        minWidth: `${gridMinWidth}px`,
        gridTemplateColumns: timelineGridTemplate,
        background: groupBackground,
        borderBottom: "1px solid var(--border-base)",
        position: "relative",
      }}
      key={subsystem.id}
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
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand subsystem" : "Collapse subsystem"}
              onClick={() => toggleSubsystem(subsystem.id)}
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
          <div className={`timeline-merged-cell-text${collapsed ? "" : " is-rotated"}`}>
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
          <span className="timeline-merged-cell-title timeline-ellipsis-reveal" data-full-text={subsystem.projectName}>
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

      {collapsed ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow="1"
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          rowKey={`subsystem-${subsystem.id}-collapsed`}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

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

      {!collapsed && subsystem.tasks.length === 0 ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow="1"
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          rowKey={`subsystem-${subsystem.id}-empty`}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

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
                  {(() => {
                    const dependencyCounts = getTaskDependencyCounts(task.id, bootstrap.taskDependencies);
                    if (dependencyCounts.incoming === 0 && dependencyCounts.outgoing === 0) {
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
                        {dependencyCounts.incoming > 0 ? `Depends on ${dependencyCounts.incoming}` : ""}
                        {dependencyCounts.incoming > 0 && dependencyCounts.outgoing > 0 ? " · " : ""}
                        {dependencyCounts.outgoing > 0 ? `Blocks ${dependencyCounts.outgoing}` : ""}
                      </span>
                    );
                  })()}
                </button>
              ) : null}
              <TimelineGridDaySlots
                clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                firstDayGridColumn={firstDayGridColumn}
                gridRow={taskIndex + 1}
                handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                includeTopBorder={taskIndex > 0}
                rowKey={`subsystem-${subsystem.id}-task-${task.id}`}
                timelineDayHeaderCells={timelineDayHeaderCells}
              />
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
