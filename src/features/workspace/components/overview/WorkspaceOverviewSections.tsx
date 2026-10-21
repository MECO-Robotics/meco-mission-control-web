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
    } else {
      props.onOpenDrilldownTarget({ tab: "risks", riskId: item.recordId });
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
        signedInMemberId={props.localActorMemberId ?? null}
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
