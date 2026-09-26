import { useAppWorkspaceDerivedSelection } from "@/app/hooks/workspace/derived/useAppWorkspaceDerivedSelection";
import { useAppWorkspaceDerivedWorkspace } from "@/app/hooks/workspace/derived/useAppWorkspaceDerivedWorkspace";
import { getRosterLinkedMemberId } from "@/lib/appUtils/common";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export type AppWorkspaceDerived = ReturnType<typeof useAppWorkspaceDerived>;

export function useAppWorkspaceDerived(state: AppWorkspaceState) {
  const selection = useAppWorkspaceDerivedSelection(state);
  const workspace = useAppWorkspaceDerivedWorkspace(state, selection);
  const rosterLinkedSignedInMemberId = getRosterLinkedMemberId(
    selection.scopedBootstrap.members,
    selection.signedInMember,
  );

  return {
    ...selection,
    ...workspace,
    isMyViewActive:
      rosterLinkedSignedInMemberId
        ? state.activePersonFilter.length === 1 &&
          state.activePersonFilter[0] === rosterLinkedSignedInMemberId
        : state.isUnmatchedMyViewActive,
    toggleMyView: () => {
      if (!rosterLinkedSignedInMemberId) {
        const nextIsActive = !state.isUnmatchedMyViewActive;
        state.setActivePersonFilter([]);
        state.setIsUnmatchedMyViewActive(nextIsActive);
        if (nextIsActive) {
          state.enqueueTaskEditNotice({
            title: "My View Notice",
            message: "No roster member is linked to this account yet.",
            tone: "info",
          });
        }
        return;
      }

      state.setIsUnmatchedMyViewActive(false);
      state.setDataMessage(null);
      state.setActivePersonFilter((current) =>
        current.length === 1 && current[0] === rosterLinkedSignedInMemberId
          ? []
          : [rosterLinkedSignedInMemberId],
      );
    },
  };
}
