import { memo } from "react";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { TaskCalendarPlaceholderView } from "@/features/workspace/views/taskQueue/TaskCalendarPlaceholderView";
import { TaskRobotMapPlaceholderView } from "@/features/workspace/views/taskQueue/TaskRobotMapPlaceholderView";
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
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "calendar"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskCalendarPlaceholderView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onSaveMeeting={handleMeetingSave}
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
        <TaskRobotMapPlaceholderView
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
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
