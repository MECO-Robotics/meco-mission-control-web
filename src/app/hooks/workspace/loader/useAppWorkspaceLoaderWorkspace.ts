import { startTransition, useCallback } from "react";

import { fetchBootstrap } from "@/lib/auth/bootstrap";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { reconcileWorkspaceState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliation";
import type { AppWorkspaceLoaderModel, SelectMemberHandler, UnauthorizedHandler } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import type { WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { getSinglePersonFilterId } from "@/app/state/workspaceMemberRoleUtils";
import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";

export function useAppWorkspaceLoaderWorkspace(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  handleUnauthorized: UnauthorizedHandler,
  selectMember: SelectMemberHandler,
) {
  return useCallback(async () => {
    state.setIsLoadingData(true);
    state.setDataMessage(null);

    try {
      const payload = await fetchBootstrap(
        getSinglePersonFilterId(model.activePersonFilter),
        model.selectedSeasonId,
        model.selectedProjectId,
        handleUnauthorized,
      );
      const scopedPayload = scopeBootstrapBySelection(
        payload,
        model.selectedSeasonId,
        model.selectedProjectId,
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
  }, [
    handleUnauthorized,
    model.activeArtifactId,
    model.activeMechanismId,
    model.activePersonFilter,
    model.activePartDefinitionId,
    model.activePartInstanceId,
    model.activePurchaseId,
    model.activeSubsystemId,
    model.activeTaskId,
    model.artifactDraft.kind,
    model.artifactModalMode,
    model.milestoneReportModalMode,
    model.manufacturingModalMode,
    model.materialModalMode,
    model.mechanismModalMode,
    model.partDefinitionModalMode,
    model.partInstanceModalMode,
    model.purchaseModalMode,
    model.qaReportModalMode,
    model.selectedMemberId,
    model.selectedProjectId,
    model.selectedSeasonId,
    model.sessionUser,
    model.subsystemModalMode,
    model.taskModalMode,
    model.workLogModalMode,
    model.workstreamModalMode,
    selectMember,
    state,
  ]);
}
