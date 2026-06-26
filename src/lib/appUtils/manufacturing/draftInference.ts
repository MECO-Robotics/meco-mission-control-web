import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import { removeId, uniqueIds } from "../internal";
import {
  getManufacturingDraftPartInstanceIds,
  getManufacturingMaterialFromPart,
  getPreferredManufacturingPartInstance,
  getSubsystemManufacturingPartInstance,
} from "./partSelection";
import { normalizeManufacturingPartInstanceSelection } from "./selection";

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
