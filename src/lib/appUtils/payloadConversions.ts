import type { ArtifactRecord, ManufacturingItemRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "@/types/recordsInventory";
import type { ArtifactPayload, ManufacturingItemPayload, MaterialPayload, MechanismPayload, PartDefinitionPayload, PartInstancePayload, PurchaseItemPayload, SubsystemPayload, WorkstreamPayload } from "@/types/payloads";
import type { SubsystemRecord, WorkstreamRecord } from "@/types/recordsOrganization";
import { normalizeIteration } from "@/lib/appUtils/common";
import { normalizeSubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
import { uniqueIds } from "./internal";

export const purchaseToPayload = (item: PurchaseItemRecord): PurchaseItemPayload => ({
  ...item,
  partDefinitionId: item.partDefinitionId ?? null,
  finalCost: item.finalCost ?? undefined,
});

export const manufacturingToPayload = (item: ManufacturingItemRecord): ManufacturingItemPayload => ({
  ...item,
  materialId: item.materialId ?? null,
  partDefinitionId: item.partDefinitionId ?? null,
  partInstanceId: item.partInstanceId ?? null,
  partInstanceIds: item.partInstanceIds?.length ? uniqueIds(item.partInstanceIds) : uniqueIds([item.partInstanceId]),
  inHouse: item.process === "cnc" ? item.inHouse ?? true : false,
  batchLabel: item.batchLabel ?? "",
});

export const materialToPayload = (item: MaterialRecord): MaterialPayload => ({ ...item });

export const artifactToPayload = (item: ArtifactRecord): ArtifactPayload => ({
  ...item,
  workstreamId: item.workstreamId ?? null,
  summary: item.summary ?? "",
  link: item.link ?? "",
  isArchived: item.isArchived ?? false,
  updatedAt: item.updatedAt || new Date().toISOString(),
});

export const partDefinitionToPayload = (item: PartDefinitionRecord): PartDefinitionPayload => ({
  ...item,
  seasonId: item.seasonId,
  activeSeasonIds: item.activeSeasonIds ?? [item.seasonId],
  iteration: normalizeIteration(item.iteration),
  isHardware: item.isHardware ?? false,
  isArchived: item.isArchived ?? false,
  materialId: item.materialId ?? null,
  photoUrl: item.photoUrl ?? "",
});

export const subsystemToPayload = (item: SubsystemRecord): SubsystemPayload => ({
  ...item,
  ...normalizeSubsystemLayoutFields(item),
  color: resolveWorkspaceColor(item.color, `${item.projectId}:${item.id}:${item.name}`, item.iteration),
  isArchived: item.isArchived ?? false,
  iteration: normalizeIteration(item.iteration),
  photoUrl: item.photoUrl ?? "",
});

export const mechanismToPayload = (item: {
  subsystemId: string;
  name: string;
  description: string;
  googleSheetsUrl?: string;
  iteration?: number;
  isArchived?: boolean;
  photoUrl?: string;
}): MechanismPayload => ({
  ...item,
  googleSheetsUrl: item.googleSheetsUrl ?? "",
  isArchived: item.isArchived ?? false,
  iteration: normalizeIteration(item.iteration),
  photoUrl: item.photoUrl ?? "",
});

export const workstreamToPayload = (item: WorkstreamRecord): WorkstreamPayload => ({
  ...item,
  color: resolveWorkspaceColor(item.color, `${item.projectId}:${item.id}:${item.name}`),
  isArchived: item.isArchived ?? false,
});

export const partInstanceToPayload = (item: PartInstanceRecord): PartInstancePayload => ({
  ...item,
  mechanismId: item.mechanismId ?? null,
  photoUrl: item.photoUrl ?? "",
});
