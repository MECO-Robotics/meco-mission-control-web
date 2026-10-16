import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { createClientOperationId } from "@/lib/appUtils/clientOperationId";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { createStableReceiptOperation, isDiscretePurchaseReceipt, isValidReceiptQuantity, persistReceiptOperation, receiptOperationStorageKey, reconcileAcknowledgedReceiptOperation, restoreReceiptOperation, submitPersistedPurchaseReceipt, submitPurchaseReceipt, sumReceiptQuantities } from "@/features/workspace/views/purchases/submitPurchaseReceipt";
import { PurchaseTable } from "@/features/workspace/views/purchases/PurchaseTable";
import { receivePurchaseItemRecord } from "@/lib/auth/records/production";
import { requestItem } from "@/lib/auth/records/common";
import { PurchaseEditorFields } from "@/features/workspace/modals/purchaseManufacturing/PurchaseEditorFields";
import { buildEmptyPurchasePayload } from "@/lib/appUtils/catalogPayloadBuilders";

jest.mock("@/lib/auth/records/common", () => ({ requestItem: jest.fn() }));

const item: PurchaseItemRecord = {
  id: "purchase-receive", taskId: "task-build", kind: "cots-goods", partDefinitionId: null, materialId: null,
  title: "Bearing pack", quantity: 4, quotes: [], selectedQuoteId: null, approvalStatus: "approved", approvedById: null,
  approvedAt: null, purchaseOrderNumber: "PO-1", orderStatus: "ordered", finalCost: null, expectedDeliveryDate: null,
  trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null,
  receipts: [{ id: "receipt-1", quantity: 2, location: "Receiving shelf A", receivedAt: "2026-10-15T12:00:00Z", partInstanceIds: ["part-1", "part-2"] }],
};

beforeEach(() => jest.mocked(requestItem).mockReset());

function markup(roleAllowed: boolean, receipts: PurchaseItemRecord["receipts"] = item.receipts) {
  const bootstrap = createBootstrap();
  bootstrap.purchaseItems = [{ ...item, receipts }];
  return renderToStaticMarkup(React.createElement(PurchasesView, { activePersonFilter: [], bootstrap, openCreatePurchaseModal: jest.fn(), openEditPurchaseModal: jest.fn(), canReceivePurchases: roleAllowed }));
}

describe("purchase receiving UI", () => {
  it("shows partial receipts, remaining quantity and location history to mentors", () => {
    const html = markup(true);
    expect(html).toContain("Received 2 of 4");
    expect(html).toContain("2 remaining");
    expect(html).toContain("Receiving shelf A");
    expect(html).toContain('>Receive</button>');
  });

  it("shows normalized decimal totals without floating point remainder noise", () => {
    const html = markup(true, [
      { ...item.receipts![0], id: "fraction-a", quantity: 0.1 },
      { ...item.receipts![0], id: "fraction-b", quantity: 0.2 },
    ]);
    expect(html).toContain("Received 0.3 of 4");
    expect(html).toContain("3.7 remaining");
  });

  it("hides receiving for other roles and after the purchase is fully received", () => {
    const fullReceipts = [{ ...item.receipts![0], quantity: 4 }];
    const fullHtml = markup(true, fullReceipts);
    expect(fullHtml).toContain("Received 4 of 4");
    expect(fullHtml).toContain("0 remaining");
    expect(fullHtml).not.toContain('>Receive</button>');
    expect(markup(false)).not.toContain('>Receive</button>');
  });

  it("allows decimals for materials and services while requiring whole discrete part counts", () => {
    const material = { ...item, materialId: "material-1" };
    const service = { ...item, kind: "manufacturing-service" as const };
    expect(isDiscretePurchaseReceipt(material)).toBe(false);
    expect(isDiscretePurchaseReceipt(service)).toBe(false);
    expect(isValidReceiptQuantity(1.5, 2, false)).toBe(true);
    expect(isValidReceiptQuantity(2, 2, false)).toBe(true);
    expect(isDiscretePurchaseReceipt({ ...item, partDefinitionId: "bearing" })).toBe(true);
    expect(isDiscretePurchaseReceipt({ ...item, partDefinitionId: "bearing", materialId: "steel" })).toBe(true);
    expect(isValidReceiptQuantity(1, 2, true)).toBe(true);
    expect(isValidReceiptQuantity(1.5, 2, true)).toBe(false);
    expect(isValidReceiptQuantity(2.01, 2, false)).toBe(false);
  });

  it("reuses the same operation key and payload for retries until a new receipt is started", () => {
    const ids = ["operation-a", "operation-b"];
    const operation = createStableReceiptOperation(() => ids.shift()!);
    const first = operation.payloadFor(1.5, "Shelf A");
    const retry = operation.payloadFor(2, "Shelf B");
    expect(retry).toBe(first);
    expect(retry).toEqual({ operationId: "operation-a", quantity: 1.5, location: "Shelf A" });
    operation.reset();
    expect(operation.payloadFor(2, "Shelf B")).toEqual({ operationId: "operation-b", quantity: 2, location: "Shelf B" });
  });

  it("creates a usable operation key without secure-context crypto APIs", () => {
    expect(createClientOperationId(undefined)).toMatch(/^operation-[a-z0-9-]+$/);
  });

  it("normalizes decimal receipt sums for remaining quantities", () => {
    expect(sumReceiptQuantities([0.1, 0.2])).toBe(0.3);
  });

  it("restores a validated receipt operation by account and purchase, independent of view filters", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const payload = { operationId: "stable", quantity: 1.5, location: "Shelf A" };
    expect(persistReceiptOperation(storage, "account:account-a", item.id, payload)).toBe(true);
    expect(restoreReceiptOperation(storage, "account:account-a", item.id)).toEqual({ kind: "valid", payload });
    expect(restoreReceiptOperation(storage, "account:account-b", item.id)).toEqual({ kind: "none" });
    values.set(receiptOperationStorageKey("account:account-a", item.id), JSON.stringify({ version: 1, scope: "account:account-a", itemId: item.id, status: "pending", payload: { ...payload, quantity: "1.5" } }));
    expect(restoreReceiptOperation(storage, "account:account-a", item.id)).toEqual({ kind: "invalid" });
  });

  it("keeps a successful receipt locked across a failed refresh and remount until bootstrap confirms its operation", async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    const scope = "account:account-a";
    const payload = { operationId: "accepted-receipt", quantity: 1, location: "Shelf A" };
    const reportError = jest.fn();
    const outcome = await submitPersistedPurchaseReceipt({
      storage, scope, itemId: item.id, payload,
      write: async () => undefined,
      refresh: async () => { throw new Error("Refresh failed"); },
      acknowledge: () => { persistReceiptOperation(storage, scope, item.id, payload, "acknowledged"); },
      hasReceipt: () => false,
      reportError,
    });
    expect(outcome).toBe("recorded");
    expect(reportError).toHaveBeenCalledWith(expect.stringContaining("Receipt recorded"));
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    try {
      const bootstrap = createBootstrap();
      bootstrap.purchaseItems = [{ ...item }];
      let viewScope = "all-projects/all-seasons";
      const render = () => renderToStaticMarkup(React.createElement(PurchasesView, { activePersonFilter: [], bootstrap, receiptOperationScope: scope, receiptViewScope: viewScope, openCreatePurchaseModal: jest.fn(), openEditPurchaseModal: jest.fn(), canReceivePurchases: true }));
      expect(render()).not.toContain(">Receive</button>");
      expect(reconcileAcknowledgedReceiptOperation(storage, scope, item.id, item.receipts)).toBe(true);
      viewScope = "purchase-project/current-season";
      expect(render()).not.toContain(">Receive</button>");

      bootstrap.purchaseItems = [{ ...item, receipts: [...(item.receipts ?? []), { ...item.receipts![0]!, id: "accepted-receipt-row", operationId: payload.operationId, quantity: payload.quantity }] }];
      expect(render()).toContain(">Receive</button>");
      expect(restoreReceiptOperation(storage, scope, item.id)).toEqual({ kind: "none" });
      expect(createStableReceiptOperation(() => "next-receipt").payloadFor(1, "Shelf B").operationId).toBe("next-receipt");
    } finally {
      if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  it("isolates acknowledged receipt locks by account and keeps the same operation identity across project filters", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    const payload = { operationId: "same-operation", quantity: 1, location: "Shelf A" };
    persistReceiptOperation(storage, "account:account-a", item.id, payload, "acknowledged");
    expect(reconcileAcknowledgedReceiptOperation(storage, "account:account-a", item.id, item.receipts)).toBe(true);
    expect(reconcileAcknowledgedReceiptOperation(storage, "account:account-b", item.id, item.receipts)).toBe(false);
    expect(restoreReceiptOperation(storage, "account:account-a", item.id)).toEqual({ kind: "acknowledged", payload });
  });

  it("requires durable storage before the receipt API flow may write", () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    const payload = { operationId: "stable", quantity: 1, location: "Shelf A" };
    expect(persistReceiptOperation(storage, "account/project/season", item.id, payload)).toBe(false);
  });

  it("persists the exact attempt before calling the receipt API route", async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const payload = { operationId: "persist-first", quantity: 1.5, location: "Shelf A" };
    jest.mocked(requestItem).mockImplementation(async () => {
      expect(restoreReceiptOperation(storage, "account/project/season", item.id)).toEqual({ kind: "valid", payload });
      return {} as never;
    });
    const outcome = await submitPersistedPurchaseReceipt({
      storage,
      scope: "account/project/season",
      itemId: item.id,
      payload,
      write: () => receivePurchaseItemRecord(item.id, payload),
      refresh: async () => undefined,
      acknowledge: jest.fn(),
      hasReceipt: () => false,
      reportError: jest.fn(),
    });
    expect(outcome).toBe("recorded");
    expect(requestItem).toHaveBeenCalledWith(`/purchases/${item.id}/receipts`, "POST", payload, undefined);
  });

  it("does not call the receipt API when browser storage cannot save the attempt", async () => {
    const reportError = jest.fn();
    const write = jest.fn();
    const outcome = await submitPersistedPurchaseReceipt({
      storage: { getItem: () => null, setItem: () => { throw new Error("quota"); } },
      scope: "account/project/season",
      itemId: item.id,
      payload: { operationId: "not-sent", quantity: 1, location: "Shelf A" },
      write,
      refresh: async () => undefined,
      acknowledge: jest.fn(),
      hasReceipt: () => false,
      reportError,
    });
    expect(outcome).toBe("not-sent");
    expect(write).not.toHaveBeenCalled();
    expect(requestItem).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledWith(expect.stringContaining("save this receipt safely"));
  });

  it("reuses the accepted operation and immutable payload when acknowledgment storage and refresh both fail", async () => {
    const values = new Map<string, string>();
    let writes = 0;
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        writes += 1;
        if (writes === 2) throw new Error("acknowledgment storage failed");
        values.set(key, value);
      },
    };
    const payload = { operationId: "accepted-but-pending", quantity: 1.5, location: "Shelf A" };
    const write = jest.fn().mockResolvedValue(undefined);
    const reportError = jest.fn();
    const outcome = await submitPersistedPurchaseReceipt({
      storage, scope: "account:account-a", itemId: item.id, payload,
      write,
      refresh: async () => { throw new Error("Refresh failed"); },
      acknowledge: () => { persistReceiptOperation(storage, "account:account-a", item.id, payload, "acknowledged"); },
      hasReceipt: () => false,
      reportError,
    });
    expect(outcome).toBe("recorded");
    expect(write).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(expect.stringContaining("Receipt recorded"));

    const restored = restoreReceiptOperation(storage, "account:account-a", item.id);
    expect(restored).toEqual({ kind: "valid", payload });
    const createId = jest.fn(() => "different-operation");
    const remountedOperation = createStableReceiptOperation(createId, { payload: restored.kind === "valid" ? restored.payload : payload, outcomeUnknown: true });
    expect(remountedOperation.payloadFor(3, "Different shelf")).toEqual(payload);
    expect(createId).not.toHaveBeenCalled();
  });

  it("retains an uncertain operation and its original details when the receive form is reopened", () => {
    const operation = createStableReceiptOperation(() => "operation-a");
    const savedPayload = operation.payloadFor(1.5, "Shelf A");
    operation.markOutcomeUnknown();
    expect(operation.currentPayload()).toBe(savedPayload);
    expect(operation.isOutcomeUnknown()).toBe(true);
    expect(operation.payloadFor(9, "Shelf B")).toBe(savedPayload);
    const restored = createStableReceiptOperation(() => "new-operation", { payload: savedPayload, outcomeUnknown: true });
    expect(restored.currentPayload()).toEqual(savedPayload);
    expect(restored.payloadFor(9, "Shelf B")).toEqual(savedPayload);
    expect(restored.isOutcomeUnknown()).toBe(true);
  });

  it("confirms a receipt after an ambiguous response without issuing a second write", async () => {
    const write = jest.fn().mockRejectedValue(new Error("connection lost"));
    const refresh = jest.fn().mockResolvedValue(true);
    const acknowledge = jest.fn();
    const reportError = jest.fn();
    const outcome = await submitPurchaseReceipt({ write, refresh, acknowledge, hasReceipt: () => true, reportError });
    expect(outcome).toBe("recorded");
    expect(write).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(acknowledge).toHaveBeenCalledTimes(1);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("keeps the receipt retryable with the same user details when the result stays unknown", async () => {
    const write = jest.fn().mockRejectedValue(new Error("connection lost"));
    const refresh = jest.fn().mockResolvedValue(true);
    const acknowledge = jest.fn();
    const reportError = jest.fn();
    const outcome = await submitPurchaseReceipt({ write, refresh, acknowledge, hasReceipt: () => false, reportError });
    expect(outcome).toBe("unknown");
    expect(reportError).toHaveBeenCalledWith(expect.stringContaining("couldn't confirm"));
    expect(acknowledge).not.toHaveBeenCalled();
  });

  it("keeps an acknowledged receipt locked and reports refresh failure without retrying the write", async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const refreshError = new Error("Workspace refresh failed");
    const refresh = jest.fn().mockRejectedValue(refreshError);
    const acknowledge = jest.fn();
    const reportError = jest.fn();

    const outcome = await submitPurchaseReceipt({ write, refresh, acknowledge, hasReceipt: () => false, reportError });

    expect(outcome).toBe("recorded");
    expect(write).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(acknowledge).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(expect.stringContaining("Receipt recorded"));
    expect(markup(true)).toContain('>Receive</button>');
    const acknowledgedBootstrap = createBootstrap();
    acknowledgedBootstrap.purchaseItems = [{ ...item }];
    const lockedHtml = renderToStaticMarkup(React.createElement(PurchaseTable, {
      bootstrap: acknowledgedBootstrap,
      filteredPurchases: acknowledgedBootstrap.purchaseItems,
      filterMotionClass: "",
      hasPurchaseFilters: false,
      context: { tasksById: {}, vendorsById: {} },
      openEditPurchaseModal: jest.fn(),
      pagination: { pageItems: acknowledgedBootstrap.purchaseItems, page: 1, pageSize: 15, pageSizeOptions: [15, 30, 60], rangeStart: 1, rangeEnd: 1, totalItems: 1, totalPages: 1, setPage: jest.fn(), setPageSize: jest.fn() },
      columnFilters: {},
      columnOptions: { item: [], task: [], vendor: [], quantity: [], approval: [], order: [], final: [] },
      setColumnFilter: jest.fn(),
      sortField: "item",
      sortDirection: "ascending",
      onSort: jest.fn(),
      canReceivePurchases: true,
      onReceive: jest.fn(),
      acknowledgedReceiptIds: new Set([item.id]),
    }));
    expect(lockedHtml).not.toContain('>Receive</button>');
  });
});

it("uses whole-count validation only when a physical part definition is linked", () => {
  const bootstrap = createBootstrap();
  const draft = { ...buildEmptyPurchasePayload(bootstrap), quantity: 1.5 };
  const renderQuantity = (purchaseDraft: typeof draft) => renderToStaticMarkup(React.createElement(PurchaseEditorFields, {
    bootstrap, activePurchaseId: null, purchaseDraft, purchaseFinalCost: "", setPurchaseDraft: jest.fn(), setPurchaseFinalCost: jest.fn(),
  }));
  expect(renderQuantity(draft)).toContain('min="1" step="1" type="number"');
  expect(renderQuantity({ ...draft, materialId: "material-aluminum" })).toContain('min="1" step="1" type="number"');
  expect(renderQuantity({ ...draft, partDefinitionId: null, materialId: "material-aluminum" })).toContain('min="1" step="any" type="number"');
  expect(renderQuantity({ ...draft, kind: "manufacturing-service" })).toContain('min="1" step="any" type="number"');
});
