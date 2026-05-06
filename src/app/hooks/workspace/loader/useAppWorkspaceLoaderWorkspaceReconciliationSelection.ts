import type { BootstrapPayload } from "@/types/bootstrap";

import type { AppWorkspaceLoaderModel, WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileActivePersonFilter(
  state: WorkspaceReconciliationState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
  if (model.activePersonFilter.length === 0) {
    return;
  }

  const scopedMemberIds = new Set(scopedPayload.members.map((member) => member.id));
  const nextPersonFilter = model.activePersonFilter.filter((memberId) =>
    scopedMemberIds.has(memberId),
  );

  if (nextPersonFilter.length !== model.activePersonFilter.length) {
    state.setActivePersonFilter(nextPersonFilter);
  }
}
