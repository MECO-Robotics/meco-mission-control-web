import type { TimelineTaskPresentation } from "./model/timelineTaskPresentation";
import React from "react";
import { buildTimelineSubsystemHighlightStyle } from "./model/timelineTaskColors";
import type { TaskRecord } from "@/types/recordsExecution";
import type {
  TimelineDayHeaderCell,
  TimelineSubsystemRow,
} from "./timelineViewModel";

import { TimelineSubsystemRowGroup } from "./components/TimelineSubsystemRowGroup";

interface TimelineSubsystemGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  collapsedSubsystems: Record<string, boolean>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  hoveredSubsystemId: string | null;
  hoveredTaskId?: string | null;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  selectedTaskId?: string | null;
  showSubsystemCol: boolean;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemIndex: number;
  subsystemStickyLeft: number;
  rowIndex: number;
  taskPresentationsById: Record<string, TimelineTaskPresentation>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineGridTemplate: string;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
}

export const TimelineSubsystemGroup: React.FC<TimelineSubsystemGroupProps> = ({
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  collapsedSubsystems,
  firstDayGridColumn,
  gridMinWidth,
  hoveredSubsystemId,
  hoveredTaskId,
  taskColumnIndex,
  taskColumnWidth,
  taskStickyLeft,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  selectTaskRow,
  selectedSubsystemId,
  selectedTaskId,
  showSubsystemCol,
  subsystem,
  subsystemColumnIndex,
  subsystemIndex,
  subsystemStickyLeft,
  rowIndex,
  taskPresentationsById,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const groupBackground = subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  const accentColor = subsystem.color;
  const groupStyle = buildTimelineSubsystemHighlightStyle(accentColor, {
    boxShadow: `inset 1px 0 0 ${accentColor}`,
    gridAutoRows: "var(--timeline-row-height, 58px)",
  });

  return (
    <div
      className="subsystem-group"
      style={{
        display: "grid",
        width: "100%",
        minWidth: `${gridMinWidth}px`,
        gridTemplateColumns: timelineGridTemplate,
        gridAutoRows: "var(--timeline-row-height, 58px)",
        background: groupBackground,
        borderBottom: "1px solid var(--border-base)",
        position: "relative",
      }}
      data-row-motion={undefined}
      data-timeline-row={`subsystem:${subsystem.id}`}
    >
      <TimelineSubsystemRowGroup
        clearHoveredSubsystemRow={clearHoveredSubsystemRow}
        clearHoveredTaskRow={clearHoveredTaskRow}
        collapsedSubsystems={collapsedSubsystems}
        firstDayGridColumn={firstDayGridColumn}
        hoveredSubsystemId={hoveredSubsystemId}
        hoveredTaskId={hoveredTaskId}
        hoverSubsystemRow={hoverSubsystemRow}
        hoverTaskRow={hoverTaskRow}
        openTaskDetailModal={openTaskDetailModal}
        rowBackground={groupBackground}
        rowIndex={rowIndex}
        rowStyle={groupStyle}
        gridAutoRows="var(--timeline-row-height, 58px)"
        selectSubsystemRow={selectSubsystemRow}
        selectTaskRow={selectTaskRow}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
        showSubsystemCol={showSubsystemCol}
        taskColumnIndex={taskColumnIndex}
        taskColumnWidth={taskColumnWidth}
        taskStickyLeft={taskStickyLeft}
        subsystem={subsystem}
        subsystemColumnIndex={subsystemColumnIndex}
        subsystemStickyLeft={subsystemStickyLeft}
        taskPresentationsById={taskPresentationsById}
        timelineDayHeaderCells={timelineDayHeaderCells}
        toggleSubsystem={toggleSubsystem}
      />
    </div>
  );
};
