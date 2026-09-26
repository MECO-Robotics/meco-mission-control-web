import { ManufacturingEditorModal } from "../modals/purchaseManufacturing/ManufacturingEditorModal";
import { PurchaseEditorModal } from "../modals/purchaseManufacturing/PurchaseEditorModal";
import { SubsystemEditorModal } from "../modals/structure/SubsystemEditorModal";
import { WorkstreamEditorModal } from "../modals/assetCatalog/WorkstreamEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceStructureModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.subsystemEditor.subsystemModalMode && !props.workstreamEditor.workstreamModalMode && !props.manufacturingModalMode && !props.purchaseModalMode) {
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

      {props.manufacturingModalMode ? (
        <ManufacturingEditorModal
          bootstrap={props.bootstrap}
          closeManufacturingModal={props.closeManufacturingModal}
          handleManufacturingSubmit={props.handleManufacturingSubmit}
          isSavingManufacturing={props.isSavingManufacturing}
          manufacturingDraft={props.manufacturingDraft}
          manufacturingModalMode={props.manufacturingModalMode}
          setManufacturingDraft={props.setManufacturingDraft}
        />
      ) : null}

      {props.purchaseModalMode ? (
        <PurchaseEditorModal
          bootstrap={props.bootstrap}
          closePurchaseModal={props.closePurchaseModal}
          handlePurchaseSubmit={props.handlePurchaseSubmit}
          isSavingPurchase={props.isSavingPurchase}
          purchaseDraft={props.purchaseDraft}
          purchaseFinalCost={props.purchaseFinalCost}
          purchaseModalMode={props.purchaseModalMode}
          setPurchaseDraft={props.setPurchaseDraft}
          setPurchaseFinalCost={props.setPurchaseFinalCost}
        />
      ) : null}
    </>
  );
}
