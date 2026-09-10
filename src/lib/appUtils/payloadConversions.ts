import type { ArtifactRecord, ManufacturingItemRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "@/types/recordsInventory";
import type { ArtifactPayload, ManufacturingItemPayload, MaterialPayload, PartDefinitionPayload, PartInstancePayload, PurchaseItemPayload, SubsystemPayload, WorkstreamPayload } from "@/types/payloads";
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

export const materialToPayload = (item: MaterialRecord): MaterialPayload => ({
  name: item.name,
  category: item.category,
  unit: item.unit,
  onHandQuantity: item.onHandQuantity,
  reorderPoint: item.reorderPoint,
  location: item.location,
  vendor: item.vendor,
  notes: item.notes,
});

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
  projectId: item.projectId,
  name: item.name,
  description: item.description,
  parentSubsystemId: item.parentSubsystemId,
  responsibleEngineerId: item.responsibleEngineerId,
  mentorIds: item.mentorIds,
  risks: item.risks,
  ...normalizeSubsystemLayoutFields(item),
  color: resolveWorkspaceColor(item.color, `${item.projectId}:${item.id}:${item.name}`, item.iteration),
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
