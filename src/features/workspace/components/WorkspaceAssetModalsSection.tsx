import { ArtifactEditorModal } from "../modals/assetCatalog/ArtifactEditorModal";
import { MaterialEditorModal } from "../modals/assetCatalog/MaterialEditorModal";
import { PartDefinitionEditorModal } from "../modals/assetCatalog/PartDefinitionEditorModal";
import { PartInstanceEditorModal } from "../modals/assetCatalog/PartInstanceEditorModal";
import { MechanismEditorModal } from "../modals/structure/MechanismEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceAssetModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.artifactEditor.artifactModalMode && !props.materialEditor.materialModalMode && !props.mechanismEditor.mechanismModalMode && !props.partInstanceEditor.partInstanceModalMode && !props.partDefinitionEditor.partDefinitionModalMode) {
    return null;
  }

  return (
    <>
      {props.artifactEditor.artifactModalMode ? (
        <ArtifactEditorModal
          {...props.artifactEditor}
          artifactModalMode={props.artifactEditor.artifactModalMode}
          bootstrap={props.bootstrap}
        />
      ) : null}

      <MaterialEditorModal {...props.materialEditor} />

      {props.mechanismEditor.mechanismModalMode ? (
        <MechanismEditorModal
          {...props.mechanismEditor}
          mechanismModalMode={props.mechanismEditor.mechanismModalMode}
          bootstrap={props.bootstrap}
          requestPhotoUpload={props.requestPhotoUpload}
        />
      ) : null}

      {props.partInstanceEditor.partInstanceModalMode ? (
        <PartInstanceEditorModal
          {...props.partInstanceEditor}
          partInstanceModalMode={props.partInstanceEditor.partInstanceModalMode}
          bootstrap={props.bootstrap}
          requestPhotoUpload={props.requestPhotoUpload}
          partDefinitionDraftsById={props.partDefinitionsById}
        />
      ) : null}

      {props.partDefinitionEditor.partDefinitionModalMode ? (
        <PartDefinitionEditorModal
          {...props.partDefinitionEditor}
          partDefinitionModalMode={props.partDefinitionEditor.partDefinitionModalMode}
          bootstrap={props.bootstrap}
          requestPhotoUpload={props.requestPhotoUpload}
        />
      ) : null}
    </>
  );
}
