import type { ArtifactPayload, MaterialPayload, WorkstreamPayload } from "@/types/payloads";
import type { ArtifactRecord, MaterialRecord } from "@/types/recordsInventory";
import type { WorkstreamRecord } from "@/types/recordsOrganization";
import { requestItem, requestItems } from "./common";

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

export function deleteMaterialRecord(materialId: string, onUnauthorized?: () => void) {
  return requestItem<MaterialRecord, never>(`/materials/${materialId}`, "DELETE", undefined, onUnauthorized);
}

export function fetchArtifactRecords(onUnauthorized?: () => void) {
  return requestItems<ArtifactRecord>("/artifacts", onUnauthorized);
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
