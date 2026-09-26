import { useCallback, useState, useEffect } from "react";

import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import { purchaseToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPurchaseItemRecord, updatePurchaseItemRecord } from "@/lib/auth/records/production";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { PurchaseItemPayload } from "@/types/payloads";
import type { PurchaseItemRecord } from "@/types/recordsInventory";

export function usePurchaseActions({ bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, selectedProjectId, selectedSeasonId }: {
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setDataMessage: (message: string | null) => void;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
}) {
  const [purchaseModalMode, setPurchaseModalMode] = useState<"create" | "edit" | null>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseItemPayload>(
    buildEmptyPurchasePayload(EMPTY_BOOTSTRAP),
  );
  const [purchaseFinalCost, setPurchaseFinalCost] = useState("");
  const { beginOperation, resetEditor, isSaving: isSavingPurchase } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreatePurchaseModal = useCallback(() => {
    resetEditor();
    setActivePurchaseId(null);
    setPurchaseDraft(buildEmptyPurchasePayload(bootstrap));
    setPurchaseFinalCost("");
    setPurchaseModalMode("create");
  }, [bootstrap, resetEditor]);

  const openEditPurchaseModal = useCallback((item: PurchaseItemRecord) => {
    resetEditor();
    setActivePurchaseId(item.id);
    setPurchaseDraft(purchaseToPayload(item));
    setPurchaseFinalCost(typeof item.finalCost === "number" ? String(item.finalCost) : "");
    setPurchaseModalMode("edit");
  }, [resetEditor]);

  const closePurchaseModal = useCallback(() => {
    resetEditor();
    setPurchaseModalMode(null);
    setActivePurchaseId(null);
  }, [resetEditor]);

  useEffect(() => closePurchaseModal(), [closePurchaseModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (purchaseModalMode === "edit" && !bootstrap.purchaseItems.some((item) => item.id === activePurchaseId))) {
      closePurchaseModal();
    }
  }, [activePurchaseId, bootstrap, closePurchaseModal, purchaseModalMode]);

  const handlePurchaseSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!purchaseModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
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

      await operation.refresh();
      if (operation.isCurrent()) closePurchaseModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activePurchaseId, bootstrap, closePurchaseModal, handleUnauthorized, purchaseDraft, purchaseFinalCost, purchaseModalMode, setDataMessage, beginOperation]);

  return {
    purchaseModalMode,
    activePurchaseId,
    purchaseDraft,
    purchaseFinalCost,
    setPurchaseDraft,
    isSavingPurchase,
    setPurchaseFinalCost,
    closePurchaseModal,
    handlePurchaseSubmit,
    openCreatePurchaseModal,
    openEditPurchaseModal,
  };
}
