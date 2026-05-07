import type { BootstrapPayload } from "@/types/bootstrap";
import type { MechanismPayload } from "@/types/payloads";

import { buildEmptyArtifactPayload, buildEmptyMaterialPayload, buildEmptyMechanismPayload, buildEmptyPartDefinitionPayload, buildEmptyPartInstancePayload, buildEmptySubsystemPayload, buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { artifactToPayload, materialToPayload, partDefinitionToPayload, partInstanceToPayload, subsystemToPayload, workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import type { AppWorkspaceLoaderModel, WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileMaterialModal(
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
  state: WorkspaceReconciliationState,
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
