import type { BootstrapPayload } from "@/types/bootstrap";

import type {
  BuildPartMappingChangesOptions,
  PartMappingChange,
  PartMappingSyncSource,
} from "./partMappingSyncTypes";
import {
  createPartMappingInstanceKey,
  createPartMappingInstancePayload,
  createPartMappingPartPayload,
  getPartMappingPathLeaf,
  normalizePartMappingValue,
  resolvePartMappingAssemblyTarget,
} from "./partMappingSyncHelpers";

function buildPartDefinitionIndexes(bootstrap: BootstrapPayload) {
  const byId = new Map(bootstrap.partDefinitions.map((part) => [part.id, part] as const));
  const byPartNumber = new Map(
    bootstrap.partDefinitions
      .filter((part) => normalizePartMappingValue(part.partNumber))
      .map((part) => [normalizePartMappingValue(part.partNumber), part] as const),
  );
  const byName = new Map(
    bootstrap.partDefinitions.map((part) => [normalizePartMappingValue(part.name), part] as const),
  );

  return { byId, byName, byPartNumber };
}

function findMatchingPartDefinition(
  bootstrap: BootstrapPayload,
  cadPart: PartMappingSyncSource["partDefinitions"][number],
) {
  const indexes = buildPartDefinitionIndexes(bootstrap);
  if (cadPart.missionControlExternalKey) {
    const directMatch = indexes.byId.get(cadPart.missionControlExternalKey);
    if (directMatch) {
      return directMatch;
    }
  }

  const partNumberMatch = indexes.byPartNumber.get(normalizePartMappingValue(cadPart.partNumber));
  if (partNumberMatch) {
    return partNumberMatch;
  }

  return indexes.byName.get(normalizePartMappingValue(cadPart.name)) ?? null;
}

export function buildPartMappingChanges({
  bootstrap,
  selectedSeasonId,
  source,
}: BuildPartMappingChangesOptions): PartMappingChange[] {
  const changes: PartMappingChange[] = [];
  const cadPartsById = new Map(source.partDefinitions.map((part) => [part.id, part] as const));
  const cadPartMatchById = new Map<string, BootstrapPayload["partDefinitions"][number]>();
  const desiredInstanceKeys = new Set<string>();
  const representedSubsystemIds = new Set<string>();
  const existingInstanceKeys = new Map(
    bootstrap.partInstances.map((instance) => [
      createPartMappingInstanceKey(instance.partDefinitionId, instance.mechanismId, instance.name),
      instance,
    ] as const),
  );

  source.partDefinitions.forEach((cadPart) => {
    const existingPart = findMatchingPartDefinition(bootstrap, cadPart);
    if (existingPart) {
      cadPartMatchById.set(cadPart.id, existingPart);
      const nextRevision = cadPart.configuration?.trim();
      const nextPartNumber = cadPart.partNumber?.trim();
      const changedRevision = Boolean(nextRevision && nextRevision !== existingPart.revision);
      const changedPartNumber = Boolean(nextPartNumber && nextPartNumber !== existingPart.partNumber);

      if (changedRevision || changedPartNumber || existingPart.isArchived) {
        changes.push({
          id: `part-update-${cadPart.id}`,
          kind: "new-iteration",
          title: existingPart.name,
          detail: `Move to ${nextRevision || existingPart.revision} and iteration ${existingPart.iteration + 1}.`,
          subsystemName: "Reusable part",
          mechanismName: "Definition",
          decision: "approved",
          partDefinitionId: existingPart.id,
          payload: {
            revision: nextRevision || existingPart.revision,
            partNumber: nextPartNumber || existingPart.partNumber,
            iteration: existingPart.iteration + 1,
            isArchived: false,
          },
        });
      }
      return;
    }

    changes.push({
      id: `part-create-${cadPart.id}`,
      kind: "new-part",
      title: cadPart.name,
      detail: cadPart.partNumber ? `Create ${cadPart.partNumber}.` : "Create from CAD definition.",
      subsystemName: "Reusable part",
      mechanismName: "Definition",
      decision: "approved",
      payload: createPartMappingPartPayload(cadPart, selectedSeasonId),
    });
  });

  source.partInstances
    .filter((cadInstance) => !cadInstance.suppressed)
    .forEach((cadInstance) => {
      const cadPart = cadInstance.cadPartDefinitionId
        ? cadPartsById.get(cadInstance.cadPartDefinitionId)
        : null;
      if (!cadPart) {
        return;
      }

      const target = resolvePartMappingAssemblyTarget(bootstrap, source, cadInstance.parentAssemblyNodeId);
      if (!target.subsystem) {
        return;
      }

      representedSubsystemIds.add(target.subsystem.id);
      const existingPart = cadPartMatchById.get(cadPart.id);
      const partDefinitionId = existingPart?.id ?? `pending:${cadPart.id}`;
      const instanceName = getPartMappingPathLeaf(cadInstance.instancePath);
      const desiredKey = createPartMappingInstanceKey(partDefinitionId, target.mechanism?.id ?? null, instanceName);
      desiredInstanceKeys.add(desiredKey);
      if (existingInstanceKeys.has(desiredKey)) {
        return;
      }

      changes.push({
        id: `instance-create-${cadInstance.id}`,
        kind: "new-instance",
        title: instanceName,
        detail: `${existingPart?.name ?? cadPart.name} appears in the synced assembly.`,
        subsystemName: target.subsystem.name,
        mechanismName: target.mechanism?.name ?? "Unassigned",
        decision: "approved",
        payload: createPartMappingInstancePayload(
          cadInstance,
          partDefinitionId,
          target.subsystem.id,
          target.mechanism?.id ?? null,
        ),
      });
    });

  bootstrap.partInstances.forEach((instance) => {
    if (!representedSubsystemIds.has(instance.subsystemId)) {
      return;
    }

    const key = createPartMappingInstanceKey(instance.partDefinitionId, instance.mechanismId, instance.name);
    if (desiredInstanceKeys.has(key)) {
      return;
    }

    const subsystem = bootstrap.subsystems.find((entry) => entry.id === instance.subsystemId);
    const mechanism = instance.mechanismId
      ? bootstrap.mechanisms.find((entry) => entry.id === instance.mechanismId)
      : null;

    changes.push({
      id: `instance-delete-${instance.id}`,
      kind: "deleted-instance",
      title: instance.name,
      detail: "CAD sync no longer includes this placement.",
      subsystemName: subsystem?.name ?? "Unknown subsystem",
      mechanismName: mechanism?.name ?? "Unassigned",
      decision: "denied",
      partInstanceId: instance.id,
    });
  });

  return changes;
}
