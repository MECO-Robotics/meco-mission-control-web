import { ManufacturingEditorModal } from "../modals/purchaseManufacturing/ManufacturingEditorModal";
import { PurchaseEditorModal } from "../modals/purchaseManufacturing/PurchaseEditorModal";
import { SubsystemEditorModal } from "../modals/structure/SubsystemEditorModal";
import { WorkstreamEditorModal } from "../modals/assetCatalog/WorkstreamEditorModal";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceStructureModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.subsystemModalMode && !props.workstreamModalMode && !props.manufacturingModalMode && !props.purchaseModalMode) {
    return null;
  }

  return (
    <>
      {props.subsystemModalMode ? (
        <SubsystemEditorModal
          activeSubsystemId={props.activeSubsystemId}
          bootstrap={props.bootstrap}
          closeSubsystemModal={props.closeSubsystemModal}
          handleToggleSubsystemArchived={props.handleToggleSubsystemArchived}
          handleSubsystemSubmit={props.handleSubsystemSubmit}
          isSavingSubsystem={props.isSavingSubsystem}
          requestPhotoUpload={props.requestPhotoUpload}
          subsystemDraft={props.subsystemDraft}
          subsystemDraftRisks={props.subsystemDraftRisks}
          subsystemModalMode={props.subsystemModalMode}
          setSubsystemDraft={props.setSubsystemDraft}
          setSubsystemDraftRisks={props.setSubsystemDraftRisks}
        />
      ) : null}

      {props.workstreamModalMode ? (
        <WorkstreamEditorModal
          activeWorkstreamId={props.activeWorkstreamId}
          bootstrap={props.bootstrap}
          closeWorkstreamModal={props.closeWorkstreamModal}
          handleToggleWorkstreamArchived={props.handleToggleWorkstreamArchived}
          handleWorkstreamSubmit={props.handleWorkstreamSubmit}
          isSavingWorkstream={props.isSavingWorkstream}
          setWorkstreamDraft={props.setWorkstreamDraft}
          workstreamDraft={props.workstreamDraft}
          workstreamModalMode={props.workstreamModalMode}
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
