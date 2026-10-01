import { TeamsView } from "@/features/workspace/views/TeamsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceTeamsSection(props: WorkspaceContentPanelsViewProps) {
  return <WorkspaceSectionPanel isActive={props.activeTab === "teams"} tabSwitchDirection={props.tabSwitchDirection} disableAnimations={props.disablePanelAnimations ?? false}>
    <WorkspaceSubPanel isActive disableAnimations={props.disablePanelAnimations ?? false}>
      <TeamsView bootstrap={props.availabilityBootstrap} selectedSeasonId={props.selectedSeasonId} selectedProjectId={props.selectedProject?.id ?? null} onRefresh={props.loadWorkspace} handleUnauthorized={props.handleUnauthorized} onOpenTask={props.openTimelineTaskDetailsModal} onOpenMember={(memberId) => { props.selectMember(memberId, props.bootstrap); props.onOpenDrilldownTarget({ tab: "roster" }); }} onError={props.setDataMessage}/>
    </WorkspaceSubPanel>
  </WorkspaceSectionPanel>;
}
