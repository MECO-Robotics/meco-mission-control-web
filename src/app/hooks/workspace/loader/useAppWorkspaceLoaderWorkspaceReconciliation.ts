import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types/bootstrap";

import { reconcileActivePersonFilter } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationSelection";
import { reconcileManufacturingModal, reconcilePurchaseModal, reconcileTaskModal } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationModalsTaskPurchaseManufacturing";
import { reconcileWorkLogAndReports } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationReports";
import type { SelectMemberHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { findMemberForSessionUser } from "@/lib/appUtils/common";

export function reconcileWorkspaceState(
  state: AppWorkspaceState,
  payload: BootstrapPayload,
  scopedPayload: BootstrapPayload,
  selectMember: SelectMemberHandler,
) {
  const signedInScopedMember = findMemberForSessionUser(scopedPayload.members, state.sessionUser);
  const nextMemberId =
    state.selectedMemberId &&
    scopedPayload.members.some((member) => member.id === state.selectedMemberId)
      ? state.selectedMemberId
      : scopedPayload.members[0]?.id ?? null;

  reconcileActivePersonFilter(state, scopedPayload);
  selectMember(nextMemberId, scopedPayload);
  reconcileTaskModal(state, scopedPayload, payload);
  reconcilePurchaseModal(state, payload);
  reconcileManufacturingModal(state, payload, signedInScopedMember?.id ?? null);
  reconcileWorkLogAndReports(state, scopedPayload);
}
