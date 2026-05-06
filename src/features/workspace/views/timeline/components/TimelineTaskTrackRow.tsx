import React from "react";
import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineGridDaySlots } from "../TimelineGridDaySlots";
import { TimelineTaskBar } from "../TimelineTaskBar";
import { TimelineTaskStatusCell } from "../TimelineTaskStatusCell";
import type {
  TimelineDayHeaderCell,
  TimelineTaskSpan,
} from "../timelineViewModel";
import type {
  TimelineTaskDependencyCounts,
  TimelineTaskStatusSignal,
} from "../timelineGridBodyUtils";

interface TimelineTaskTrackRowProps {
  clearHoveredMilestonePopup: () => void;
  clearHoveredTaskRow: () => void;
  firstDayGridColumn: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  hoveredTaskId?: string | null;
  hoverTaskRow: (id: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  onRowClick?: () => void;
  onRowMouseEnter?: () => void;
  onRowMouseLeave?: () => void;
  rowKey: string;
  selectedTaskId?: string | null;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  task: TimelineTaskSpan;
  taskBarStyle: React.CSSProperties;
  taskDependencyCounts: TimelineTaskDependencyCounts;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  compact?: boolean;
  gridRow: string | number;
  includeTopBorder?: boolean;
  ownerId: string;
  title: string;
  spillsLeft?: boolean;
  spillsRight?: boolean;
  showDaySlots?: boolean;
}

export const TimelineTaskTrackRow: React.FC<TimelineTaskTrackRowProps> = ({
  clearHoveredMilestonePopup,
  clearHoveredTaskRow,
  firstDayGridColumn,
  handleTimelineDayMouseEnter,
  hoveredTaskId,
  hoverTaskRow,
  onOpenTask,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  rowKey,
  selectedTaskId,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
  task,
  taskBarStyle,
  taskDependencyCounts,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  compact = false,
  gridRow,
  includeTopBorder = false,
  ownerId,
  title,
  spillsLeft = false,
  spillsRight = false,
  showDaySlots = true,
}) => {
  const isHighlighted = hoveredTaskId === task.id || selectedTaskId === task.id;

  return (
    <>
      <div
        aria-hidden="true"
        className="timeline-row-highlight-anchor"
        data-timeline-row-anchor={`task:${task.id}`}
        style={{
          gridRow,
          gridColumn: `${firstDayGridColumn} / -1`,
        }}
      />
      <TimelineTaskStatusCell
        clearHoveredMilestonePopup={clearHoveredMilestonePopup}
        clearHoveredTaskRow={clearHoveredTaskRow}
        compact={compact}
        gridRow={gridRow}
        hoverTaskRow={hoverTaskRow}
        isHighlighted={isHighlighted}
        key={`status-icon-${ownerId}-${task.id}`}
        onOpenTask={onOpenTask}
        ownerId={ownerId}
        statusIconColumnIndex={statusIconColumnIndex}
        statusIconColumnWidth={statusIconColumnWidth}
        statusIconStickyRight={statusIconStickyRight}
        task={task}
        taskStatusSignalsById={taskStatusSignalsById}
      />
      {showDaySlots ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow={gridRow}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          includeTopBorder={includeTopBorder}
          onRowClick={onRowClick}
          onRowMouseEnter={onRowMouseEnter}
          onRowMouseLeave={onRowMouseLeave}
          rowKey={rowKey}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}
      <TimelineTaskBar
        compact={compact}
        dependencyCounts={taskDependencyCounts}
        onMouseEnter={() => {
          hoverTaskRow(task.id);
          clearHoveredMilestonePopup();
        }}
        onMouseLeave={clearHoveredTaskRow}
        onOpenTask={onOpenTask}
        spillsLeft={spillsLeft}
        spillsRight={spillsRight}
        style={taskBarStyle}
        task={task}
        title={title}
      />
    </>
  );
};
