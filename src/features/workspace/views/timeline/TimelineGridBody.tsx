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

type TimelineGridMotion = "left" | "right" | "neutral";

interface TimelineGridBodyProps {
  bootstrap: BootstrapPayload;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  clearHoveredMilestonePopup: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  handleTimelineZoomWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
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
  showTaskCol: boolean;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemRows: TimelineSubsystemRow[];
  subsystemStickyLeft: number;
  taskColumnWidth: number;
  taskLabelColumnIndex: number;
  taskLabelStickyLeft: number;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridTemplate: string;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  toggleProject: (id: string) => void;
  toggleProjectColumn: () => void;
  toggleSubsystem: (id: string) => void;
  toggleSubsystemColumn: () => void;
  toggleTaskColumn: () => void;
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
  showTaskCol,
  subsystemColumnIndex,
  subsystemColumnWidth,
  subsystemRows,
  subsystemStickyLeft,
  taskColumnWidth,
  taskLabelColumnIndex,
  taskLabelStickyLeft,
  timelineDayCellRefs,
  timelineDayHeaderCells,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridRef,
  timelineGridTemplate,
  timelineShellRef,
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  toggleProject,
  toggleProjectColumn,
  toggleSubsystem,
  toggleSubsystemColumn,
  toggleTaskColumn,
}) => {
  const rowChildren = hasProjectColumn
    ? projectRows.map((project, projectIndex) => (
        <TimelineProjectGroup
          bootstrap={bootstrap}
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
          clearHoveredSubsystemRow={clearHoveredSubsystemRow}
          clearHoveredTaskRow={clearHoveredTaskRow}
          hoverTaskRow={hoverTaskRow}
          hoverSubsystemRow={hoverSubsystemRow}
          selectSubsystemRow={selectSubsystemRow}
          showProjectCol={showProjectCol}
          showSubsystemCol={showSubsystemCol}
          showTaskCol={showTaskCol}
          subsystemColumnIndex={subsystemColumnIndex}
          subsystemStickyLeft={subsystemStickyLeft}
          taskLabelColumnIndex={taskLabelColumnIndex}
          taskLabelStickyLeft={taskLabelStickyLeft}
          timelineDayHeaderCells={timelineDayHeaderCells}
          timelineGridTemplate={timelineGridTemplate}
          toggleProject={toggleProject}
          toggleSubsystem={toggleSubsystem}
        />
      ))
    : subsystemRows.map((subsystem, subsystemIndex) => (
        <TimelineSubsystemGroup
          bootstrap={bootstrap}
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
          showProjectCol={showProjectCol}
          showSubsystemCol={showSubsystemCol}
          showTaskCol={showTaskCol}
          subsystem={subsystem}
          subsystemColumnIndex={subsystemColumnIndex}
          subsystemIndex={subsystemIndex}
          subsystemStickyLeft={subsystemStickyLeft}
          taskLabelColumnIndex={taskLabelColumnIndex}
          taskLabelStickyLeft={taskLabelStickyLeft}
          timelineDayHeaderCells={timelineDayHeaderCells}
          timelineGridTemplate={timelineGridTemplate}
          toggleSubsystem={toggleSubsystem}
        />
      ));

  return (
    <TimelineGridHeader
      clearHoveredMilestonePopup={clearHoveredMilestonePopup}
      firstDayGridColumn={firstDayGridColumn}
      gridMinWidth={gridMinWidth}
      handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
      handleTimelineZoomWheel={handleTimelineZoomWheel}
      hasProjectColumn={hasProjectColumn}
      isWeekView={isWeekView}
      monthGroups={monthGroups}
      handleTimelineHeaderDayClick={handleTimelineHeaderDayClick}
      projectColumnWidth={projectColumnWidth}
      showProjectCol={showProjectCol}
      showSubsystemCol={showSubsystemCol}
      showTaskCol={showTaskCol}
      subsystemColumnIndex={subsystemColumnIndex}
      subsystemColumnWidth={subsystemColumnWidth}
      subsystemStickyLeft={subsystemStickyLeft}
      taskColumnWidth={taskColumnWidth}
      taskLabelColumnIndex={taskLabelColumnIndex}
      taskLabelStickyLeft={taskLabelStickyLeft}
      timelineDayCellRefs={timelineDayCellRefs}
      timelineDayHeaderCells={timelineDayHeaderCells}
      timelineFilterMotionClass={timelineFilterMotionClass}
      timelineGridMotion={timelineGridMotion}
      timelineGridRef={timelineGridRef}
      timelineGridTemplate={timelineGridTemplate}
      timelineShellRef={timelineShellRef}
      toggleProjectColumn={toggleProjectColumn}
      toggleSubsystemColumn={toggleSubsystemColumn}
      toggleTaskColumn={toggleTaskColumn}
    >
      {rowChildren}
    </TimelineGridHeader>
  );
};
