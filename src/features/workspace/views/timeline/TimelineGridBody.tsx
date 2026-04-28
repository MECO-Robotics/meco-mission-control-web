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
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  handleTimelineZoomWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  monthGroups: TimelineMonthGroup[];
  openEventModalForDay: (day: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  projectColumnWidth: number;
  projectRows: TimelineProjectRow[];
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
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  handleTimelineZoomWheel,
  hasProjectColumn,
  membersById,
  monthGroups,
  openEventModalForDay,
  openTaskDetailModal,
  projectColumnWidth,
  projectRows,
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
          firstDayGridColumn={firstDayGridColumn}
          gridMinWidth={gridMinWidth}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          key={project.id}
          membersById={membersById}
          openTaskDetailModal={openTaskDetailModal}
          project={project}
          projectIndex={projectIndex}
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
          firstDayGridColumn={firstDayGridColumn}
          gridMinWidth={gridMinWidth}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          key={subsystem.id}
          membersById={membersById}
          openTaskDetailModal={openTaskDetailModal}
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
      monthGroups={monthGroups}
      openEventModalForDay={openEventModalForDay}
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
