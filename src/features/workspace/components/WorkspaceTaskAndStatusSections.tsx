import { memo } from "react";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { RisksView } from "@/features/workspace/views/RisksView";
import { TaskCalendarPlaceholderView } from "@/features/workspace/views/taskQueue/TaskCalendarPlaceholderView";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import { ReportsView } from "@/features/workspace/views/ReportsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    disablePanelAnimations = false,
    handleTimelineMilestoneDelete,
    handleTimelineMilestoneSave,
    isAllProjectsView,
    membersById,
    openCreateTaskModalFromTimeline,
    openTimelineTaskDetailsModal,
    setActivePersonFilter,
    tabSwitchDirection,
    taskSwipeDirection,
    taskView,
    timelineMilestoneCreateSignal,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "tasks"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "calendar"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskCalendarPlaceholderView />
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
        isActive={taskView === "queue"}
        swipeDirection={taskSwipeDirection}
      >
        <TaskQueueView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          disciplinesById={props.disciplinesById}
          isAllProjectsView={isAllProjectsView}
          isNonRobotProject={props.isNonRobotProject}
          membersById={membersById}
          openCreateTaskModal={props.openCreateTaskModal}
          openEditTaskModal={openTimelineTaskDetailsModal}
          subsystemsById={props.subsystemsById}
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

export function WorkspaceRiskSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    disablePanelAnimations = false,
    isAllProjectsView,
    onCreateRisk,
    onDeleteRisk,
    onUpdateRisk,
    riskManagementView,
    tabSwitchDirection,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "risk-management"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive
      >
        <RisksView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onCreateRisk={onCreateRisk}
          onDeleteRisk={onDeleteRisk}
          onUpdateRisk={onUpdateRisk}
          view={riskManagementView}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}

export function WorkspaceWorklogsSection(props: WorkspaceContentPanelsViewProps) {
  const { activePersonFilter, bootstrap, disablePanelAnimations = false, membersById, openCreateWorkLogModal, openTimelineTaskDetailsModal, tabSwitchDirection, worklogsView } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "worklogs"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive
      >
        <WorkLogsView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          membersById={membersById}
          openCreateWorkLogModal={openCreateWorkLogModal}
          openEditTaskModal={openTimelineTaskDetailsModal}
          subsystemsById={props.subsystemsById}
          view={worklogsView}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}

export function WorkspaceReportsSection(props: WorkspaceContentPanelsViewProps) {
  const { bootstrap, disablePanelAnimations = false, openCreateMilestoneReportModal, openCreateQaReportModal, openTimelineTaskDetailsModal, reportsSwipeDirection, reportsView, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "reports"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={reportsView === "qa"}
        swipeDirection={reportsSwipeDirection}
      >
        <ReportsView
          bootstrap={bootstrap}
          openCreateMilestoneReportModal={openCreateMilestoneReportModal}
          openCreateQaReportModal={openCreateQaReportModal}
          openTaskDetailsModal={openTimelineTaskDetailsModal}
          view="qa"
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={reportsView === "milestone-results"}
        swipeDirection={reportsSwipeDirection}
      >
        <ReportsView
          bootstrap={bootstrap}
          openCreateMilestoneReportModal={openCreateMilestoneReportModal}
          openCreateQaReportModal={openCreateQaReportModal}
          openTaskDetailsModal={openTimelineTaskDetailsModal}
          view="milestone-results"
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
