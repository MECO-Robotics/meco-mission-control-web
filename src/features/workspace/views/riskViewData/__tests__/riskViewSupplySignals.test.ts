/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildRiskViewSupplySignals } from "../riskViewSupplySignals";

const purchase = (id: string, status: "requested" | "delivered") => ({
  id,
  title: id,
  subsystemId: "subsystem-1",
  requestedById: null,
  partDefinitionId: null,
  quantity: 1,
  vendor: "",
  linkLabel: "",
  estimatedCost: 0,
  approvedByMentor: false,
  status,
});

describe("risk view supply signals", () => {
  it("limits purchases to the filtered tasks while keeping stock alerts global", () => {
    const bootstrap = {
      ...EMPTY_BOOTSTRAP,
      purchaseItems: [purchase("linked", "requested"), purchase("unlinked", "requested")],
      materials: [{
        id: "stock",
        name: "Aluminum",
        category: "metal" as const,
        unit: "sheet",
        onHandQuantity: 0,
        reorderPoint: 1,
        location: "Rack",
        vendor: "",
        notes: "",
      }],
    };
    const metrics = buildRiskViewSupplySignals({
      activePersonFilter: ["member-1"],
      bootstrap,
      scopedTasks: [{ linkedPurchaseIds: ["linked"] }],
    });

    expect(metrics).toEqual({ lowStockMaterials: 1, pendingPurchaseCount: 1, supplySignals: 2 });
    expect(buildRiskViewSupplySignals({ activePersonFilter: [], bootstrap, scopedTasks: [] }).pendingPurchaseCount).toBe(2);
  });
});
