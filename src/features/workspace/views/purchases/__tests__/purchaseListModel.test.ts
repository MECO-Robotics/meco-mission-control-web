import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { filterPurchaseItems, sortPurchaseItems } from "../purchaseListModel";

const purchase = (id: string, quantity: number, estimatedCost: number): PurchaseItemRecord => ({
  id, title: `Item ${id}`, subsystemId: "subsystem", requestedById: null, partDefinitionId: null,
  quantity, vendor: "Vendor", linkLabel: "", estimatedCost, approvedByMentor: false, status: "requested",
});

describe("purchase list behavior", () => {
  const rows = [purchase("10", 10, 120), purchase("2", 2, 30)];

  it("sorts numeric purchase fields numerically in either direction", () => {
    expect(sortPurchaseItems(rows, "quantity", "ascending").map(({ id }) => id)).toEqual(["2", "10"]);
    expect(sortPurchaseItems(rows, "estimated", "descending").map(({ id }) => id)).toEqual(["10", "2"]);
  });

  it("filters on the displayed value of purchase columns", () => {
    expect(filterPurchaseItems(rows, { quantity: ["2"], mentor: ["Waiting"] }).map(({ id }) => id)).toEqual(["2"]);
  });
});
