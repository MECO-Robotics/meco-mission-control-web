import type { PurchaseItemPayload } from "@/types/payloads";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
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
