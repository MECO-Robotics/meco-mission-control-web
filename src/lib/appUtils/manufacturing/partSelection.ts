import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { MaterialRecord, PartDefinitionRecord, PartInstanceRecord } from "@/types/recordsInventory";
import { uniqueIds } from "../internal";

export function getManufacturingMaterialFromPart(
  bootstrap: BootstrapPayload,
  partDefinition: PartDefinitionRecord | null,
): MaterialRecord | null {
  if (!partDefinition?.materialId) return null;
  return bootstrap.materials.find((material) => material.id === partDefinition.materialId) ?? null;
}

export function getPreferredManufacturingPartInstance(
  bootstrap: BootstrapPayload,
  partDefinitionId: string,
  subsystemId: string,
): PartInstanceRecord | null {
  return (
    bootstrap.partInstances.find(
      (partInstance) =>
        partInstance.partDefinitionId === partDefinitionId &&
        partInstance.subsystemId === subsystemId,
    ) ??
    bootstrap.partInstances.find((partInstance) => partInstance.partDefinitionId === partDefinitionId) ??
    null
  );
}

export function getSubsystemManufacturingPartInstance(
  bootstrap: BootstrapPayload,
  partDefinitionId: string | null,
  subsystemId: string,
): PartInstanceRecord | null {
  return (
    bootstrap.partInstances.find(
      (partInstance) =>
        partInstance.subsystemId === subsystemId &&
        (!partDefinitionId || partInstance.partDefinitionId === partDefinitionId),
    ) ?? null
  );
}

export function getManufacturingDraftPartInstanceIds(draft: ManufacturingItemPayload) {
  return draft.partInstanceIds.length ? uniqueIds(draft.partInstanceIds) : uniqueIds([draft.partInstanceId]);
}

export function getManufacturingPartInstancesByIds(
  bootstrap: BootstrapPayload,
  partInstanceIds: string[],
) {
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
  ) as Record<string, PartInstanceRecord>;

  return partInstanceIds
    .map((partInstanceId) => partInstancesById[partInstanceId])
    .filter((partInstance): partInstance is PartInstanceRecord => Boolean(partInstance));
}

export function getManufacturingQuantityFromInstances(
  draft: ManufacturingItemPayload,
  partInstances: PartInstanceRecord[],
) {
  return partInstances.length > 0
    ? partInstances.reduce((total, partInstance) => total + Math.max(1, partInstance.quantity), 0)
    : draft.quantity;
}
