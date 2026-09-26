import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types/bootstrap";

import { reconcileActivePersonFilter } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationSelection";
import { reconcileTaskModal } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationTask";
import { reconcileWorkLogAndReports } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationReports";
import type { SelectMemberHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileWorkspaceState(
  state: AppWorkspaceState,
  payload: BootstrapPayload,
  scopedPayload: BootstrapPayload,
  selectMember: SelectMemberHandler,
) {
  const nextMemberId =
    state.selectedMemberId &&
    scopedPayload.members.some((member) => member.id === state.selectedMemberId)
      ? state.selectedMemberId
      : scopedPayload.members[0]?.id ?? null;

  reconcileActivePersonFilter(state, scopedPayload);
  selectMember(nextMemberId, scopedPayload);
  reconcileTaskModal(state, scopedPayload, payload);
  reconcileWorkLogAndReports(state, scopedPayload);
}
