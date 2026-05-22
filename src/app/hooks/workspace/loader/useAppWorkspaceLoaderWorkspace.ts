import { startTransition, useCallback } from "react";

import { fetchBootstrap } from "@/lib/auth/bootstrap";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { reconcileWorkspaceState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliation";
import type { AppWorkspaceLoaderModel, SelectMemberHandler, UnauthorizedHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import type { WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { getSinglePersonFilterId } from "@/app/state/workspaceMemberRoleUtils";
import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import type { WorkspaceLoadScope } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function useAppWorkspaceLoaderWorkspace(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  handleUnauthorized: UnauthorizedHandler,
  selectMember: SelectMemberHandler,
) {
  return useCallback(async (scope: WorkspaceLoadScope = {}) => {
    state.setIsLoadingData(true);
    state.setDataMessage(null);

    try {
      const personId =
        scope.personId === undefined
          ? getSinglePersonFilterId(model.activePersonFilter)
          : scope.personId;
      const seasonId =
        scope.seasonId === undefined ? model.selectedSeasonId : scope.seasonId;
      const projectId =
        scope.projectId === undefined ? model.selectedProjectId : scope.projectId;
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
        state as WorkspaceReconciliationState,
        model,
        payload,
        scopedPayload,
        selectMember,
      );
    } catch (error) {
      state.setDataMessage(error instanceof Error ? error.message : String(error));
    } finally {
      state.setIsLoadingData(false);
    }
  }, [handleUnauthorized, model, selectMember, state]);
}
