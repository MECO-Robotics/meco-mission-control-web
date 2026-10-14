import { RisksView } from "@/features/workspace/views/RisksView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceRisksSection(props: WorkspaceContentPanelsViewProps) {
  return (
    <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "risks"} tabSwitchDirection={props.tabSwitchDirection}>
      <RisksView
        activePersonFilter={props.activePersonFilter}
        bootstrap={props.bootstrap}
        onCreateRisk={props.onCreateRisk}
        onDeleteRisk={props.onDeleteRisk}
        onUpdateRisk={props.onUpdateRisk}
        openTaskDetailModal={props.openTimelineTaskDetailsModal}
        selectedRiskId={new URLSearchParams(window.location.search).get("risk")}
        onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "agenda", milestoneId })}
      />
    </WorkspaceSectionPanel>
  );
}
