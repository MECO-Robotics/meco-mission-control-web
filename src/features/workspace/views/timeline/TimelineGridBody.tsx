import React from "react";
import type { BootstrapPayload, TaskRecord } from "@/types";
import type {
  TimelineDayHeaderCell,
  TimelineMonthGroup,
  TimelineProjectRow,
  TimelineSubsystemRow,
} from "./timelineViewModel";
import { TimelineGridHeader } from "./TimelineGridHeader";
import { TimelineProjectGroup } from "./TimelineProjectGroup";
import { TimelineSubsystemGroup } from "./TimelineSubsystemGroup";
import {
  buildTaskDependencyCountsByTaskId,
  buildTimelineTaskStatusSignalByTaskId,
} from "./timelineGridBodyUtils";

type TimelineGridMotion = "left" | "right" | "neutral";

interface TimelineGridBodyProps {
  bootstrap: BootstrapPayload;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  clearHoveredMilestonePopup: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  handleTimelineZoomWheel: (milestone: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
  isScrolling: boolean;
  isWeekView: boolean;
  monthGroups: TimelineMonthGroup[];
  handleTimelineHeaderDayClick: (day: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  projectColumnWidth: number;
  projectRows: TimelineProjectRow[];
  hoveredSubsystemId: string | null;
  hoveredTaskId: string | null;
  selectedSubsystemId: string | null;
  selectedTaskId: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemRows: TimelineSubsystemRow[];
  subsystemStickyLeft: number;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridTemplate: string;
  timelineZoom: number;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  toggleProject: (id: string) => void;
  toggleProjectColumn: () => void;
  toggleSubsystem: (id: string) => void;
  toggleSubsystemColumn: () => void;
}

export const TimelineGridBody: React.FC<TimelineGridBodyProps> = ({
  bootstrap,
  collapsedProjects,
  collapsedSubsystems,
  clearHoveredMilestonePopup,
  disciplinesById,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  handleTimelineZoomWheel,
  hasProjectColumn,
  isScrolling,
  isWeekView,
  monthGroups,
  handleTimelineHeaderDayClick,
  openTaskDetailModal,
  projectColumnWidth,
  projectRows,
  hoveredSubsystemId,
  hoveredTaskId,
  selectedSubsystemId,
  selectedTaskId,
  showProjectCol,
  showSubsystemCol,
  subsystemColumnIndex,
  subsystemColumnWidth,
  subsystemRows,
  subsystemStickyLeft,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
  timelineDayCellRefs,
  timelineDayHeaderCells,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridRef,
  timelineGridTemplate,
  timelineZoom,
  timelineShellRef,
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  selectTaskRow,
  toggleProject,
  toggleProjectColumn,
  toggleSubsystem,
  toggleSubsystemColumn,
}) => {
  const taskDependencyCountsById = React.useMemo(
    () => buildTaskDependencyCountsByTaskId(bootstrap.taskDependencies),
    [bootstrap.taskDependencies],
  );
  const taskStatusSignalsById = React.useMemo(
    () => buildTimelineTaskStatusSignalByTaskId(bootstrap),
    [bootstrap],
  );

  let nextSubsystemRowIndex = 1;
  const rowChildren = hasProjectColumn
    ? projectRows.map((project, projectIndex) => (
        <TimelineProjectGroup
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          collapsedProjects={collapsedProjects}
          collapsedSubsystems={collapsedSubsystems}
          disciplinesById={disciplinesById}
          firstDayGridColumn={firstDayGridColumn}
          gridMinWidth={gridMinWidth}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          key={project.id}
          openTaskDetailModal={openTaskDetailModal}
          project={project}
          projectIndex={projectIndex}
          hoveredSubsystemId={hoveredSubsystemId}
          hoveredTaskId={hoveredTaskId}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
      statusIconColumnIndex={statusIconColumnIndex}
      statusIconColumnWidth={statusIconColumnWidth}
      statusIconStickyRight={statusIconStickyRight}
          clearHoveredSubsystemRow={clearHoveredSubsystemRow}
          clearHoveredTaskRow={clearHoveredTaskRow}
          hoverTaskRow={hoverTaskRow}
          hoverSubsystemRow={hoverSubsystemRow}
          selectSubsystemRow={selectSubsystemRow}
          selectTaskRow={selectTaskRow}
          showProjectCol={showProjectCol}
          showSubsystemCol={showSubsystemCol}
          isWeekView={isWeekView}
          subsystemColumnIndex={subsystemColumnIndex}
          subsystemStickyLeft={subsystemStickyLeft}
          taskDependencyCountsById={taskDependencyCountsById}
          taskStatusSignalsById={taskStatusSignalsById}
          timelineDayHeaderCells={timelineDayHeaderCells}
          timelineGridTemplate={timelineGridTemplate}
          toggleProject={toggleProject}
          toggleSubsystem={toggleSubsystem}
        />
      ))
    : subsystemRows.map((subsystem, subsystemIndex) => {
        const canToggleSubsystem = subsystem.tasks.length > 1;
        const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
        const rowIndex = nextSubsystemRowIndex;
        nextSubsystemRowIndex += collapsed ? 1 : Math.max(1, subsystem.tasks.length);

        return (
          <TimelineSubsystemGroup
            clearHoveredMilestonePopup={clearHoveredMilestonePopup}
            collapsedSubsystems={collapsedSubsystems}
            disciplinesById={disciplinesById}
            firstDayGridColumn={firstDayGridColumn}
            gridMinWidth={gridMinWidth}
            handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
            key={subsystem.id}
            openTaskDetailModal={openTaskDetailModal}
            hoveredSubsystemId={hoveredSubsystemId}
            hoveredTaskId={hoveredTaskId}
            selectedSubsystemId={selectedSubsystemId}
            selectedTaskId={selectedTaskId}
            clearHoveredSubsystemRow={clearHoveredSubsystemRow}
            clearHoveredTaskRow={clearHoveredTaskRow}
            hoverTaskRow={hoverTaskRow}
            hoverSubsystemRow={hoverSubsystemRow}
            selectSubsystemRow={selectSubsystemRow}
            selectTaskRow={selectTaskRow}
            showProjectCol={showProjectCol}
            showSubsystemCol={showSubsystemCol}
            subsystem={subsystem}
            subsystemColumnIndex={subsystemColumnIndex}
            subsystemIndex={subsystemIndex}
            subsystemStickyLeft={subsystemStickyLeft}
            rowIndex={rowIndex}
            statusIconColumnIndex={statusIconColumnIndex}
            statusIconColumnWidth={statusIconColumnWidth}
            statusIconStickyRight={statusIconStickyRight}
            taskDependencyCountsById={taskDependencyCountsById}
            taskStatusSignalsById={taskStatusSignalsById}
            timelineDayHeaderCells={timelineDayHeaderCells}
            timelineGridTemplate={timelineGridTemplate}
            toggleSubsystem={toggleSubsystem}
          />
        );
      });

  return (
      <TimelineGridHeader
      clearHoveredMilestonePopup={clearHoveredMilestonePopup}
      firstDayGridColumn={firstDayGridColumn}
      gridMinWidth={gridMinWidth}
      handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
      handleTimelineZoomWheel={handleTimelineZoomWheel}
      hasProjectColumn={hasProjectColumn}
      isScrolling={isScrolling}
      isWeekView={isWeekView}
      monthGroups={monthGroups}
      handleTimelineHeaderDayClick={handleTimelineHeaderDayClick}
        projectColumnWidth={projectColumnWidth}
        showProjectCol={showProjectCol}
        showSubsystemCol={showSubsystemCol}
      subsystemColumnIndex={subsystemColumnIndex}
      subsystemColumnWidth={subsystemColumnWidth}
      subsystemStickyLeft={subsystemStickyLeft}
      timelineDayCellRefs={timelineDayCellRefs}
      timelineDayHeaderCells={timelineDayHeaderCells}
      timelineFilterMotionClass={timelineFilterMotionClass}
      timelineGridMotion={timelineGridMotion}
      timelineGridRef={timelineGridRef}
      timelineGridTemplate={timelineGridTemplate}
      timelineZoom={timelineZoom}
      timelineShellRef={timelineShellRef}
      toggleProjectColumn={toggleProjectColumn}
      toggleSubsystemColumn={toggleSubsystemColumn}
    >
      {rowChildren}
    </TimelineGridHeader>
  );
};
