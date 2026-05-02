import type { BootstrapPayload, MechanismPayload } from "@/types";

import {
  artifactToPayload,
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
  manufacturingToPayload,
  materialToPayload,
  partDefinitionToPayload,
  partInstanceToPayload,
  purchaseToPayload,
  subsystemToPayload,
  taskToPayload,
  workstreamToPayload,
} from "@/lib/appUtils";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { getSinglePersonFilterId } from "@/app/state/workspaceStateUtils";
import type { AppWorkspaceLoaderModel } from "@/app/hooks/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileActivePersonFilter(
  state: AppWorkspaceState,
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

export function reconcileTaskModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
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
}

export function reconcilePurchaseModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
) {
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
}

export function reconcileManufacturingModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
  signedInScopedMemberId: string | null,
) {
  if (model.manufacturingModalMode === "create") {
    state.setManufacturingDraft((current) =>
      buildEmptyManufacturingPayload(
        payload,
        current.process,
        current.process === "cnc" ? signedInScopedMemberId : null,
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
}

export function reconcileMaterialModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
) {
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
}

export function reconcilePartDefinitionModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
) {
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
}

export function reconcileArtifactModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
  if (model.artifactModalMode === "create") {
    state.setArtifactDraft(
      buildEmptyArtifactPayload(scopedPayload, {
        projectId: model.selectedProjectId ?? undefined,
        kind: model.artifactDraft.kind,
      }),
    );
  }

  if (model.artifactModalMode === "edit" && model.activeArtifactId) {
    const nextArtifact = payload.artifacts.find((artifact) => artifact.id === model.activeArtifactId);
    if (nextArtifact) {
      state.setArtifactDraft(artifactToPayload(nextArtifact));
    } else {
      state.setArtifactModalMode(null);
      state.setActiveArtifactId(null);
    }
  }
}

export function reconcileWorkstreamModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
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
}

export function reconcilePartInstanceModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  payload: BootstrapPayload,
) {
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
}

export function reconcileSubsystemModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
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
}

export function reconcileMechanismModal(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
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
}

export function reconcileWorkLogAndReports(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
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
}
