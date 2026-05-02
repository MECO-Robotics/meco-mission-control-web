// @ts-nocheck
import { useAppWorkspaceDerivedSelection } from "@/app/hooks/useAppWorkspaceDerivedSelection";
import { useAppWorkspaceDerivedWorkspace } from "@/app/hooks/useAppWorkspaceDerivedWorkspace";
import { buildAppWorkspaceDerivedStateSlice } from "@/app/hooks/buildAppWorkspaceDerivedStateSlice";
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
      Boolean(selection.signedInMember) &&
      stateSlice.activePersonFilter.length === 1 &&
      stateSlice.activePersonFilter[0] === selection.signedInMember?.id,
    toggleMyView: () => {
      if (!selection.signedInMember) {
        return;
      }

      stateSlice.setDataMessage(null);
      stateSlice.setActivePersonFilter((current) =>
        current.length === 1 && current[0] === selection.signedInMember?.id
          ? []
          : [selection.signedInMember.id],
      );
    },
  };
}
