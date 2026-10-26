import type { ArtifactPayload, MaterialPayload, MaterialTransactionPayload, WorkstreamPayload } from "@/types/payloads";
import type { ArtifactRecord, MaterialRecord, MaterialTransactionRecord } from "@/types/recordsInventory";
import type { WorkstreamRecord } from "@/types/recordsOrganization";
import { requestItem, } from "./common";
import { requestApi } from "../core/request";

export function createMaterialRecord(
  payload: MaterialPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<MaterialRecord, MaterialPayload>(
    "/materials",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateMaterialRecord(
  materialId: string,
  payload: Partial<MaterialPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MaterialRecord, Partial<MaterialPayload>>(
    `/materials/${materialId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createMaterialTransactionRecord(
  materialId: string,
  payload: MaterialTransactionPayload,
  onUnauthorized?: () => void,
) {
  return requestApi<{
    item: MaterialRecord;
    transaction: MaterialTransactionRecord;
    replayed: boolean;
  }>(`/materials/${materialId}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, onUnauthorized).then((response) => response.transaction);
}

export function listMaterialTransactionRecords(
  materialId: string,
  onUnauthorized?: () => void,
) {
  return requestApi<{ items: MaterialTransactionRecord[] }>(
    `/materials/${materialId}/transactions`,
    {},
    onUnauthorized,
  ).then((response) => response.items);
}

export function deleteMaterialRecord(materialId: string, onUnauthorized?: () => void) {
  return requestItem<MaterialRecord, never>(`/materials/${materialId}`, "DELETE", undefined, onUnauthorized);
}

export function createArtifactRecord(
  payload: ArtifactPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, ArtifactPayload>(
    "/artifacts",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateArtifactRecord(
  artifactId: string,
  payload: Partial<ArtifactPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, Partial<ArtifactPayload>>(
    `/artifacts/${artifactId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteArtifactRecord(
  artifactId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, never>(
    `/artifacts/${artifactId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createWorkstreamRecord(
  payload: WorkstreamPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkstreamRecord, WorkstreamPayload>(
    "/workstreams",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateWorkstreamRecord(
  workstreamId: string,
  payload: Partial<WorkstreamPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkstreamRecord, Partial<WorkstreamPayload>>(
    `/workstreams/${workstreamId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}
