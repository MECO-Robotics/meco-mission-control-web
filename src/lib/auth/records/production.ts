import type { PurchaseItemPayload } from "@/types/payloads";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import type { ManufacturingProcessRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

export function createPurchaseItemRecord(
  payload: PurchaseItemPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PurchaseItemRecord, PurchaseItemPayload>(
    "/purchases",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePurchaseItemRecord(
  itemId: string,
  payload: Partial<PurchaseItemPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PurchaseItemRecord, Partial<PurchaseItemPayload>>(
    `/purchases/${itemId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createManufacturingProcessRecord(
  payload: Pick<ManufacturingProcessRecord, "code" | "name">,
  onUnauthorized?: () => void,
) {
  return requestItem<ManufacturingProcessRecord, Pick<ManufacturingProcessRecord, "code" | "name">>(
    "/manufacturing/processes",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function archiveManufacturingProcessRecord(processId: string, onUnauthorized?: () => void) {
  return requestItem<ManufacturingProcessRecord, { isActive: false }>(
    `/manufacturing/processes/${processId}`,
    "PATCH",
    { isActive: false },
    onUnauthorized,
  );
}
