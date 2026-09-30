import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types/bootstrap";

import { reconcileActivePersonFilter } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationSelection";
import { reconcileWorkLogAndReports } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliationReports";
import type { SelectMemberHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileWorkspaceState(
  state: AppWorkspaceState,
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
  reconcileWorkLogAndReports(state, scopedPayload);
}
