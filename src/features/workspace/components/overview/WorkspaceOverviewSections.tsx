import { HomeView } from "@/features/workspace/views/overview";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceHomeSection({
  activeTab,
  bootstrap,
  disablePanelAnimations = false,
  openTimelineTaskDetailsModal,
  tabSwitchDirection,
}: WorkspaceContentPanelsViewProps) {
  const openTask = (taskId: string) => {
    const task = bootstrap.tasks.find((candidate) => candidate.id === taskId);
    if (task) {
      openTimelineTaskDetailsModal(task);
    }
  };

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={activeTab === "home"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <HomeView bootstrap={bootstrap} onOpenTask={openTask} />
    </WorkspaceSectionPanel>
  );
}
