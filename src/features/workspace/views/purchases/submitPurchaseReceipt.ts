import type { PurchaseItemRecord } from "@/types/recordsInventory";

interface SubmitPurchaseReceiptOptions {
  write: () => Promise<unknown>;
  refresh: () => Promise<unknown>;
  acknowledge: () => void;
  hasReceipt: () => boolean;
  reportError: (message: string) => void;
}

export function isDiscretePurchaseReceipt(item: PurchaseItemRecord) {
  return item.partDefinitionId !== null;
}

export function normalizeReceiptQuantity(quantity: number) {
  return Number(quantity.toFixed(8));
}

export function sumReceiptQuantities(quantities: number[]) {
  return normalizeReceiptQuantity(quantities.reduce((total, quantity) => total + quantity, 0));
}

export function isValidReceiptQuantity(quantity: number, remaining: number, discretePart: boolean) {
  return Number.isFinite(quantity) && quantity > 0 && quantity <= 1000 &&
    (!discretePart || Number.isInteger(quantity)) &&
    quantity <= remaining + Number.EPSILON * Math.max(1, Math.abs(remaining)) * 4;
}

export interface StableReceiptPayload { operationId: string; quantity: number; location: string }

export function createStableReceiptOperation(createId: () => string, restored?: { payload: StableReceiptPayload; outcomeUnknown: boolean }) {
  let operationId = restored?.payload.operationId ?? createId();
  let payload: StableReceiptPayload | null = restored?.payload ?? null;
  let outcomeUnknown = restored?.outcomeUnknown ?? false;
  return {
    payloadFor(quantity: number, location: string) {
      payload ??= { operationId, quantity, location };
      return payload;
    },
    currentPayload() {
      return payload;
    },
    isOutcomeUnknown() {
      return outcomeUnknown;
    },
    markOutcomeUnknown() {
      outcomeUnknown = true;
    },
    reset() {
      operationId = createId();
      payload = null;
      outcomeUnknown = false;
    },
  };
}

export interface ReceiptAttemptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function receiptOperationStorageKey(scope: string, itemId: string) {
  return `mission-control:receipt:v1:${encodeURIComponent(scope)}:${encodeURIComponent(itemId)}`;
}

export function persistReceiptOperation(storage: ReceiptAttemptStorage | undefined, scope: string, itemId: string, payload: StableReceiptPayload, status: "pending" | "acknowledged" = "pending") {
  if (!storage) return false;
  const key = receiptOperationStorageKey(scope, itemId);
  const value = JSON.stringify({ version: 1, scope, itemId, status, payload });
  try {
    storage.setItem(key, value);
    return storage.getItem(key) === value;
  } catch {
    return false;
  }
}

export type RestoredReceiptOperation =
  | { kind: "none" }
  | { kind: "valid"; payload: StableReceiptPayload }
  | { kind: "acknowledged"; payload: StableReceiptPayload }
  | { kind: "invalid" };

export function restoreReceiptOperation(storage: Pick<Storage, "getItem"> | undefined, scope: string, itemId: string): RestoredReceiptOperation {
  if (!storage) return { kind: "none" };
  try {
    const value = storage.getItem(receiptOperationStorageKey(scope, itemId));
    if (value === null) return { kind: "none" };
    const record = JSON.parse(value) as { version?: unknown; scope?: unknown; itemId?: unknown; status?: unknown; payload?: Partial<StableReceiptPayload> };
    const payload = record.payload;
    if (record.version !== 1 || record.scope !== scope || record.itemId !== itemId || !["pending", "unknown", "acknowledged"].includes(String(record.status)) ||
      !payload || typeof payload.operationId !== "string" || !payload.operationId.trim() || payload.operationId.length > 200 ||
      typeof payload.quantity !== "number" || !Number.isFinite(payload.quantity) || payload.quantity <= 0 || payload.quantity > 1000 ||
      typeof payload.location !== "string" || !payload.location.trim() || payload.location.length > 200) return { kind: "invalid" };
    const stablePayload = { operationId: payload.operationId, quantity: payload.quantity, location: payload.location };
    return record.status === "acknowledged" ? { kind: "acknowledged", payload: stablePayload } : { kind: "valid", payload: stablePayload };
  } catch {
    return { kind: "invalid" };
  }
}

export function reconcileAcknowledgedReceiptOperation(storage: ReceiptAttemptStorage | undefined, scope: string, itemId: string, receipts: Array<{ operationId?: string }> | undefined) {
  const restored = restoreReceiptOperation(storage, scope, itemId);
  if (restored.kind !== "acknowledged") return false;
  if (!(receipts ?? []).some((receipt) => receipt.operationId === restored.payload.operationId)) return true;
  try { storage?.removeItem?.(receiptOperationStorageKey(scope, itemId)); } catch { /* The bootstrap already confirms this operation. */ }
  return false;
}

function isAmbiguous(error: unknown) {
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error
    ? (error as { statusCode?: unknown }).statusCode
    : undefined;
  return typeof statusCode !== "number" || statusCode >= 500;
}

function receiptErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error
    ? (error as { statusCode?: unknown }).statusCode
    : undefined;
  if (statusCode === 401) return "Your session expired. Sign in again before receiving this purchase.";
  if (statusCode === 403) return "Only a mentor or admin can receive this purchase.";
  if (message.includes("location")) return "Use the current stock location for this material.";
  if (message.includes("ordered purchases")) return "Only an ordered purchase can be received.";
  if (message.includes("exceeds the remaining")) return "That quantity is greater than the amount still on the order.";
  if (isAmbiguous(error)) return "We couldn't confirm whether this receipt was recorded. Choose Check again to confirm it safely with the same details.";
  return "This receipt could not be recorded. Check the details and try again.";
}

export async function submitPurchaseReceipt({ write, refresh, acknowledge, hasReceipt, reportError }: SubmitPurchaseReceiptOptions) {
  try {
    await write();
    acknowledge();
    try {
      await refresh();
    } catch {
      reportError("Receipt recorded, but the purchase list could not refresh. Refresh the list to see the latest quantity.");
    }
    return "recorded" as const;
  } catch (error) {
    try {
      await refresh();
      if (hasReceipt()) {
        acknowledge();
        return "recorded" as const;
      }
    } catch {
      // Keep the operation available for an idempotent retry when its outcome is unknown.
    }
    reportError(receiptErrorMessage(error));
    return isAmbiguous(error) ? "unknown" as const : "rejected" as const;
  }
}

export async function submitPersistedPurchaseReceipt(options: SubmitPurchaseReceiptOptions & {
  storage: ReceiptAttemptStorage | undefined;
  scope: string;
  itemId: string;
  payload: StableReceiptPayload;
}) {
  if (!persistReceiptOperation(options.storage, options.scope, options.itemId, options.payload)) {
    options.reportError("We couldn't save this receipt safely. Check your browser storage settings and try again.");
    return "not-sent" as const;
  }
  return submitPurchaseReceipt(options);
}
