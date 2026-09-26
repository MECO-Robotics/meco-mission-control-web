import type { BootstrapPayload } from "@/types/bootstrap";
import type { MechanismPayload } from "@/types/payloads";

import { buildEmptyArtifactPayload, buildEmptyMechanismPayload, buildEmptyPartDefinitionPayload, buildEmptyPartInstancePayload, buildEmptySubsystemPayload, buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { artifactToPayload, partDefinitionToPayload, partInstanceToPayload, subsystemToPayload, workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function reconcilePartDefinitionModal(
  state: AppWorkspaceState,
  payload: BootstrapPayload,
) {
  if (state.partDefinitionModalMode === "create") {
    state.setPartDefinitionDraft(buildEmptyPartDefinitionPayload(payload));
  }

  if (state.partDefinitionModalMode === "edit" && state.activePartDefinitionId) {
    const nextItem = payload.partDefinitions.find(
      (item) => item.id === state.activePartDefinitionId,
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
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
  if (state.artifactModalMode === "create") {
    state.setArtifactDraft(
      buildEmptyArtifactPayload(scopedPayload, {
        projectId: state.selectedProjectId ?? undefined,
        kind: state.artifactDraft.kind,
      }),
    );
  }

  if (state.artifactModalMode === "edit" && state.activeArtifactId) {
    const nextArtifact = payload.artifacts.find((artifact) => artifact.id === state.activeArtifactId);
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
  scopedPayload: BootstrapPayload,
) {
  if (state.workstreamModalMode === "create") {
    state.setWorkstreamDraft(
      buildEmptyWorkstreamPayload(scopedPayload, {
        projectId: state.selectedProjectId ?? undefined,
      }),
    );
  }

  if (state.workstreamModalMode === "edit" && state.activeWorkstreamId) {
    const nextWorkstream = scopedPayload.workstreams.find(
      (workstream) => workstream.id === state.activeWorkstreamId,
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
  payload: BootstrapPayload,
) {
  if (state.partInstanceModalMode === "create") {
    state.setPartInstanceDraft(buildEmptyPartInstancePayload(payload));
  }

  if (state.partInstanceModalMode === "edit" && state.activePartInstanceId) {
    const nextPartInstance = payload.partInstances.find(
      (partInstance) => partInstance.id === state.activePartInstanceId,
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
  scopedPayload: BootstrapPayload,
) {
  if (state.subsystemModalMode === "create") {
    state.setSubsystemDraft(buildEmptySubsystemPayload(scopedPayload));
    state.setSubsystemDraftRisks("");
  }

  if (state.subsystemModalMode === "edit" && state.activeSubsystemId) {
    const nextSubsystem = scopedPayload.subsystems.find(
      (subsystem) => subsystem.id === state.activeSubsystemId,
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
  scopedPayload: BootstrapPayload,
) {
  if (state.mechanismModalMode === "create") {
    state.setMechanismDraft(buildEmptyMechanismPayload(scopedPayload));
  }

  if (state.mechanismModalMode === "edit" && state.activeMechanismId) {
    const nextMechanism = scopedPayload.mechanisms.find(
      (mechanism) => mechanism.id === state.activeMechanismId,
    );
    if (nextMechanism) {
      state.setMechanismDraft({ ...nextMechanism } as MechanismPayload);
    } else {
      state.setMechanismModalMode(null);
      state.setActiveMechanismId(null);
    }
  }
}
