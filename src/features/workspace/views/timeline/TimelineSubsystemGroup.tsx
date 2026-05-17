import React from "react";
import { buildTimelineSubsystemHighlightStyle } from "./model/timelineTaskColors";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type {
  TimelineDayHeaderCell,
  TimelineSubsystemRow,
} from "./timelineViewModel";
import type {
  TimelineTaskDependencyCounts,
  TimelineTaskStatusSignal,
} from "./timelineGridBodyUtils";
import { TimelineSubsystemRowGroup } from "./components/TimelineSubsystemRowGroup";

interface TimelineSubsystemGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  clearHoveredMilestonePopup: () => void;
  collapsedSubsystems: Record<string, boolean>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  hoveredTaskId?: string | null;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  selectedTaskId?: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemIndex: number;
  subsystemStickyLeft: number;
  rowIndex: number;
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
  hoveredTaskId,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
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
  taskDependencyCountsById,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const groupBackground = subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  const accentColor = subsystem.color;
  const groupStyle = buildTimelineSubsystemHighlightStyle(accentColor, {
    boxShadow: `inset 3px 0 0 ${accentColor}`,
    gridAutoRows: "38px",
  });

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
      data-row-motion={undefined}
      data-timeline-row={`subsystem:${subsystem.id}`}
    >
      <TimelineSubsystemRowGroup
        clearHoveredMilestonePopup={clearHoveredMilestonePopup}
        clearHoveredSubsystemRow={clearHoveredSubsystemRow}
        clearHoveredTaskRow={clearHoveredTaskRow}
        collapsedSubsystems={collapsedSubsystems}
        disciplinesById={disciplinesById}
        firstDayGridColumn={firstDayGridColumn}
        handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
        hoveredSubsystemId={hoveredSubsystemId}
        hoveredTaskId={hoveredTaskId}
        hoverSubsystemRow={hoverSubsystemRow}
        hoverTaskRow={hoverTaskRow}
        openTaskDetailModal={openTaskDetailModal}
        rowBackground={groupBackground}
        rowIndex={rowIndex}
        rowStyle={groupStyle}
        gridAutoRows="38px"
        selectSubsystemRow={selectSubsystemRow}
        selectTaskRow={selectTaskRow}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
        showSubsystemCol={showSubsystemCol}
        statusIconColumnIndex={statusIconColumnIndex}
        statusIconColumnWidth={statusIconColumnWidth}
        statusIconStickyRight={statusIconStickyRight}
        subsystem={subsystem}
        subsystemColumnIndex={subsystemColumnIndex}
        subsystemStickyLeft={subsystemStickyLeft}
        taskDependencyCountsById={taskDependencyCountsById}
        taskStatusSignalsById={taskStatusSignalsById}
        timelineDayHeaderCells={timelineDayHeaderCells}
        toggleSubsystem={toggleSubsystem}
      />
    </div>
  );
};
