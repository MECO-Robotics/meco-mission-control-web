import { ArtifactEditorModal } from "../modals/assetCatalog/ArtifactEditorModal";
import { MaterialEditorModal } from "../modals/assetCatalog/MaterialEditorModal";
import { PartDefinitionEditorModal } from "../modals/assetCatalog/PartDefinitionEditorModal";
import { PartInstanceEditorModal } from "../modals/assetCatalog/PartInstanceEditorModal";
import { MechanismEditorModal } from "../modals/structure/MechanismEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceAssetModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.artifactModalMode && !props.materialEditor.materialModalMode && !props.mechanismModalMode && !props.partInstanceModalMode && !props.partDefinitionModalMode) {
    return null;
  }

  return (
    <>
      {props.artifactModalMode ? (
        <ArtifactEditorModal
          activeArtifactId={props.activeArtifactId}
          artifactDraft={props.artifactDraft}
          artifactModalMode={props.artifactModalMode}
          bootstrap={props.bootstrap}
          closeArtifactModal={props.closeArtifactModal}
          handleArtifactSubmit={props.handleArtifactSubmit}
          handleDeleteArtifact={props.handleDeleteArtifact}
          handleToggleArtifactArchived={props.handleToggleArtifactArchived}
          isDeletingArtifact={props.isDeletingArtifact}
          isSavingArtifact={props.isSavingArtifact}
          setArtifactDraft={props.setArtifactDraft}
        />
      ) : null}

      <MaterialEditorModal {...props.materialEditor} />

      {props.mechanismModalMode ? (
        <MechanismEditorModal
          activeMechanismId={props.activeMechanismId}
          bootstrap={props.bootstrap}
          closeMechanismModal={props.closeMechanismModal}
          handleDeleteMechanism={props.handleDeleteMechanism}
          handleToggleMechanismArchived={props.handleToggleMechanismArchived}
          handleMechanismSubmit={props.handleMechanismSubmit}
          isDeletingMechanism={props.isDeletingMechanism}
          isSavingMechanism={props.isSavingMechanism}
          requestPhotoUpload={props.requestPhotoUpload}
          mechanismDraft={props.mechanismDraft}
          mechanismModalMode={props.mechanismModalMode}
          setMechanismDraft={props.setMechanismDraft}
        />
      ) : null}

      {props.partInstanceModalMode ? (
        <PartInstanceEditorModal
          bootstrap={props.bootstrap}
          closePartInstanceModal={props.closePartInstanceModal}
          handlePartInstanceSubmit={props.handlePartInstanceSubmit}
          isSavingPartInstance={props.isSavingPartInstance}
          requestPhotoUpload={props.requestPhotoUpload}
          partDefinitionDraftsById={props.partDefinitionsById}
          partInstanceDraft={props.partInstanceDraft}
          partInstanceModalMode={props.partInstanceModalMode}
          setPartInstanceDraft={props.setPartInstanceDraft}
        />
      ) : null}

      {props.partDefinitionModalMode ? (
        <PartDefinitionEditorModal
          activePartDefinitionId={props.activePartDefinitionId}
          bootstrap={props.bootstrap}
          closePartDefinitionModal={props.closePartDefinitionModal}
          handleDeletePartDefinition={props.handleDeletePartDefinition}
          handleTogglePartDefinitionArchived={props.handleTogglePartDefinitionArchived}
          handlePartDefinitionSubmit={props.handlePartDefinitionSubmit}
          isDeletingPartDefinition={props.isDeletingPartDefinition}
          isSavingPartDefinition={props.isSavingPartDefinition}
          requestPhotoUpload={props.requestPhotoUpload}
          partDefinitionDraft={props.partDefinitionDraft}
          partDefinitionModalMode={props.partDefinitionModalMode}
          setPartDefinitionDraft={props.setPartDefinitionDraft}
        />
      ) : null}
    </>
  );
}
