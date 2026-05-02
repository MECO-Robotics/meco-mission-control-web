import type { BootstrapPayload } from "@/types";

import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import {
  reconcileActivePersonFilter,
  reconcileArtifactModal,
  reconcileMechanismModal,
  reconcileManufacturingModal,
  reconcileMaterialModal,
  reconcilePartDefinitionModal,
  reconcilePartInstanceModal,
  reconcilePurchaseModal,
  reconcileSubsystemModal,
  reconcileTaskModal,
  reconcileWorkLogAndReports,
  reconcileWorkstreamModal,
} from "@/app/hooks/useAppWorkspaceLoaderWorkspaceReconciliationHelpers";
import {
  type AppWorkspaceLoaderModel,
  type SelectMemberHandler,
} from "@/app/hooks/useAppWorkspaceLoaderWorkspaceTypes";
import { findMemberForSessionUser } from "@/lib/appUtils";

export function reconcileWorkspaceState(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
  scopedPayload: BootstrapPayload,
  selectMember: SelectMemberHandler,
) {
  const signedInScopedMember = findMemberForSessionUser(scopedPayload.members, model.sessionUser);
  const nextMemberId =
    model.selectedMemberId &&
    scopedPayload.members.some((member) => member.id === model.selectedMemberId)
      ? model.selectedMemberId
      : scopedPayload.members[0]?.id ?? null;

  reconcileActivePersonFilter(state, model, scopedPayload);
  selectMember(nextMemberId, scopedPayload);
  reconcileTaskModal(state, model, scopedPayload, payload);
  reconcilePurchaseModal(state, model, payload);
  reconcileManufacturingModal(state, model, payload, signedInScopedMember?.id ?? null);
  reconcileMaterialModal(state, model, payload);
  reconcilePartDefinitionModal(state, model, payload);
  reconcileArtifactModal(state, model, scopedPayload, payload);
  reconcileWorkstreamModal(state, model, scopedPayload);
  reconcilePartInstanceModal(state, model, payload);
  reconcileSubsystemModal(state, model, scopedPayload);
  reconcileMechanismModal(state, model, scopedPayload);
  reconcileWorkLogAndReports(state, model, scopedPayload);
}
