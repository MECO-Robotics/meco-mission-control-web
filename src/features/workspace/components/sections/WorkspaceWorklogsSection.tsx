import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceWorklogsSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    disablePanelAnimations = false,
    membersById,
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
          membersById={membersById}
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
