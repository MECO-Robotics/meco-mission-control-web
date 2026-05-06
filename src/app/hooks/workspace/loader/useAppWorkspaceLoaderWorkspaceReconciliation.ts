import type { BootstrapPayload } from "@/types/bootstrap";

import { reconcileActivePersonFilter } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationSelection";
import { reconcileArtifactModal, reconcileMaterialModal, reconcileMechanismModal, reconcilePartDefinitionModal, reconcilePartInstanceModal, reconcileSubsystemModal, reconcileWorkstreamModal } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationModalsCatalog";
import { reconcileManufacturingModal, reconcilePurchaseModal, reconcileTaskModal } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationModalsTaskPurchaseManufacturing";
import { reconcileWorkLogAndReports } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationReports";
import {
  type AppWorkspaceLoaderModel,
  type SelectMemberHandler,
  type WorkspaceReconciliationState,
} from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { findMemberForSessionUser } from "@/lib/appUtils/common";

export function reconcileWorkspaceState(
  state: WorkspaceReconciliationState,
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
