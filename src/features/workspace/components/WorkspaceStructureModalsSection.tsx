import { PurchaseEditorModal } from "../modals/purchaseManufacturing/PurchaseEditorModal";
import { SubsystemEditorModal } from "../modals/structure/SubsystemEditorModal";
import { WorkstreamEditorModal } from "../modals/assetCatalog/WorkstreamEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceStructureModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.subsystemEditor.subsystemModalMode && !props.workstreamEditor.workstreamModalMode && !props.purchaseEditor.purchaseModalMode) {
    return null;
  }

  return (
    <>
      {props.subsystemEditor.subsystemModalMode ? (
        <SubsystemEditorModal
          {...props.subsystemEditor}
          subsystemModalMode={props.subsystemEditor.subsystemModalMode}
          bootstrap={props.bootstrap}
          requestPhotoUpload={props.requestPhotoUpload}
        />
      ) : null}

      {props.workstreamEditor.workstreamModalMode ? (
        <WorkstreamEditorModal
          {...props.workstreamEditor}
          workstreamModalMode={props.workstreamEditor.workstreamModalMode}
          bootstrap={props.bootstrap}
        />
      ) : null}

      {props.purchaseEditor.purchaseModalMode ? (
        <PurchaseEditorModal
          {...props.purchaseEditor}
          purchaseModalMode={props.purchaseEditor.purchaseModalMode}
          bootstrap={props.bootstrap}
        />
      ) : null}
    </>
  );
}
