import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";
import { HomeView } from "@/features/workspace/views/overview";
import type { AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";

export function WorkspaceHomeSection(props: WorkspaceContentPanelsViewProps) {
  const openTask = (id: string) => {
    const task = props.bootstrap.tasks.find((item) => item.id === id);
    if (task) props.openTimelineTaskDetailsModal(task);
  };
  const openActionItem = (item: AttentionQueueRow) => {
    if (item.action === "open-task") {
      openTask(item.recordId);
    } else if (item.action === "open-risk") {
      props.onOpenDrilldownTarget({ tab: "risks", riskId: item.recordId });
    } else if (item.source === "purchase") {
      const purchase = props.bootstrap.purchaseItems.find((record) => record.id === item.recordId);
      if (purchase) props.openEditPurchaseModal(purchase);
    } else if (item.source === "manufacturing") {
      props.onOpenDrilldownTarget({ tab: "tasks", taskView: "kanban" });
    } else {
      props.onOpenDrilldownTarget({ tab: "worklogs", worklogsView: "qa" });
    }
  };

  return (
    <WorkspaceSectionPanel
      disableAnimations={props.disablePanelAnimations}
      isActive={props.activeTab === "home"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      <HomeView
        activePersonFilter={props.activePersonFilter}
        bootstrap={props.bootstrap}
        onOpenActionItem={openActionItem}
        onOpenAllActions={() => props.onOpenDrilldownTarget({ tab: "risks" })}
        onOpenTask={openTask}
        onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "agenda", milestoneId })}
        projectId={props.selectedProject?.id ?? null}
        scopeLabel={props.selectedProject?.name ?? "All projects"}
      />
    </WorkspaceSectionPanel>
  );
}
