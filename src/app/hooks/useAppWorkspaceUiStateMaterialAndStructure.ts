import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model";
import {
  buildEmptyArtifactPayload,
  buildEmptyMaterialPayload,
  buildEmptyMechanismPayload,
  buildEmptyPartDefinitionPayload,
  buildEmptyPartInstancePayload,
  buildEmptySubsystemPayload,
  buildEmptyWorkstreamPayload,
} from "@/lib/appUtils";
import type {
  ArtifactPayload,
  MaterialPayload,
  MechanismPayload,
  PartDefinitionPayload,
  PartInstancePayload,
  SubsystemPayload,
  WorkstreamPayload,
} from "@/types";
import type {
  ArtifactModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  SubsystemModalMode,
  WorkstreamModalMode,
} from "@/features/workspace";

export function useAppWorkspaceUiStateMaterialAndStructure() {
  const [materialModalMode, setMaterialModalMode] = useState<MaterialModalMode>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialPayload>(
    buildEmptyMaterialPayload(),
  );
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  const [partDefinitionModalMode, setPartDefinitionModalMode] =
    useState<PartDefinitionModalMode>(null);
  const [activePartDefinitionId, setActivePartDefinitionId] = useState<string | null>(
    null,
  );
  const [partDefinitionDraft, setPartDefinitionDraft] =
    useState<PartDefinitionPayload>(buildEmptyPartDefinitionPayload(EMPTY_BOOTSTRAP));
  const [isSavingPartDefinition, setIsSavingPartDefinition] = useState(false);
  const [isDeletingPartDefinition, setIsDeletingPartDefinition] = useState(false);

  const [artifactModalMode, setArtifactModalMode] = useState<ArtifactModalMode>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState<ArtifactPayload>(
    buildEmptyArtifactPayload(EMPTY_BOOTSTRAP, { kind: "document" }),
  );
  const [isSavingArtifact, setIsSavingArtifact] = useState(false);
  const [isDeletingArtifact, setIsDeletingArtifact] = useState(false);

  const [workstreamModalMode, setWorkstreamModalMode] =
    useState<WorkstreamModalMode>(null);
  const [activeWorkstreamId, setActiveWorkstreamId] = useState<string | null>(null);
  const [workstreamDraft, setWorkstreamDraft] = useState<WorkstreamPayload>(
    buildEmptyWorkstreamPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingWorkstream, setIsSavingWorkstream] = useState(false);

  const [partInstanceModalMode, setPartInstanceModalMode] =
    useState<PartInstanceModalMode>(null);
  const [activePartInstanceId, setActivePartInstanceId] = useState<string | null>(null);
  const [partInstanceDraft, setPartInstanceDraft] = useState<PartInstancePayload>(
    buildEmptyPartInstancePayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingPartInstance, setIsSavingPartInstance] = useState(false);

  const [subsystemModalMode, setSubsystemModalMode] =
    useState<SubsystemModalMode>(null);
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);
  const [subsystemDraft, setSubsystemDraft] = useState<SubsystemPayload>(
    buildEmptySubsystemPayload(EMPTY_BOOTSTRAP),
  );
  const [subsystemDraftRisks, setSubsystemDraftRisks] = useState("");
  const [isSavingSubsystem, setIsSavingSubsystem] = useState(false);

  const [mechanismModalMode, setMechanismModalMode] =
    useState<MechanismModalMode>(null);
  const [activeMechanismId, setActiveMechanismId] = useState<string | null>(null);
  const [mechanismDraft, setMechanismDraft] = useState<MechanismPayload>(
    buildEmptyMechanismPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingMechanism, setIsSavingMechanism] = useState(false);
  const [isDeletingMechanism, setIsDeletingMechanism] = useState(false);

  return {
    activeArtifactId,
    activeMechanismId,
    activeMaterialId,
    activePartDefinitionId,
    activePartInstanceId,
    activeSubsystemId,
    activeWorkstreamId,
    artifactDraft,
    artifactModalMode,
    isDeletingArtifact,
    isDeletingMaterial,
    isDeletingMechanism,
    isDeletingPartDefinition,
    isSavingArtifact,
    isSavingMaterial,
    isSavingMechanism,
    isSavingPartDefinition,
    isSavingPartInstance,
    isSavingSubsystem,
    isSavingWorkstream,
    materialDraft,
    materialModalMode,
    mechanismDraft,
    mechanismModalMode,
    partDefinitionDraft,
    partDefinitionModalMode,
    partInstanceDraft,
    partInstanceModalMode,
    setActiveArtifactId,
    setActiveMechanismId,
    setActiveMaterialId,
    setActivePartDefinitionId,
    setActivePartInstanceId,
    setActiveSubsystemId,
    setActiveWorkstreamId,
    setArtifactDraft,
    setArtifactModalMode,
    setIsDeletingArtifact,
    setIsDeletingMaterial,
    setIsDeletingMechanism,
    setIsDeletingPartDefinition,
    setIsSavingArtifact,
    setIsSavingMaterial,
    setIsSavingMechanism,
    setIsSavingPartDefinition,
    setIsSavingPartInstance,
    setIsSavingSubsystem,
    setIsSavingWorkstream,
    setMaterialDraft,
    setMaterialModalMode,
    setMechanismDraft,
    setMechanismModalMode,
    setPartDefinitionDraft,
    setPartDefinitionModalMode,
    setPartInstanceDraft,
    setPartInstanceModalMode,
    setSubsystemDraft,
    setSubsystemDraftRisks,
    setSubsystemModalMode,
    setWorkstreamDraft,
    setWorkstreamModalMode,
    subsystemDraft,
    subsystemDraftRisks,
    subsystemModalMode,
    workstreamDraft,
    workstreamModalMode,
  };
}
