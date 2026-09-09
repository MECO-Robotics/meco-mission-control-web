import { useSyncExternalStore } from "react";
import { getLocalWorkspaceMode, subscribeLocalWorkspace } from "@/lib/localWorkspace/session";
import { CadIntegrationView } from "@/features/workspace/views/cad";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceCadSection(props: WorkspaceContentPanelsViewProps) {
  const localMode = useSyncExternalStore(subscribeLocalWorkspace, getLocalWorkspaceMode, () => null);
  return (
    <WorkspaceSectionPanel
      disableAnimations={props.disablePanelAnimations}
      isActive={props.activeTab === "cad"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={props.disablePanelAnimations} isActive>
        {localMode ? (
          <div className="empty-state">
            <h2>CAD connections need a signed-in workspace</h2>
            <p>Demo and tutorial changes stay in this tab. STEP processing and Onshape sync use server services, so they are unavailable here. You can edit the robot map, subsystems, and parts locally.</p>
          </div>
        ) : <CadIntegrationView
          mechanisms={Object.values(props.mechanismsById)}
          partDefinitions={Object.values(props.partDefinitionsById)}
          projectId={props.selectedProject?.id ?? null}
          seasonId={props.selectedSeasonId}
          subsystems={Object.values(props.subsystemsById)}
        />}
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
