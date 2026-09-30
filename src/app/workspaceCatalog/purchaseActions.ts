import { useCallback, useState } from "react";

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
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";

export function usePurchaseActions({ bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, selectedProjectId, selectedSeasonId }: {
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setDataMessage: (message: string | null) => void;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
}) {
  const [purchaseFinalCost, setPurchaseFinalCost] = useState("");
  const { beginOperation, resetEditor, isSaving: isSavingPurchase } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreatePurchaseDraft = useCallback(() => buildEmptyPurchasePayload(bootstrap), [bootstrap]);
  const {
    modalMode: purchaseModalMode,
    activeRecordId: activePurchaseId,
    draft: purchaseDraft,
    setDraft: setPurchaseDraft,
    openCreate: openCreatePurchaseModal,
    openEdit: openEditPurchaseModal,
    close: closePurchaseModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreatePurchaseDraft,
    makeInitialDraft: () => buildEmptyPurchasePayload(EMPTY_BOOTSTRAP),
    records: bootstrap.purchaseItems,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: purchaseToPayload,
  });
  const openCreatePurchaseModalAndResetFinalCost = useCallback(() => {
    openCreatePurchaseModal();
    setPurchaseFinalCost("");
  }, [openCreatePurchaseModal]);

  const openEditPurchaseModalAndSetFinalCost = useCallback((item: PurchaseItemRecord) => {
    openEditPurchaseModal(item);
    setPurchaseFinalCost(item.finalCost ? String(item.finalCost.amount) : "");
  }, [openEditPurchaseModal]);

  const handlePurchaseSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!purchaseModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      if (!bootstrap.tasks.some((task) => task.id === purchaseDraft.taskId)) {
        setDataMessage("Choose the Kanban Task that represents this procurement work.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
        title: purchaseDraft.title.trim(),
        finalCost: purchaseFinalCost.trim().length > 0
          ? { amount: Number(purchaseFinalCost), currency: "USD" }
          : null,
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
    openCreatePurchaseModal: openCreatePurchaseModalAndResetFinalCost,
    openEditPurchaseModal: openEditPurchaseModalAndSetFinalCost,
  };
}
