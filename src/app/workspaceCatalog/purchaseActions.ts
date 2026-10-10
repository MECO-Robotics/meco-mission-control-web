import { useCallback, useState } from "react";

import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import { purchaseToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPurchaseItemRecord, updatePurchaseItemRecord, transitionPurchaseItemRecord, approvePurchaseItemRecord } from "@/lib/auth/records/production";
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
    acknowledgeCreate,
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
      const task = bootstrap.tasks.find((candidate) => candidate.id === purchaseDraft.taskId);
      if (!task) {
        setDataMessage("Choose the Kanban Task that represents this procurement work.");
        return;
      }
      const project = bootstrap.projects.find((candidate) => candidate.id === task.projectId);
      const workType = bootstrap.workTypes.find((candidate) => candidate.id === task.workTypeId);
      const isManufacturingTask = project?.projectType === "robot" && workType?.code === "manufacturing";
      if (purchaseDraft.kind === "manufacturing-service" && (!isManufacturingTask || !task.manufacturingDetails)) {
        setDataMessage("Outsourced manufacturing purchases must link to a Robot Manufacturing Task with technical manufacturing details.");
        return;
      }
      if (purchaseDraft.kind === "cots-goods" && task.manufacturingDetails) {
        setDataMessage("COTS purchases use Purchasing only. Choose a procurement Task without Manufacturing Details.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
        title: purchaseDraft.title.trim(),
        approvalStatus: "pending", approvedById: null, approvedAt: null,
        orderStatus: "not-ordered", purchaseOrderNumber: null, finalCost: null, orderedAt: null, deliveredAt: null,
      };

      const desiredFinalCost = purchaseFinalCost.trim().length > 0
        ? { amount: Number(purchaseFinalCost), currency: purchaseDraft.finalCost ? purchaseDraft.finalCost.currency : "USD" }
        : null;
      if (desiredFinalCost && (!Number.isFinite(desiredFinalCost.amount) || desiredFinalCost.amount < 0)) {
        setDataMessage("Final cost must be a nonnegative number.");
        return;
      }
      let saved: PurchaseItemRecord;
      if (purchaseModalMode === "create") {
        saved = await createPurchaseItemRecord(payload, handleUnauthorized);
        if (operation.isCurrent()) acknowledgeCreate(saved.id);
      } else if (activePurchaseId) {
        const commercial: Partial<PurchaseItemPayload> = { ...payload };
        for (const field of ["approvalStatus", "approvedById", "approvedAt", "orderStatus", "purchaseOrderNumber", "finalCost", "orderedAt", "deliveredAt"] as const) delete commercial[field];
        saved = await updatePurchaseItemRecord(activePurchaseId, commercial, handleUnauthorized);
      } else return;
      try {
        if (saved.approvalStatus !== purchaseDraft.approvalStatus) saved = await approvePurchaseItemRecord(saved.id, purchaseDraft.approvalStatus, handleUnauthorized);
        if (saved.orderStatus !== purchaseDraft.orderStatus || saved.purchaseOrderNumber !== purchaseDraft.purchaseOrderNumber || JSON.stringify(saved.finalCost) !== JSON.stringify(desiredFinalCost)) {
          saved = await transitionPurchaseItemRecord(saved.id, { orderStatus: purchaseDraft.orderStatus, finalCost: desiredFinalCost, purchaseOrderNumber: purchaseDraft.purchaseOrderNumber }, handleUnauthorized);
        }
      } catch (error) {
        await operation.refresh();
        throw error;
      }
      if (operation.isCurrent()) setPurchaseDraft(purchaseToPayload(saved));

      await operation.refresh();
      if (operation.isCurrent()) closePurchaseModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activePurchaseId, bootstrap, closePurchaseModal, handleUnauthorized, purchaseDraft, purchaseFinalCost, purchaseModalMode, setDataMessage, beginOperation, acknowledgeCreate, setPurchaseDraft]);

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
