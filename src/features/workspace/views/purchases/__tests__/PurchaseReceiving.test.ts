import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { submitPurchaseReceipt } from "@/features/workspace/views/purchases/submitPurchaseReceipt";
import { PurchaseTable } from "@/features/workspace/views/purchases/PurchaseTable";

const item: PurchaseItemRecord = {
  id: "purchase-receive", taskId: "task-build", kind: "cots-goods", partDefinitionId: null, materialId: null,
  title: "Bearing pack", quantity: 4, quotes: [], selectedQuoteId: null, approvalStatus: "approved", approvedById: null,
  approvedAt: null, purchaseOrderNumber: "PO-1", orderStatus: "ordered", finalCost: null, expectedDeliveryDate: null,
  trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null,
  receipts: [{ id: "receipt-1", quantity: 2, location: "Receiving shelf A", receivedAt: "2026-10-15T12:00:00Z", partInstanceIds: ["part-1", "part-2"] }],
};

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

  it("hides receiving for other roles and after the purchase is fully received", () => {
    const fullReceipts = [{ ...item.receipts![0], quantity: 4 }];
    const fullHtml = markup(true, fullReceipts);
    expect(fullHtml).toContain("Received 4 of 4");
    expect(fullHtml).toContain("0 remaining");
    expect(fullHtml).not.toContain('>Receive</button>');
    expect(markup(false)).not.toContain('>Receive</button>');
  });

  it("keeps an acknowledged receipt locked and reports refresh failure without retrying the write", async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const refreshError = new Error("Workspace refresh failed");
    const refresh = jest.fn().mockRejectedValue(refreshError);
    const acknowledge = jest.fn();
    const reportError = jest.fn();

    await submitPurchaseReceipt({ write, refresh, acknowledge, reportError });

    expect(write).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(acknowledge).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(refreshError);
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
      acknowledgedReceiptId: item.id,
    }));
    expect(lockedHtml).not.toContain('>Receive</button>');
  });
});
