import { memo } from "react";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { TaskCalendarView } from "@/features/workspace/views/taskCalendar/TaskCalendarView";
import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const disablePanelAnimations = props.disablePanelAnimations ?? false;
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
        <div className="workspace-presentation-controls" role="group" aria-label="Schedule presentation" data-tutorial-target="schedule-view">
          {([ ["calendar", "Calendar"], ["timeline", "Timeline"], ["milestones", "Agenda"] ] as const).map(([value, label]) => (
            <button key={value} className="ghost-button" aria-pressed={taskView === value} onClick={() => props.onOpenDrilldownTarget({ tab: "tasks", taskView: value })} type="button">{label}</button>
          ))}
        </div>
      ) : null}
      {taskView === "robot-map" ? (
        <div className="workspace-presentation-controls">
          <button className="ghost-button" onClick={() => props.onOpenDrilldownTarget({ tab: "cad" })} type="button">Import CAD</button>
        </div>
      ) : null}
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "calendar"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskCalendarView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onSaveMeeting={handleMeetingSave}
          onCreateMilestoneReport={props.openCreateMilestoneReportModal}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
          onTaskDetailOpen={openTimelineTaskDetailsModal}
          onTaskEditCanceled={props.onTaskEditCanceled}
          onTaskEditSaved={props.onTaskEditSaved}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "timeline"}
        swipeDirection={taskSwipeDirection}
      >
        <MemoizedTimelineView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          membersById={membersById}
          onTaskEditCanceled={props.onTaskEditCanceled}
          onTaskEditSaved={props.onTaskEditSaved}
          onCreateMilestoneReport={props.openCreateMilestoneReportModal}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
          openCreateTaskModal={openCreateTaskModalFromTimeline}
          openTaskDetailModal={openTimelineTaskDetailsModal}
          setActivePersonFilter={setActivePersonFilter}
          triggerCreateMilestoneToken={timelineMilestoneCreateSignal}
        />
      </WorkspaceSubPanel>

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
          currentMemberId={props.currentMemberId}
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
