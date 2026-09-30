/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildRiskViewSupplySignals } from "../riskViewSupplySignals";

const purchase = (id: string, taskId: string, orderStatus: "not-ordered" | "delivered") => ({
  id,
  taskId,
  kind: "cots-goods" as const,
  partDefinitionId: null,
  materialId: null,
  title: id,
  quantity: 1,
  quotes: [],
  selectedQuoteId: null,
  approvalStatus: "pending" as const,
  approvedById: null,
  approvedAt: null,
  purchaseOrderNumber: null,
  orderStatus,
  finalCost: null,
  expectedDeliveryDate: null,
  trackingNumber: null,
  trackingUrl: null,
  orderedAt: null,
  deliveredAt: null,
});

describe("risk view supply signals", () => {
  it("limits purchases to the filtered tasks while keeping stock alerts global", () => {
    const bootstrap = {
      ...EMPTY_BOOTSTRAP,
      purchaseItems: [purchase("linked", "task-1", "not-ordered"), purchase("unlinked", "task-2", "not-ordered")],
      materials: [{
        id: "stock",
        name: "Aluminum",
        category: "metal" as const,
        unit: "sheet",
        onHandQuantity: 0,
        reorderPoint: 1,
        location: "Rack",
        preferredVendorId: null,
        notes: "",
      }],
    };
    const metrics = buildRiskViewSupplySignals({
      activePersonFilter: ["member-1"],
      bootstrap,
      scopedTasks: [{ id: "task-1" }],
    });

    expect(metrics).toEqual({ lowStockMaterials: 1, pendingPurchaseCount: 1, supplySignals: 2 });
    expect(buildRiskViewSupplySignals({ activePersonFilter: [], bootstrap, scopedTasks: [] }).pendingPurchaseCount).toBe(2);
  });
});
