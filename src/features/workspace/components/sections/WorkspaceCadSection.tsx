import { CadIntegrationView } from "@/features/workspace/views/cad";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceCadSection(props: WorkspaceContentPanelsViewProps) {
  return (
    <WorkspaceSectionPanel
      disableAnimations={props.disablePanelAnimations}
      isActive={props.activeTab === "cad"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={props.disablePanelAnimations} isActive>
        <CadIntegrationView
          mechanisms={Object.values(props.mechanismsById)}
          partDefinitions={Object.values(props.partDefinitionsById)}
          projectId={props.selectedProject?.id ?? null}
          seasonId={props.selectedSeasonId}
          subsystems={Object.values(props.subsystemsById)}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
