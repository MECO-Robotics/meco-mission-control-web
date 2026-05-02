// @ts-nocheck
import { startTransition, useCallback } from "react";

import {
  buildEmptyArtifactPayload,
  buildEmptyMechanismPayload,
  buildEmptyManufacturingPayload,
  buildEmptyMaterialPayload,
  buildEmptyPartDefinitionPayload,
  buildEmptyPartInstancePayload,
  buildEmptyPurchasePayload,
  buildEmptyQaReportPayload,
  buildEmptySubsystemPayload,
  buildEmptyTaskPayload,
  buildEmptyTestResultPayload,
  buildEmptyWorkLogPayload,
  buildEmptyWorkstreamPayload,
  artifactToPayload,
  findMemberForSessionUser,
  manufacturingToPayload,
  materialToPayload,
  partDefinitionToPayload,
  partInstanceToPayload,
  purchaseToPayload,
  subsystemToPayload,
  taskToPayload,
  workstreamToPayload,
} from "@/lib/appUtils";
import { fetchBootstrap, requestImageUpload, requestVideoUpload } from "@/lib/auth";
import type { BootstrapPayload, MechanismPayload } from "@/types";
import type { AppWorkspaceState } from "@/app/useAppWorkspaceState";
import type { AppWorkspaceDerived } from "@/app/useAppWorkspaceDerived";
import { getSinglePersonFilterId, scopeBootstrapBySelection } from "@/app/workspaceStateUtils";

export type AppWorkspaceLoader = ReturnType<typeof useAppWorkspaceLoader>;

export function useAppWorkspaceLoader(
  state: AppWorkspaceState,
  model: AppWorkspaceState & AppWorkspaceDerived,
) {
  const handleUnauthorized = useCallback(() => {
    state.expireSession("Your session expired. Please sign in again.");
    state.setDataMessage("Your session expired. Please sign in again.");
  }, [state]);

  const requestPhotoUpload = useCallback(
    (projectId: string, file: File) =>
      file.type.startsWith("video/")
        ? requestVideoUpload(projectId, file, handleUnauthorized)
        : requestImageUpload(projectId, file, handleUnauthorized),
    [handleUnauthorized],
  );

  const requestMemberPhotoUpload = useCallback(
    (file: File) => {
      const projectId =
        model.selectedProjectId ??
        model.bootstrap.projects.find((project) => project.seasonId === model.selectedSeasonId)?.id ??
        model.bootstrap.projects[0]?.id ??
        null;

      if (!projectId) {
        return Promise.reject(new Error("No project is available for photo upload."));
      }

      return requestPhotoUpload(projectId, file);
    },
    [model.bootstrap.projects, model.selectedProjectId, model.selectedSeasonId, requestPhotoUpload],
  );

  const clearDataMessage = useCallback(() => {
    state.setDataMessage(null);
  }, [state]);

  const clearTaskEditNotice = useCallback(() => {
    state.setTaskEditNotice(null);
  }, [state]);

  const notifyTaskEditCanceled = useCallback(() => {
    state.setTaskEditNotice("Task edit canceled. Unsaved changes were discarded.");
  }, [state]);

  const selectMember = useCallback((memberId: string | null, payload: BootstrapPayload) => {
    const member = payload.members.find((candidate) => candidate.id === memberId) ?? null;
    state.setSelectedMemberId(member?.id ?? null);
    state.setMemberEditDraft(
      member
        ? {
            name: member.name,
            email: member.email,
            photoUrl: member.photoUrl ?? "",
            role: member.role,
            elevated: member.elevated,
          }
        : null,
    );
  }, [state]);

  const toggleMyView = useCallback(() => {
    if (!model.signedInMember) {
      return;
    }

    state.setDataMessage(null);
    state.setActivePersonFilter((current) =>
      current.length === 1 && current[0] === model.signedInMember?.id
        ? []
        : [model.signedInMember?.id ?? ""],
    );
  }, [model.signedInMember, state]);

  const loadWorkspace = useCallback(async () => {
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
      const signedInScopedMember = findMemberForSessionUser(
        scopedPayload.members,
        model.sessionUser,
      );
      const nextArtifacts = payload.artifacts;
      const nextMemberId =
        model.selectedMemberId &&
        scopedPayload.members.some((member) => member.id === model.selectedMemberId)
          ? model.selectedMemberId
          : scopedPayload.members[0]?.id ?? null;

      startTransition(() => {
        state.setBootstrap(payload);
      });

      if (model.activePersonFilter.length > 0) {
        const scopedMemberIds = new Set(scopedPayload.members.map((member) => member.id));
        const nextPersonFilter = model.activePersonFilter.filter((memberId) =>
          scopedMemberIds.has(memberId),
        );
        if (nextPersonFilter.length !== model.activePersonFilter.length) {
          state.setActivePersonFilter(nextPersonFilter);
        }
      }

      selectMember(nextMemberId, scopedPayload);

      if (model.taskModalMode === "create") {
        state.setTaskDraft(buildEmptyTaskPayload(scopedPayload));
      }

      if (model.taskModalMode === "edit" && model.activeTaskId) {
        const nextTask = payload.tasks.find((task) => task.id === model.activeTaskId);
        if (nextTask) {
          state.setTaskDraft(taskToPayload(nextTask, scopedPayload));
        } else {
          state.setTaskModalMode(null);
          state.setActiveTaskId(null);
        }
      }

      if (model.purchaseModalMode === "create") {
        state.setPurchaseDraft(buildEmptyPurchasePayload(payload));
        state.setPurchaseFinalCost("");
      }

      if (model.purchaseModalMode === "edit" && model.activePurchaseId) {
        const nextItem = payload.purchaseItems.find((item) => item.id === model.activePurchaseId);
        if (nextItem) {
          state.setPurchaseDraft(purchaseToPayload(nextItem));
          state.setPurchaseFinalCost(
            typeof nextItem.finalCost === "number" ? String(nextItem.finalCost) : "",
          );
        } else {
          state.setPurchaseModalMode(null);
          state.setActivePurchaseId(null);
        }
      }

      if (model.manufacturingModalMode === "create") {
        state.setManufacturingDraft((current) =>
          buildEmptyManufacturingPayload(
            payload,
            current.process,
            current.process === "cnc" ? signedInScopedMember?.id ?? null : null,
          ),
        );
      }

      if (model.manufacturingModalMode === "edit" && model.activeManufacturingId) {
        const nextItem = payload.manufacturingItems.find(
          (item) => item.id === model.activeManufacturingId,
        );
        if (nextItem) {
          state.setManufacturingDraft(manufacturingToPayload(nextItem));
        } else {
          state.setManufacturingModalMode(null);
          state.setActiveManufacturingId(null);
        }
      }

      if (model.materialModalMode === "create") {
        state.setMaterialDraft(buildEmptyMaterialPayload());
      }

      if (model.materialModalMode === "edit" && model.activeMaterialId) {
        const nextItem = payload.materials.find((item) => item.id === model.activeMaterialId);
        if (nextItem) {
          state.setMaterialDraft(materialToPayload(nextItem));
        } else {
          state.setMaterialModalMode(null);
          state.setActiveMaterialId(null);
        }
      }

      if (model.partDefinitionModalMode === "create") {
        state.setPartDefinitionDraft(buildEmptyPartDefinitionPayload(payload));
      }

      if (model.partDefinitionModalMode === "edit" && model.activePartDefinitionId) {
        const nextItem = payload.partDefinitions.find(
          (item) => item.id === model.activePartDefinitionId,
        );
        if (nextItem) {
          state.setPartDefinitionDraft(partDefinitionToPayload(nextItem));
        } else {
          state.setPartDefinitionModalMode(null);
          state.setActivePartDefinitionId(null);
        }
      }

      if (model.artifactModalMode === "create") {
        state.setArtifactDraft(
          buildEmptyArtifactPayload(
            scopedPayload,
            {
              projectId: model.selectedProjectId ?? undefined,
              kind: model.artifactDraft.kind,
            },
          ),
        );
      }

      if (model.artifactModalMode === "edit" && model.activeArtifactId) {
        const nextArtifact = nextArtifacts.find(
          (artifact) => artifact.id === model.activeArtifactId,
        );
        if (nextArtifact) {
          state.setArtifactDraft(artifactToPayload(nextArtifact));
        } else {
          state.setArtifactModalMode(null);
          state.setActiveArtifactId(null);
        }
      }

      if (model.workstreamModalMode === "create") {
        state.setWorkstreamDraft(
          buildEmptyWorkstreamPayload(scopedPayload, {
            projectId: model.selectedProjectId ?? undefined,
          }),
        );
      }

      if (model.workstreamModalMode === "edit" && model.activeWorkstreamId) {
        const nextWorkstream = scopedPayload.workstreams.find(
          (workstream) => workstream.id === model.activeWorkstreamId,
        );
        if (nextWorkstream) {
          state.setWorkstreamDraft(workstreamToPayload(nextWorkstream));
        } else {
          state.setWorkstreamModalMode(null);
          state.setActiveWorkstreamId(null);
        }
      }

      if (model.partInstanceModalMode === "create") {
        state.setPartInstanceDraft(buildEmptyPartInstancePayload(payload));
      }

      if (model.partInstanceModalMode === "edit" && model.activePartInstanceId) {
        const nextPartInstance = payload.partInstances.find(
          (partInstance) => partInstance.id === model.activePartInstanceId,
        );
        if (nextPartInstance) {
          state.setPartInstanceDraft(partInstanceToPayload(nextPartInstance));
        } else {
          state.setPartInstanceModalMode(null);
          state.setActivePartInstanceId(null);
        }
      }

      if (model.subsystemModalMode === "create") {
        state.setSubsystemDraft(buildEmptySubsystemPayload(scopedPayload));
        state.setSubsystemDraftRisks("");
      }

      if (model.subsystemModalMode === "edit" && model.activeSubsystemId) {
        const nextSubsystem = scopedPayload.subsystems.find(
          (subsystem) => subsystem.id === model.activeSubsystemId,
        );
        if (nextSubsystem) {
          state.setSubsystemDraft(subsystemToPayload(nextSubsystem));
          state.setSubsystemDraftRisks(nextSubsystem.risks.join("\n"));
        } else {
          state.setSubsystemModalMode(null);
          state.setActiveSubsystemId(null);
        }
      }

      if (model.mechanismModalMode === "create") {
        state.setMechanismDraft(buildEmptyMechanismPayload(scopedPayload));
      }

      if (model.mechanismModalMode === "edit" && model.activeMechanismId) {
        const nextMechanism = scopedPayload.mechanisms.find(
          (mechanism) => mechanism.id === model.activeMechanismId,
        );
        if (nextMechanism) {
          state.setMechanismDraft({ ...nextMechanism } as MechanismPayload);
        } else {
          state.setMechanismModalMode(null);
          state.setActiveMechanismId(null);
        }
      }

      if (model.workLogModalMode === "create") {
        state.setWorkLogDraft(
          buildEmptyWorkLogPayload(scopedPayload, getSinglePersonFilterId(model.activePersonFilter)),
        );
      }

      if (model.qaReportModalMode === "create") {
        state.setQaReportDraft(
          buildEmptyQaReportPayload(scopedPayload, getSinglePersonFilterId(model.activePersonFilter)),
        );
      }

      if (model.eventReportModalMode === "create") {
        state.setEventReportDraft(buildEmptyTestResultPayload(scopedPayload));
        state.setEventReportFindings("");
      }
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
    model.bootstrap,
    model.eventReportModalMode,
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

  return {
    clearDataMessage,
    clearTaskEditNotice,
    handleUnauthorized,
    loadWorkspace,
    notifyTaskEditCanceled,
    requestMemberPhotoUpload,
    requestPhotoUpload,
    selectMember,
    toggleMyView,
  };
}
