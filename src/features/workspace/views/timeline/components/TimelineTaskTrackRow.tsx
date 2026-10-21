import type { TimelineTaskPresentation } from "../model/timelineTaskPresentation";
import React from "react";
import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineGridDaySlots } from "../TimelineGridDaySlots";
import { TimelineTaskBar } from "../TimelineTaskBar";
import { TimelineTaskNameCell } from "../TimelineTaskNameCell";
import type {
  TimelineDayHeaderCell,
  TimelineTaskSpan,
} from "../timelineViewModel";

interface TimelineTaskTrackRowProps {
  clearHoveredTaskRow: () => void;
  firstDayGridColumn: number;
  hoveredTaskId?: string | null;
  hoverTaskRow: (id: string) => void;
  onOpenTask: (task: TaskRecord) => void;
  onRowClick?: () => void;
  onRowMouseEnter?: () => void;
  onRowMouseLeave?: () => void;
  rowKey: string;
  selectedTaskId?: string | null;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  task: TimelineTaskSpan;
  taskBarStyle: React.CSSProperties;
  presentation: TimelineTaskPresentation;
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
  clearHoveredTaskRow,
  firstDayGridColumn,
  hoveredTaskId,
  hoverTaskRow,
  onOpenTask,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  rowKey,
  selectedTaskId,
  taskColumnIndex,
  taskColumnWidth,
  taskStickyLeft,
  task,
  taskBarStyle,
  presentation,
  timelineDayHeaderCells,
  compact = false,
  gridRow,
  includeTopBorder = false,
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
      <TimelineTaskNameCell task={task} presentation={presentation} gridRow={gridRow}
        taskColumnIndex={taskColumnIndex} taskColumnWidth={taskColumnWidth} taskStickyLeft={taskStickyLeft}
        isHighlighted={isHighlighted} onOpenTask={onOpenTask}
        onMouseEnter={() => hoverTaskRow(task.id)} onMouseLeave={clearHoveredTaskRow} />
      {showDaySlots ? (
        <TimelineGridDaySlots
          firstDayGridColumn={firstDayGridColumn}
          gridRow={gridRow}
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
        description={presentation.description}
        signal={presentation.signal}
        onMouseEnter={() => {
          hoverTaskRow(task.id);
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
