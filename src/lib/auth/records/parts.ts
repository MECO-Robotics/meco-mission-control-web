import type { PartDefinitionPayload, PartInstancePayload } from "@/types/payloads";
import type { PartDefinitionRecord, PartInstanceRecord } from "@/types/recordsInventory";
import { requestItem } from "./common";

export function createPartDefinitionRecord(
  payload: PartDefinitionPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, PartDefinitionPayload>(
    "/part-definitions",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePartDefinitionRecord(
  partDefinitionId: string,
  payload: Partial<PartDefinitionPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, Partial<PartDefinitionPayload>>(
    `/part-definitions/${partDefinitionId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deletePartDefinitionRecord(
  partDefinitionId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, never>(
    `/part-definitions/${partDefinitionId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createPartInstanceRecord(
  payload: PartInstancePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, PartInstancePayload>(
    "/part-instances",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePartInstanceRecord(
  partInstanceId: string,
  payload: Partial<PartInstancePayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, Partial<PartInstancePayload>>(
    `/part-instances/${partInstanceId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deletePartInstanceRecord(
  partInstanceId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, never>(
    `/part-instances/${partInstanceId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}
