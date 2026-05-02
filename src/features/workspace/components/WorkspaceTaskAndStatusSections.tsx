import { memo } from "react";

import { SUBVIEW_INTERACTION_GUIDANCE } from "@/features/workspace/shared/ui";
import {
  MilestonesView,
  RisksView,
  TaskQueueView,
  TimelineView,
  WorkLogsView,
  ReportsView,
} from "@/features/workspace/views";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    disablePanelAnimations = false,
    handleTimelineEventDelete,
    handleTimelineEventSave,
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
        description={SUBVIEW_INTERACTION_GUIDANCE.timeline}
        isActive={taskView === "timeline"}
        swipeDirection={taskSwipeDirection}
      >
        <MemoizedTimelineView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          membersById={membersById}
          onDeleteTimelineEvent={handleTimelineEventDelete}
          onSaveTimelineEvent={handleTimelineEventSave}
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
        description={SUBVIEW_INTERACTION_GUIDANCE.milestones}
        isActive={taskView === "milestones"}
        swipeDirection={taskSwipeDirection}
      >
        <MilestonesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onDeleteTimelineEvent={handleTimelineEventDelete}
          onSaveTimelineEvent={handleTimelineEventSave}
          subsystemsById={props.subsystemsById}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}

export function WorkspaceRiskSection(props: WorkspaceContentPanelsViewProps) {
  const { activePersonFilter, bootstrap, disablePanelAnimations = false, onCreateRisk, onDeleteRisk, onUpdateRisk, riskManagementView, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "risk-management"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        description={SUBVIEW_INTERACTION_GUIDANCE["risk-management"]}
        isActive
      >
        <RisksView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
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
        description={SUBVIEW_INTERACTION_GUIDANCE.logs}
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
  const { bootstrap, disablePanelAnimations = false, openCreateEventReportModal, openCreateQaReportModal, openTimelineTaskDetailsModal, reportsSwipeDirection, reportsView, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "reports"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        description={SUBVIEW_INTERACTION_GUIDANCE.reports}
        disableAnimations={disablePanelAnimations}
        isActive={reportsView === "qa"}
        swipeDirection={reportsSwipeDirection}
      >
        <ReportsView
          bootstrap={bootstrap}
          openCreateEventReportModal={openCreateEventReportModal}
          openCreateQaReportModal={openCreateQaReportModal}
          openTaskDetailsModal={openTimelineTaskDetailsModal}
          view="qa"
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        description={SUBVIEW_INTERACTION_GUIDANCE.reports}
        disableAnimations={disablePanelAnimations}
        isActive={reportsView === "event-results"}
        swipeDirection={reportsSwipeDirection}
      >
        <ReportsView
          bootstrap={bootstrap}
          openCreateEventReportModal={openCreateEventReportModal}
          openCreateQaReportModal={openCreateQaReportModal}
          openTaskDetailsModal={openTimelineTaskDetailsModal}
          view="event-results"
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
