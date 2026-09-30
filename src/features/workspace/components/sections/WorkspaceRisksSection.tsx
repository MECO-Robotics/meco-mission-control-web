import { RisksView } from "@/features/workspace/views/RisksView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceRisksSection(props: WorkspaceContentPanelsViewProps) {
  const openSource = (source: string, id: string) => {
    if (source === "purchase") {
      const purchase = props.bootstrap.purchaseItems.find((item) => item.id === id);
      if (purchase) props.openEditPurchaseModal(purchase);
      return;
    }
    props.onOpenDrilldownTarget({ tab: "worklogs", worklogsView: "qa" });
  };

  return (
    <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "risks"} tabSwitchDirection={props.tabSwitchDirection}>
      <RisksView
        activePersonFilter={props.activePersonFilter}
        bootstrap={props.bootstrap}
        onDeleteRisk={props.onDeleteRisk}
        onUpdateRisk={props.onUpdateRisk}
        openTaskDetailModal={props.openTimelineTaskDetailsModal}
        onOpenSource={openSource}
      />
    </WorkspaceSectionPanel>
  );
}
