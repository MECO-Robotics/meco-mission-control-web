import { memo, useState } from "react";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { TaskCalendarView } from "@/features/workspace/views/taskCalendar/TaskCalendarView";
import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const disablePanelAnimations = props.disablePanelAnimations ?? false;
  const [scheduleSearchFilter, setScheduleSearchFilter] = useState("");
  const [calendarEventFilter, setCalendarEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [calendarSortMode, setCalendarSortMode] = useState<TaskCalendarSortMode>("date");
  const {
    activePersonFilter,
    bootstrap,
    disciplinesById,
    handleMeetingSave,
    handleTaskStatusChange,
    handleTimelineMilestoneDelete,
    handleTimelineMilestoneSave,
    isAllProjectsView,
    isNonRobotProject,
    membersById,
    openCreateTaskModal,
    openCreateTaskModalFromTimeline,
    openCreateMechanismModal,
    openCreatePartInstanceModal,
    openCreateSubsystemModal,
    handleDeleteMechanism,
    openEditMechanismModal,
    openEditPartInstanceModal,
    openEditSubsystemModal,
    onOpenDrilldownTarget,
    removePartInstanceFromMechanism,
    savePartImage,
    saveSubsystemLayout,
    updateSubsystemConfiguration,
    openTimelineTaskDetailsModal,
    setActivePersonFilter,
    subsystemsById,
    taskSwipeDirection,
    taskView,
    timelineMilestoneCreateSignal,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "tasks"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      {["calendar", "timeline", "milestones"].includes(taskView) ? (
        <div className="workspace-schedule-scroll" data-tutorial-target="schedule-view">
          <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={taskView === "calendar" || taskView === "timeline"} swipeDirection={taskSwipeDirection}>
            <TaskCalendarView
              activePersonFilter={activePersonFilter}
              bootstrap={bootstrap}
              isAllProjectsView={isAllProjectsView}
              onSaveMeeting={handleMeetingSave}
              onCreateMilestoneReport={props.openCreateMilestoneReportModal}
              onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
              onSaveTimelineMilestone={handleTimelineMilestoneSave}
              searchFilter={scheduleSearchFilter}
              onSearchChange={setScheduleSearchFilter}
              eventFilter={calendarEventFilter}
              onEventFilterChange={setCalendarEventFilter}
              sortMode={calendarSortMode}
              onSortModeChange={setCalendarSortMode}
              onTaskDetailOpen={openTimelineTaskDetailsModal}
              onTaskEditCanceled={props.onTaskEditCanceled}
              onTaskEditSaved={props.onTaskEditSaved}
            />
          </WorkspaceSubPanel>
          <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={taskView === "calendar" || taskView === "timeline"} swipeDirection={taskSwipeDirection}>
            <MemoizedTimelineView
              activePersonFilter={activePersonFilter}
              bootstrap={bootstrap}
              isAllProjectsView={isAllProjectsView}
              onTaskEditCanceled={props.onTaskEditCanceled}
              onTaskEditSaved={props.onTaskEditSaved}
              onCreateMilestoneReport={props.openCreateMilestoneReportModal}
              onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
              onSaveTimelineMilestone={handleTimelineMilestoneSave}
              searchFilter={scheduleSearchFilter}
              onSearchChange={setScheduleSearchFilter}
              calendarEventFilter={calendarEventFilter}
              onCalendarEventFilterChange={setCalendarEventFilter}
              calendarSortMode={calendarSortMode}
              onCalendarSortModeChange={setCalendarSortMode}
              showCalendarFilters={taskView === "calendar"}
              openCreateTaskModal={openCreateTaskModalFromTimeline}
              openTaskDetailModal={openTimelineTaskDetailsModal}
              setActivePersonFilter={setActivePersonFilter}
              triggerCreateMilestoneToken={timelineMilestoneCreateSignal}
            />
          </WorkspaceSubPanel>
        </div>
      ) : null}
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "robot-map"}
        swipeDirection={taskSwipeDirection}
      >
        <RobotMapView
          bootstrap={bootstrap}
          openCreateMechanismModal={openCreateMechanismModal}
          openCreatePartInstanceModal={openCreatePartInstanceModal}
          openCreateSubsystemModal={openCreateSubsystemModal}
          handleDeleteMechanism={handleDeleteMechanism}
          openEditMechanismModal={openEditMechanismModal}
          openEditPartInstanceModal={openEditPartInstanceModal}
          openEditSubsystemModal={openEditSubsystemModal}
          onOpenDrilldownTarget={onOpenDrilldownTarget}
          onOpenCadWorkspace={() => onOpenDrilldownTarget({ tab: "cad" })}
          removePartInstanceFromMechanism={removePartInstanceFromMechanism}
          onSavePartImage={savePartImage}
          saveSubsystemLayout={saveSubsystemLayout}
          updateSubsystemConfiguration={updateSubsystemConfiguration}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "queue"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskQueueView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          disciplinesById={disciplinesById}
          isAllProjectsView={isAllProjectsView}
          isNonRobotProject={isNonRobotProject}
          membersById={membersById}
          openCreateTaskModal={openCreateTaskModal}
          openEditTaskModal={openTimelineTaskDetailsModal}
          onReassignTaskStatus={handleTaskStatusChange}
          subsystemsById={subsystemsById}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "milestones"}
        swipeDirection={taskSwipeDirection}
      >
        <MilestonesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onTaskEditCanceled={props.onTaskEditCanceled}
          onTaskEditSaved={props.onTaskEditSaved}
          onCreateMilestoneReport={props.openCreateMilestoneReportModal}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
