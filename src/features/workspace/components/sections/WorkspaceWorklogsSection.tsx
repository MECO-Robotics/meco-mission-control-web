import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceWorklogsSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    disablePanelAnimations = false,
    membersById,
    openCreateMilestoneReportModal,
    openCreateQaReportModal,
    openCreateWorkLogModal,
    openTimelineTaskDetailsModal,
    tabSwitchDirection,
    worklogsView,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "worklogs"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive>
        <WorkLogsView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          canReviewFindings={props.canReviewQa}
          operationScope={props.workspaceOperationScope}
          selectedSeasonId={props.selectedSeasonId}
          selectedProjectId={props.selectedProject?.id ?? null}
          handleUnauthorized={props.handleUnauthorized}
          loadWorkspace={props.loadWorkspace}
          setDataMessage={props.setDataMessage}
          membersById={membersById}
          openCreateMilestoneReportModal={openCreateMilestoneReportModal}
          openCreateQaReportModal={openCreateQaReportModal}
          openCreateWorkLogModal={openCreateWorkLogModal}
          openEditTaskModal={openTimelineTaskDetailsModal}
          subsystemsById={props.subsystemsById}
          view={worklogsView}
          onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "agenda", milestoneId })}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
