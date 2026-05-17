import { RisksView } from "@/features/workspace/views/RisksView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

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
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive>
        <RisksView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onCreateRisk={onCreateRisk}
          onDeleteRisk={onDeleteRisk}
          onUpdateRisk={onUpdateRisk}
          openTaskDetailModal={props.openTimelineTaskDetailsModal}
          view={riskManagementView}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
