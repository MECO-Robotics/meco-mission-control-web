import type { ManufacturingItemPayload, PurchaseItemPayload } from "@/types/payloads";
import type { ManufacturingItemRecord, PurchaseItemRecord } from "@/types/recordsInventory";
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

export function createManufacturingItemRecord(
  payload: ManufacturingItemPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ManufacturingItemRecord, ManufacturingItemPayload>(
    "/manufacturing",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateManufacturingItemRecord(
  itemId: string,
  payload: Partial<ManufacturingItemPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ManufacturingItemRecord, Partial<ManufacturingItemPayload>>(
    `/manufacturing/${itemId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}
