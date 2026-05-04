import { memo } from "react";

import { SUBVIEW_INTERACTION_GUIDANCE } from "@/features/workspace/shared/ui";
import { TaskQueueView, MilestonesView, TimelineView } from "@/features/workspace/views";
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
        description={SUBVIEW_INTERACTION_GUIDANCE.timeline}
        isActive={taskView === "timeline"}
        swipeDirection={taskSwipeDirection}
      >
        <MemoizedTimelineView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          membersById={membersById}
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
        description={SUBVIEW_INTERACTION_GUIDANCE.queue}
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
        description={SUBVIEW_INTERACTION_GUIDANCE.milestones}
        isActive={taskView === "milestones"}
        pinInteractionNoteToBottom={false}
        swipeDirection={taskSwipeDirection}
      >
        <MilestonesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
