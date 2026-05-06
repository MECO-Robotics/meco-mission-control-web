import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { MaterialRecord, PartDefinitionRecord, PartInstanceRecord } from "@/types/recordsInventory";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { localTodayDate } from "@/lib/dateUtils";
import { removeId, uniqueIds } from "./internal";

function getManufacturingMaterialFromPart(
  bootstrap: BootstrapPayload,
  partDefinition: PartDefinitionRecord | null,
): MaterialRecord | null {
  if (!partDefinition?.materialId) return null;
  return bootstrap.materials.find((material) => material.id === partDefinition.materialId) ?? null;
}

function getPreferredManufacturingPartInstance(
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

function getSubsystemManufacturingPartInstance(
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

function getManufacturingDraftPartInstanceIds(draft: ManufacturingItemPayload) {
  return draft.partInstanceIds.length ? uniqueIds(draft.partInstanceIds) : uniqueIds([draft.partInstanceId]);
}

function getManufacturingPartInstancesByIds(
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

function getManufacturingQuantityFromInstances(
  draft: ManufacturingItemPayload,
  partInstances: PartInstanceRecord[],
) {
  return partInstances.length > 0
    ? partInstances.reduce((total, partInstance) => total + Math.max(1, partInstance.quantity), 0)
    : draft.quantity;
}

function normalizeManufacturingPartInstanceSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  partInstanceIds: string[],
) {
  const validPartInstanceIds = new Set(
    getManufacturingPartInstanceOptions(bootstrap, draft).map((partInstance) => partInstance.id),
  );
  const selectedPartInstances = getManufacturingPartInstancesByIds(
    bootstrap,
    uniqueIds(partInstanceIds).filter((partInstanceId) => validPartInstanceIds.has(partInstanceId)),
  );
  const primaryPartInstance = selectedPartInstances[0] ?? null;

  return {
    ...draft,
    partInstanceId: primaryPartInstance?.id ?? null,
    partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
    quantity: getManufacturingQuantityFromInstances(draft, selectedPartInstances),
    subsystemId: primaryPartInstance?.subsystemId ?? draft.subsystemId,
  };
}

export function getManufacturingPartInstanceOptions(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
) {
  if (!draft.partDefinitionId) {
    return [];
  }

  return bootstrap.partInstances.filter(
    (partInstance) => partInstance.partDefinitionId === draft.partDefinitionId,
  );
}

export function inferManufacturingDraftFromPartSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  partDefinitionId: string,
): ManufacturingItemPayload {
  const partDefinition = bootstrap.partDefinitions.find((part) => part.id === partDefinitionId) ?? null;
  if (!partDefinition) {
    return {
      ...draft,
      partDefinitionId: null,
      partInstanceId: null,
      partInstanceIds: [],
    };
  }

  const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);
  const partInstance = getPreferredManufacturingPartInstance(
    bootstrap,
    partDefinition.id,
    draft.subsystemId,
  );
  const availablePartInstanceIds = new Set(
    bootstrap.partInstances
      .filter((candidate) => candidate.partDefinitionId === partDefinition.id)
      .map((candidate) => candidate.id),
  );
  const selectedPartInstanceIds = getManufacturingDraftPartInstanceIds(draft).filter(
    (partInstanceId) => availablePartInstanceIds.has(partInstanceId),
  );
  const nextPartInstanceIds = selectedPartInstanceIds.length
    ? selectedPartInstanceIds
    : uniqueIds([partInstance?.id]);

  return normalizeManufacturingPartInstanceSelection(
    bootstrap,
    {
      ...draft,
      title: partDefinition.name,
      material: material?.name ?? "",
      materialId: material?.id ?? null,
      partDefinitionId: partDefinition.id,
    },
    nextPartInstanceIds,
  );
}

export function inferManufacturingDraftFromSubsystemSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  subsystemId: string,
): ManufacturingItemPayload {
  const partInstance = getSubsystemManufacturingPartInstance(
    bootstrap,
    draft.partDefinitionId,
    subsystemId,
  );

  return normalizeManufacturingPartInstanceSelection(
    bootstrap,
    {
      ...draft,
      subsystemId,
    },
    uniqueIds([partInstance?.id]),
  );
}

export function inferManufacturingDraftFromPartInstanceSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  partInstanceId: string,
): ManufacturingItemPayload {
  const partInstance = bootstrap.partInstances.find((item) => item.id === partInstanceId) ?? null;
  if (!partInstance) {
    return {
      ...draft,
      partInstanceId: null,
      partInstanceIds: [],
    };
  }

  const partDefinition =
    bootstrap.partDefinitions.find((part) => part.id === partInstance.partDefinitionId) ?? null;
  const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);

  return normalizeManufacturingPartInstanceSelection(
    bootstrap,
    {
      ...draft,
      title: partDefinition?.name ?? draft.title,
      material: material?.name ?? "",
      materialId: material?.id ?? null,
      partDefinitionId: partDefinition?.id ?? draft.partDefinitionId,
    },
    [partInstance.id],
  );
}

export function toggleManufacturingDraftPartInstanceSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  partInstanceId: string,
): ManufacturingItemPayload {
  const partInstance = bootstrap.partInstances.find((item) => item.id === partInstanceId) ?? null;
  if (!partInstance) {
    return normalizeManufacturingPartInstanceSelection(
      bootstrap,
      draft,
      getManufacturingDraftPartInstanceIds(draft),
    );
  }

  const currentPartInstanceIds = getManufacturingDraftPartInstanceIds(draft);
  const nextPartInstanceIds = currentPartInstanceIds.includes(partInstance.id)
    ? removeId(currentPartInstanceIds, partInstance.id)
    : uniqueIds([...currentPartInstanceIds, partInstance.id]);
  const partDefinition =
    bootstrap.partDefinitions.find((part) => part.id === partInstance.partDefinitionId) ?? null;
  const material = getManufacturingMaterialFromPart(bootstrap, partDefinition);

  return normalizeManufacturingPartInstanceSelection(
    bootstrap,
    {
      ...draft,
      title: partDefinition?.name ?? draft.title,
      material: material?.name ?? "",
      materialId: material?.id ?? null,
      partDefinitionId: partDefinition?.id ?? draft.partDefinitionId,
    },
    nextPartInstanceIds,
  );
}

export function inferManufacturingDraftFromProcessSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  process: ManufacturingItemPayload["process"],
): ManufacturingItemPayload {
  const nextDraft = {
    ...draft,
    process,
    inHouse: process === "cnc" ? draft.inHouse ?? true : false,
  };

  if (nextDraft.partDefinitionId) {
    return inferManufacturingDraftFromPartSelection(
      bootstrap,
      nextDraft,
      nextDraft.partDefinitionId,
    );
  }

  const defaultPartDefinition = bootstrap.partDefinitions[0] ?? null;
  return defaultPartDefinition
    ? inferManufacturingDraftFromPartSelection(bootstrap, nextDraft, defaultPartDefinition.id)
    : nextDraft;
}

export function buildEmptyManufacturingPayload(
  bootstrap: BootstrapPayload,
  process: ManufacturingItemPayload["process"],
  defaultRequesterId: string | null = null,
): ManufacturingItemPayload {
  const firstMaterial = bootstrap.materials[0] ?? null;
  const firstPartDefinition = bootstrap.partDefinitions[0] ?? null;
  const requesterId =
    defaultRequesterId &&
    bootstrap.members.some((member) => member.id === defaultRequesterId)
      ? defaultRequesterId
      : bootstrap.members[0]?.id ?? null;
  const basePayload: ManufacturingItemPayload = {
    title: firstPartDefinition?.name ?? "",
    subsystemId: getDefaultSubsystemId(bootstrap),
    requestedById: requesterId,
    process,
    dueDate: localTodayDate(),
    material: firstMaterial?.name ?? "",
    materialId: firstMaterial?.id ?? null,
    partDefinitionId: firstPartDefinition?.id ?? null,
    partInstanceId: null,
    partInstanceIds: [],
    quantity: 1,
    status: "requested",
    mentorReviewed: false,
    inHouse: process === "cnc",
    batchLabel: "",
  };
  return firstPartDefinition
    ? inferManufacturingDraftFromPartSelection(bootstrap, basePayload, firstPartDefinition.id)
    : basePayload;
}
