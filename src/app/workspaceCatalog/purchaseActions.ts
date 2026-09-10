import { useCallback } from "react";

import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import { purchaseToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPurchaseItemRecord, updatePurchaseItemRecord } from "@/lib/auth/records/production";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { PurchaseItemPayload } from "@/types/payloads";
import type { PurchaseItemRecord } from "@/types/recordsInventory";

export type PurchaseActions = ReturnType<typeof usePurchaseActions>;

export function usePurchaseActions({
  activePurchaseId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  purchaseDraft,
  purchaseFinalCost,
  purchaseModalMode,
  setActivePurchaseId,
  setDataMessage,
  setIsSavingPurchase,
  setPurchaseDraft,
  setPurchaseFinalCost,
  setPurchaseModalMode,
}: {
  activePurchaseId: AppWorkspaceModel["activePurchaseId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  purchaseDraft: AppWorkspaceModel["purchaseDraft"];
  purchaseFinalCost: AppWorkspaceModel["purchaseFinalCost"];
  purchaseModalMode: AppWorkspaceModel["purchaseModalMode"];
  setActivePurchaseId: AppWorkspaceModel["setActivePurchaseId"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsSavingPurchase: AppWorkspaceModel["setIsSavingPurchase"];
  setPurchaseDraft: AppWorkspaceModel["setPurchaseDraft"];
  setPurchaseFinalCost: AppWorkspaceModel["setPurchaseFinalCost"];
  setPurchaseModalMode: AppWorkspaceModel["setPurchaseModalMode"];
}) {
  const openCreatePurchaseModal = useCallback(() => {
    setActivePurchaseId(null);
    setPurchaseDraft(buildEmptyPurchasePayload(bootstrap));
    setPurchaseFinalCost("");
    setPurchaseModalMode("create");
  }, [bootstrap, setActivePurchaseId, setPurchaseDraft, setPurchaseFinalCost, setPurchaseModalMode]);

  const openEditPurchaseModal = useCallback((item: PurchaseItemRecord) => {
    setActivePurchaseId(item.id);
    setPurchaseDraft(purchaseToPayload(item));
    setPurchaseFinalCost(typeof item.finalCost === "number" ? String(item.finalCost) : "");
    setPurchaseModalMode("edit");
  }, [setActivePurchaseId, setPurchaseDraft, setPurchaseFinalCost, setPurchaseModalMode]);

  const closePurchaseModal = useCallback(() => {
    setPurchaseModalMode(null);
    setActivePurchaseId(null);
  }, [setActivePurchaseId, setPurchaseModalMode]);

  const handlePurchaseSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingPurchase(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === purchaseDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the purchase.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
        title: selectedPartDefinition.name,
        finalCost:
          purchaseFinalCost.trim().length > 0 ? Number(purchaseFinalCost) : undefined,
      };

      if (purchaseModalMode === "create") {
        await createPurchaseItemRecord(payload, handleUnauthorized);
      } else if (purchaseModalMode === "edit" && activePurchaseId) {
        await updatePurchaseItemRecord(activePurchaseId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closePurchaseModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPurchase(false);
    }
  }, [activePurchaseId, bootstrap, closePurchaseModal, handleUnauthorized, loadWorkspace, purchaseDraft, purchaseFinalCost, purchaseModalMode, setDataMessage, setIsSavingPurchase]);

  return {
    closePurchaseModal,
    handlePurchaseSubmit,
    openCreatePurchaseModal,
    openEditPurchaseModal,
  };
}
