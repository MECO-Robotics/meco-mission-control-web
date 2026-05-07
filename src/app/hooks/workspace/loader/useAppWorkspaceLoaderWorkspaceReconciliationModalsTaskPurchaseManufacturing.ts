import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";
import { manufacturingToPayload, purchaseToPayload } from "@/lib/appUtils/payloadConversions";
import type { AppWorkspaceLoaderModel, WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileTaskModal(
  state: WorkspaceReconciliationState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
  if (model.taskModalMode === "create") {
    state.setTaskDraft(buildEmptyTaskPayload(scopedPayload));
  }

  if (model.taskModalMode === "edit" && model.activeTaskId) {
    const nextTask = payload.tasks.find((task) => task.id === model.activeTaskId);
    if (nextTask) {
      state.setTaskDraft(taskToPayload(nextTask, scopedPayload));
    } else {
      state.setTaskModalMode(null);
      state.setActiveTaskId(null);
    }
  }
}

export function reconcilePurchaseModal(
  state: WorkspaceReconciliationState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
) {
  if (model.purchaseModalMode === "create") {
    state.setPurchaseDraft(buildEmptyPurchasePayload(payload));
    state.setPurchaseFinalCost("");
  }

  if (model.purchaseModalMode === "edit" && model.activePurchaseId) {
    const nextItem = payload.purchaseItems.find((item) => item.id === model.activePurchaseId);
    if (nextItem) {
      state.setPurchaseDraft(purchaseToPayload(nextItem));
      state.setPurchaseFinalCost(
        typeof nextItem.finalCost === "number" ? String(nextItem.finalCost) : "",
      );
    } else {
      state.setPurchaseModalMode(null);
      state.setActivePurchaseId(null);
    }
  }
}

export function reconcileManufacturingModal(
  state: WorkspaceReconciliationState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
  signedInScopedMemberId: string | null,
) {
  if (model.manufacturingModalMode === "create") {
    state.setManufacturingDraft((current: ManufacturingItemPayload) =>
      buildEmptyManufacturingPayload(
        payload,
        current.process,
        current.process === "cnc" ? signedInScopedMemberId : null,
      ),
    );
  }

  if (model.manufacturingModalMode === "edit" && model.activeManufacturingId) {
    const nextItem = payload.manufacturingItems.find(
      (item) => item.id === model.activeManufacturingId,
    );
    if (nextItem) {
      state.setManufacturingDraft(manufacturingToPayload(nextItem));
    } else {
      state.setManufacturingModalMode(null);
      state.setActiveManufacturingId(null);
    }
  }
}
