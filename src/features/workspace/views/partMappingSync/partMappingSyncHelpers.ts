import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionPayload, PartInstancePayload } from "@/types/payloads";

import type { PartMappingSyncSource } from "./partMappingSyncTypes";

export function normalizePartMappingValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getPartMappingPathLeaf(value: string) {
  return value.split("/").filter(Boolean).at(-1)?.trim() || value.trim();
}

function getDefaultSubsystem(bootstrap: BootstrapPayload) {
  return bootstrap.subsystems.find((subsystem) => !subsystem.isArchived) ?? bootstrap.subsystems[0] ?? null;
}

function getDefaultMechanism(bootstrap: BootstrapPayload, subsystemId: string | null) {
  if (!subsystemId) {
    return null;
  }

  return (
    bootstrap.mechanisms.find(
      (mechanism) => mechanism.subsystemId === subsystemId && !mechanism.isArchived,
    ) ??
    bootstrap.mechanisms.find((mechanism) => mechanism.subsystemId === subsystemId) ??
    null
  );
}

export function resolvePartMappingAssemblyTarget(
  bootstrap: BootstrapPayload,
  source: PartMappingSyncSource,
  assemblyNodeId: string | null,
) {
  const node = source.assemblyNodes.find((entry) => entry.id === assemblyNodeId) ?? null;
  const nodeMechanism = node?.mechanismId
    ? bootstrap.mechanisms.find((mechanism) => mechanism.id === node.mechanismId) ?? null
    : null;
  const nodeSubsystem = node?.subsystemId
    ? bootstrap.subsystems.find((subsystem) => subsystem.id === node.subsystemId) ?? null
    : null;
  const mechanismSubsystem = nodeMechanism?.subsystemId
    ? bootstrap.subsystems.find((entry) => entry.id === nodeMechanism.subsystemId) ?? null
    : null;
  const subsystem = nodeSubsystem ?? mechanismSubsystem ?? getDefaultSubsystem(bootstrap);
  const mechanism = nodeMechanism ?? getDefaultMechanism(bootstrap, subsystem?.id ?? null);

  return { subsystem, mechanism };
}

export function createPartMappingPartPayload(
  cadPart: PartMappingSyncSource["partDefinitions"][number],
  selectedSeasonId: string | null,
): PartDefinitionPayload {
  return {
    seasonId: selectedSeasonId ?? undefined,
    activeSeasonIds: selectedSeasonId ? [selectedSeasonId] : undefined,
    name: cadPart.name,
    partNumber: cadPart.partNumber ?? cadPart.name,
    revision: cadPart.configuration ?? "A",
    iteration: 1,
    isArchived: false,
    isHardware: false,
    type: "CAD",
    source: "Onshape sync",
    materialId: null,
    description: cadPart.material ? `Imported from CAD. Material: ${cadPart.material}.` : "Imported from CAD.",
    photoUrl: "",
  };
}

export function createPartMappingInstancePayload(
  cadInstance: PartMappingSyncSource["partInstances"][number],
  partDefinitionId: string,
  subsystemId: string,
  mechanismId: string | null,
): PartInstancePayload {
  return {
    subsystemId,
    mechanismId,
    partDefinitionId,
    name: getPartMappingPathLeaf(cadInstance.instancePath),
    quantity: Math.max(1, cadInstance.quantity || 1),
    trackIndividually: false,
    status: cadInstance.suppressed ? "blocked" : "not ready",
    photoUrl: "",
  };
}

export function createPartMappingInstanceKey(
  partDefinitionId: string,
  mechanismId: string | null,
  name: string,
) {
  return [partDefinitionId, mechanismId ?? "none", normalizePartMappingValue(name)].join("::");
}
