import { HomeView } from "@/features/workspace/views/overview";
import { RisksView } from "@/features/workspace/views/RisksView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceHomeSection(props: WorkspaceContentPanelsViewProps) {
  const openTask = (id: string) => {
    const task = props.bootstrap.tasks.find(item => item.id === id);
    if (task) props.openTimelineTaskDetailsModal(task);
  };
  const openSource = (source: string, id: string) => {
    if (source === "manufacturing") {
      const item = props.bootstrap.manufacturingItems.find(item => item.id === id);
      if (item) props.openEditManufacturingModal(item);
    } else if (source === "purchase") {
      const item = props.bootstrap.purchaseItems.find(item => item.id === id);
      if (item) props.openEditPurchaseModal(item);
    } else props.onOpenDrilldownTarget({ tab: "worklogs", worklogsView: "qa" });
  };
  return <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "home"} tabSwitchDirection={props.tabSwitchDirection}>
    <HomeView bootstrap={props.bootstrap} onOpenTask={openTask} onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "milestones", milestoneId })} />
    <RisksView activePersonFilter={props.activePersonFilter} bootstrap={props.bootstrap} isAllProjectsView={props.isAllProjectsView} onCreateRisk={props.onCreateRisk} onDeleteRisk={props.onDeleteRisk} onUpdateRisk={props.onUpdateRisk} openTaskDetailModal={props.openTimelineTaskDetailsModal} onOpenSource={openSource} view="attention" includeHealth />
  </WorkspaceSectionPanel>;
}
