import type { BootstrapPayload } from "@/types/bootstrap";

import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function reconcileActivePersonFilter(
  state: AppWorkspaceState,
  scopedPayload: BootstrapPayload,
) {
  if (state.activePersonFilter.length === 0) {
    return;
  }

  const scopedMemberIds = new Set(scopedPayload.members.map((member) => member.id));
  const nextPersonFilter = state.activePersonFilter.filter((memberId) =>
    scopedMemberIds.has(memberId),
  );

  if (nextPersonFilter.length !== state.activePersonFilter.length) {
    state.setActivePersonFilter(nextPersonFilter);
  }
}
