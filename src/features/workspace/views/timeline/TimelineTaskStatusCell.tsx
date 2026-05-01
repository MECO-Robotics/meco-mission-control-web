import React from "react";
import type { TaskRecord } from "@/types";
import { getTimelineTaskStatusLabel, TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "./timelineGridBodyUtils";

interface TimelineTaskStatusCellProps {
  clearHoveredMilestonePopup: () => void;
  clearHoveredTaskRow: () => void;
  compact?: boolean;
  gridRow: string | number;
  hoverTaskRow: (id: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyLeft: number;
  task: TaskRecord;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  ownerId: string;
}

export const TimelineTaskStatusCell: React.FC<TimelineTaskStatusCellProps> = ({
  clearHoveredMilestonePopup,
  clearHoveredTaskRow,
  compact = false,
  gridRow,
  hoverTaskRow,
  onOpenTask,
  ownerId,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyLeft,
  task,
  taskStatusSignalsById,
}) => {
  const signal = taskStatusSignalsById[task.id] ?? task.status;

  return (
    <div
      className="timeline-task-status-column"
      key={`status-icon-${ownerId}-${task.id}`}
      style={{
        gridRow: `${gridRow}`,
        gridColumn: `${statusIconColumnIndex}`,
        minHeight: "38px",
        width: `${statusIconColumnWidth}px`,
        padding: "0 6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        position: "sticky",
        left: `${statusIconStickyLeft}px`,
        zIndex: 10020,
      }}
    >
      <button
        aria-label={`Open task ${task.title}`}
        className={`timeline-task-status-icon-button${compact ? " is-compact" : ""}`}
        data-status-signal={signal}
        onClick={() => onOpenTask(task)}
        onMouseEnter={() => {
          hoverTaskRow(task.id);
          clearHoveredMilestonePopup();
        }}
        onMouseLeave={clearHoveredTaskRow}
        type="button"
        style={{
          position: "relative",
          border: "none",
          background: "none",
          padding: 0,
          overflow: "visible",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <span className="timeline-task-status-caption">
          {getTimelineTaskStatusLabel(signal)}
        </span>
        <TimelineTaskStatusLogo compact={compact} signal={signal} status={task.status} />
      </button>
    </div>
  );
};
