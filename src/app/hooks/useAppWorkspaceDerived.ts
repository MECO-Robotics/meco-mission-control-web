import { useAppWorkspaceDerivedSelection } from "@/app/hooks/workspace/derived/useAppWorkspaceDerivedSelection";
import { useAppWorkspaceDerivedWorkspace } from "@/app/hooks/workspace/derived/useAppWorkspaceDerivedWorkspace";
import { buildAppWorkspaceDerivedStateSlice } from "@/app/hooks/workspace/derived/buildAppWorkspaceDerivedStateSlice";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export type AppWorkspaceDerived = ReturnType<typeof useAppWorkspaceDerived>;

export function useAppWorkspaceDerived(state: AppWorkspaceState) {
  const selection = useAppWorkspaceDerivedSelection(state);
  const workspace = useAppWorkspaceDerivedWorkspace(state, selection);
  const stateSlice = buildAppWorkspaceDerivedStateSlice(state);

  return {
    ...stateSlice,
    ...selection,
    ...workspace,
    isMyViewActive:
      selection.signedInMember
        ? stateSlice.activePersonFilter.length === 1 &&
          stateSlice.activePersonFilter[0] === selection.signedInMember.id
        : stateSlice.isUnmatchedMyViewActive,
    toggleMyView: () => {
      const signedInMemberId = selection.signedInMember?.id;
      if (!signedInMemberId) {
        const nextIsActive = !stateSlice.isUnmatchedMyViewActive;
        stateSlice.setActivePersonFilter([]);
        stateSlice.setIsUnmatchedMyViewActive(nextIsActive);
        if (nextIsActive) {
          stateSlice.enqueueTaskEditNotice({
            title: "My View Notice",
            message: "No roster member is linked to this account yet.",
            tone: "info",
          });
        }
        return;
      }

      stateSlice.setIsUnmatchedMyViewActive(false);
      stateSlice.setDataMessage(null);
      stateSlice.setActivePersonFilter((current) =>
        current.length === 1 && current[0] === signedInMemberId
          ? []
          : [signedInMemberId],
      );
    },
  };
}
