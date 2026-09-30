import { ArtifactInventoryView } from "@/features/workspace/views/ArtifactInventoryView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const DOCUMENT_ARTIFACT_KINDS = ["document", "nontechnical"] as const;

export function WorkspaceDocumentsSection(props: WorkspaceContentPanelsViewProps) {
  return (
    <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "documents"} tabSwitchDirection={props.tabSwitchDirection}>
      <ArtifactInventoryView
        artifacts={props.artifacts}
        createKind="document"
        kinds={DOCUMENT_ARTIFACT_KINDS}
        openCreateArtifactModal={props.openCreateArtifactModal}
        openEditArtifactModal={props.openEditArtifactModal}
        title="Documents"
      />
    </WorkspaceSectionPanel>
  );
}
