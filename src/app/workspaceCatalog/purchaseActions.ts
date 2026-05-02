// @ts-nocheck
import { useCallback } from "react";

import { buildEmptyPurchasePayload, purchaseToPayload, toErrorMessage } from "@/lib/appUtils";
import { createPurchaseItemRecord, updatePurchaseItemRecord } from "@/lib/auth";
import type { AppWorkspaceModel } from "../useAppWorkspaceModel";
import type { PurchaseItemPayload, PurchaseItemRecord } from "@/types";

export type PurchaseActions = ReturnType<typeof usePurchaseActions>;

export function usePurchaseActions(model: AppWorkspaceModel) {
  const openCreatePurchaseModal = useCallback(() => {
    model.setActivePurchaseId(null);
    model.setPurchaseDraft(buildEmptyPurchasePayload(model.bootstrap));
    model.setPurchaseFinalCost("");
    model.setPurchaseModalMode("create");
  }, [model]);

  const openEditPurchaseModal = useCallback((item: PurchaseItemRecord) => {
    model.setActivePurchaseId(item.id);
    model.setPurchaseDraft(purchaseToPayload(item));
    model.setPurchaseFinalCost(typeof item.finalCost === "number" ? String(item.finalCost) : "");
    model.setPurchaseModalMode("edit");
  }, [model]);

  const closePurchaseModal = useCallback(() => {
    model.setPurchaseModalMode(null);
    model.setActivePurchaseId(null);
  }, [model]);

  const handlePurchaseSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    model.setIsSavingPurchase(true);
    model.setDataMessage(null);

    try {
      const selectedPartDefinition = model.bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === model.purchaseDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        model.setDataMessage("Please choose a real part from the Parts tab before saving the purchase.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...model.purchaseDraft,
        title: selectedPartDefinition.name,
        finalCost:
          model.purchaseFinalCost.trim().length > 0 ? Number(model.purchaseFinalCost) : undefined,
      };

      if (model.purchaseModalMode === "create") {
        await createPurchaseItemRecord(payload, model.handleUnauthorized);
      } else if (model.purchaseModalMode === "edit" && model.activePurchaseId) {
        await updatePurchaseItemRecord(model.activePurchaseId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closePurchaseModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingPurchase(false);
    }
  }, [closePurchaseModal, model]);

  return {
    closePurchaseModal,
    handlePurchaseSubmit,
    openCreatePurchaseModal,
    openEditPurchaseModal,
  };
}
