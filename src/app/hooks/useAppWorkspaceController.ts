import { useManufacturingActions } from "@/app/workspaceCatalog/manufacturingActions";
import { usePurchaseActions } from "@/app/workspaceCatalog/purchaseActions";
import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const taskActions = useAppWorkspaceTaskActions(model);
  const reportActions = useAppWorkspaceReportActions(model);
  const catalogActions = {
    ...usePurchaseActions({
      activePurchaseId: model.activePurchaseId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      purchaseDraft: model.purchaseDraft,
      purchaseFinalCost: model.purchaseFinalCost,
      purchaseModalMode: model.purchaseModalMode,
      setActivePurchaseId: model.setActivePurchaseId,
      setDataMessage: model.setDataMessage,
      setIsSavingPurchase: model.setIsSavingPurchase,
      setPurchaseDraft: model.setPurchaseDraft,
      setPurchaseFinalCost: model.setPurchaseFinalCost,
      setPurchaseModalMode: model.setPurchaseModalMode,
    }),
    ...useManufacturingActions({
      activeManufacturingId: model.activeManufacturingId,
      bootstrap: model.bootstrap,
      handleUnauthorized: model.handleUnauthorized,
      loadWorkspace: model.loadWorkspace,
      manufacturingDraft: model.manufacturingDraft,
      manufacturingModalMode: model.manufacturingModalMode,
      setActiveManufacturingId: model.setActiveManufacturingId,
      setDataMessage: model.setDataMessage,
      setIsSavingManufacturing: model.setIsSavingManufacturing,
      setManufacturingDraft: model.setManufacturingDraft,
      setManufacturingModalMode: model.setManufacturingModalMode,
      signedInMember: model.signedInMember,
    }),
  };
  const rosterActions = useAppWorkspaceRosterActions(model);
  return { auth: model, model, taskActions, reportActions, catalogActions, rosterActions };
}

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;
