import { ReportsView } from "@/features/workspace/views/ReportsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceReportsSection(props: WorkspaceContentPanelsViewProps) {
  const {
    bootstrap,
    disablePanelAnimations = false,
    openCreateMilestoneReportModal,
    openCreateQaReportModal,
    openTimelineTaskDetailsModal,
    reportsSwipeDirection,
    reportsView,
    tabSwitchDirection,
  } = props;

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
