import { memo, useState } from "react";

import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TaskCalendarView } from "@/features/workspace/views/taskCalendar/TaskCalendarView";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const disablePanelAnimations = props.disablePanelAnimations ?? false;
  const [scheduleSearchFilter, setScheduleSearchFilter] = useState("");
  const [calendarEventFilter, setCalendarEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [calendarSortMode, setCalendarSortMode] = useState<TaskCalendarSortMode>("date");
  const [calendarSortDirection, setCalendarSortDirection] = useState<"asc" | "desc">("asc");
  const {
    activePersonFilter,
    bootstrap,
    workTypesById,
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
      {taskView === "calendar" || taskView === "agenda" ? (
        <div className={`workspace-schedule-scroll${taskView === "calendar" ? " is-calendar-workspace" : ""}`} data-tutorial-target="schedule-view">
          <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive swipeDirection={taskSwipeDirection}>
            <TaskCalendarView
              presentation={taskView === "agenda" ? "agenda" : "calendar"}
              activePersonFilter={activePersonFilter}
              bootstrap={bootstrap}
              isAllProjectsView={isAllProjectsView}
              onSaveMeeting={props.handleMeetingSave}
              onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
              onSaveTimelineMilestone={handleTimelineMilestoneSave}
              onTaskDetailOpen={openTimelineTaskDetailsModal}
              onCreateMilestoneReport={props.openCreateMilestoneReportModal}
              openCreateTaskModal={openCreateTaskModalFromTimeline}
              onTaskEditCanceled={props.onTaskEditCanceled}
              onTaskEditSaved={props.onTaskEditSaved}
              eventFilter={calendarEventFilter}
              onEventFilterChange={setCalendarEventFilter}
              sortMode={calendarSortMode}
              onSortModeChange={setCalendarSortMode}
              sortDirection={calendarSortDirection}
              onSortDirectionChange={setCalendarSortDirection}
              searchFilter={scheduleSearchFilter}
              onSearchChange={setScheduleSearchFilter}
            />
          </WorkspaceSubPanel>
        </div>
      ) : null}
      {taskView === "timeline" ? (
        <div className="workspace-schedule-scroll" data-tutorial-target="schedule-view">
          <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive swipeDirection={taskSwipeDirection}>
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
        isActive={taskView === "kanban"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskQueueView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          workTypesById={workTypesById}
          isAllProjectsView={isAllProjectsView}
          isNonRobotProject={isNonRobotProject}
          membersById={membersById}
          openCreateTaskModal={openCreateTaskModal}
          openEditTaskModal={openTimelineTaskDetailsModal}
          onReassignTaskStatus={handleTaskStatusChange}
          subsystemsById={subsystemsById}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
