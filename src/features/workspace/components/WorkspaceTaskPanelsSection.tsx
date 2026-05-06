import { memo } from "react";

import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskPanelsSection({
  activePersonFilter,
  bootstrap,
  disciplinesById,
  isAllProjectsView,
  isNonRobotProject,
  membersById,
  handleTimelineMilestoneDelete,
  handleTimelineMilestoneSave,
  onTaskEditCanceled,
  onTaskEditSaved,
  openCreateTaskModal,
  openTimelineTaskDetailsModal,
  setActivePersonFilter,
  tabSwitchDirection,
  taskSwipeDirection,
  taskView,
  disablePanelAnimations = false,
  timelineMilestoneCreateSignal,
  subsystemsById,
  openCreateTaskModalFromTimeline,
}: WorkspaceContentPanelsViewProps) {
  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={taskView === "timeline" || taskView === "queue" || taskView === "milestones"}
      tabSwitchDirection={tabSwitchDirection}
    >
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
          onTaskEditCanceled={onTaskEditCanceled}
          onTaskEditSaved={onTaskEditSaved}
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
          onTaskEditCanceled={onTaskEditCanceled}
          onTaskEditSaved={onTaskEditSaved}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
