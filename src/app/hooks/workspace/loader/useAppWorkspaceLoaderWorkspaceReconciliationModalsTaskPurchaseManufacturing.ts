import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import { buildEmptyPurchasePayload } from "@/lib/appUtils/payloadBuilders";
import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";
import { manufacturingToPayload, purchaseToPayload } from "@/lib/appUtils/payloadConversions";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function reconcileTaskModal(
  state: AppWorkspaceState,
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
  if (state.taskModalMode === "create") {
    state.setTaskDraft(buildEmptyTaskPayload(scopedPayload));
  }

  if (state.taskModalMode === "edit" && state.activeTaskId) {
    const nextTask = payload.tasks.find((task) => task.id === state.activeTaskId);
    if (nextTask) {
      state.setTaskDraft(taskToPayload(nextTask, scopedPayload));
    } else {
      state.setTaskModalMode(null);
      state.setActiveTaskId(null);
    }
  }
}

export function reconcilePurchaseModal(
  state: AppWorkspaceState,
  payload: BootstrapPayload,
) {
  if (state.purchaseModalMode === "create") {
    state.setPurchaseDraft(buildEmptyPurchasePayload(payload));
    state.setPurchaseFinalCost("");
  }

  if (state.purchaseModalMode === "edit" && state.activePurchaseId) {
    const nextItem = payload.purchaseItems.find((item) => item.id === state.activePurchaseId);
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
  state: AppWorkspaceState,
  payload: BootstrapPayload,
  signedInScopedMemberId: string | null,
) {
  if (state.manufacturingModalMode === "create") {
    state.setManufacturingDraft((current: ManufacturingItemPayload) =>
      buildEmptyManufacturingPayload(
        payload,
        current.process,
        current.process === "cnc" ? signedInScopedMemberId : null,
      ),
    );
  }

  if (state.manufacturingModalMode === "edit" && state.activeManufacturingId) {
    const nextItem = payload.manufacturingItems.find(
      (item) => item.id === state.activeManufacturingId,
    );
    if (nextItem) {
      state.setManufacturingDraft(manufacturingToPayload(nextItem));
    } else {
      state.setManufacturingModalMode(null);
      state.setActiveManufacturingId(null);
    }
  }
}
