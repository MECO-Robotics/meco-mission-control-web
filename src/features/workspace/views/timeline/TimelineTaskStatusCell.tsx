import React from "react";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTimelineTaskStatusLabel, TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "./timelineGridBodyUtils";

interface TimelineTaskStatusCellProps {
  clearHoveredMilestonePopup: () => void;
  clearHoveredTaskRow: () => void;
  compact?: boolean;
  isHighlighted?: boolean;
  gridRow: string | number;
  hoverTaskRow: (id: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  task: TaskRecord;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  ownerId: string;
}

export const TimelineTaskStatusCell: React.FC<TimelineTaskStatusCellProps> = ({
  clearHoveredMilestonePopup,
  clearHoveredTaskRow,
  compact = false,
  isHighlighted = false,
  gridRow,
  hoverTaskRow,
  onOpenTask,
  ownerId,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
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
        minWidth: `${statusIconColumnWidth}px`,
        maxWidth: `${statusIconColumnWidth}px`,
        justifySelf: "end",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "visible",
        boxSizing: "border-box",
        position: "sticky",
        right: `${statusIconStickyRight}px`,
        zIndex: 10020,
      }}
    >
      <button
        aria-label={`Open task ${task.title}`}
        className={`timeline-task-status-icon-button${compact ? " is-compact" : ""}${isHighlighted ? " is-row-highlighted" : ""}`}
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
