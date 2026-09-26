import { startTransition, useCallback } from "react";

import { fetchBootstrap } from "@/lib/auth/bootstrap";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { reconcileWorkspaceState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliation";
import type { SelectMemberHandler, UnauthorizedHandler, WorkspaceLoadScope } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { getSinglePersonFilterId } from "@/app/state/workspaceMemberRoleUtils";
import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";

export function useAppWorkspaceLoaderWorkspace(
  state: AppWorkspaceState,
  handleUnauthorized: UnauthorizedHandler,
  selectMember: SelectMemberHandler,
) {
  return useCallback(async (scope: WorkspaceLoadScope = {}) => {
    state.setIsLoadingData(true);
    state.setDataMessage(null);

    try {
      const personId =
        scope.personId === undefined
          ? getSinglePersonFilterId(state.activePersonFilter)
          : scope.personId;
      const seasonId =
        scope.seasonId === undefined ? state.selectedSeasonId : scope.seasonId;
      const projectId =
        scope.projectId === undefined ? state.selectedProjectId : scope.projectId;
      const payload = await fetchBootstrap(
        personId,
        seasonId,
        projectId,
        handleUnauthorized,
      );
      const scopedPayload = scopeBootstrapBySelection(
        payload,
        seasonId,
        projectId,
      );

      startTransition(() => {
        state.setBootstrap(payload);
      });

      reconcileWorkspaceState(
        state,
        payload,
        scopedPayload,
        selectMember,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      state.setDataMessage(error instanceof Error ? error.message : String(error));
    } finally {
      state.setIsLoadingData(false);
    }
  }, [handleUnauthorized, selectMember, state]);
}
