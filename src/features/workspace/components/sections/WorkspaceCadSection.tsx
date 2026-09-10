import { CadFileViewer } from "../../views/cad/viewer/CadPartViewer";
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
        <div className="workspace-presentation-controls"><button className="ghost-button" onClick={() => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "robot-map" })} type="button">Back to Structure</button></div>
        {localMode ? (
          <CadFileViewer key={props.selectedProject?.id ?? "none"} partDefinitions={Object.values(props.partDefinitionsById)} onSavePartImage={props.savePartImage} />
        ) : <CadIntegrationView
          onSavePartImage={props.savePartImage}
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
