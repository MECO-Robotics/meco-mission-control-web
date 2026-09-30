import type { ArtifactRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "@/types/recordsInventory";
import type { ArtifactPayload, MaterialPayload, PartDefinitionPayload, PartInstancePayload, PurchaseItemPayload, SubsystemPayload, WorkstreamPayload } from "@/types/payloads";
import type { SubsystemRecord, WorkstreamRecord } from "@/types/recordsOrganization";
import { normalizeIteration } from "@/lib/appUtils/common";
import { normalizeSubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";

export const purchaseToPayload = (item: PurchaseItemRecord): PurchaseItemPayload => ({
  ...item,
  partDefinitionId: item.partDefinitionId ?? null,
  finalCost: item.finalCost ?? null,
});

export const materialToPayload = (item: MaterialRecord): MaterialPayload => ({
  name: item.name,
  category: item.category,
  unit: item.unit,
  onHandQuantity: item.onHandQuantity,
  reorderPoint: item.reorderPoint,
  location: item.location,
  preferredVendorId: item.preferredVendorId,
  notes: item.notes,
  photoUrl: item.photoUrl ?? "",
});

export const artifactToPayload = (item: ArtifactRecord): ArtifactPayload => ({
  ...item,
  summary: item.summary ?? "",
  uri: item.uri ?? "",
  updatedAt: item.updatedAt || new Date().toISOString(),
});

export const partDefinitionToPayload = (item: PartDefinitionRecord): PartDefinitionPayload => ({
  ...item,
  seasonId: item.seasonId,
  activeSeasonIds: item.activeSeasonIds ?? [item.seasonId],
  iteration: normalizeIteration(item.iteration),
  isHardware: item.isHardware ?? false,
  isArchived: item.isArchived ?? false,
  defaultAcquisitionMethod: item.defaultAcquisitionMethod,
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
  photoUrl: item.photoUrl ?? "",
});
