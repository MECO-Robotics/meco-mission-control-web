import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";
import { HomeView } from "@/features/workspace/views/overview";

export function WorkspaceHomeSection(props: WorkspaceContentPanelsViewProps) {
  const openTask = (id: string) => {
    const task = props.bootstrap.tasks.find((item) => item.id === id);
    if (task) props.openTimelineTaskDetailsModal(task);
  };

  return (
    <WorkspaceSectionPanel
      disableAnimations={props.disablePanelAnimations}
      isActive={props.activeTab === "home"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      <HomeView bootstrap={props.bootstrap} onOpenTask={openTask} />
    </WorkspaceSectionPanel>
  );
}
