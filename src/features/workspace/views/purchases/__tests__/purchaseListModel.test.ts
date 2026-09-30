import type { TaskRecord } from "@/types/recordsExecution";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { filterPurchaseItems, getPurchaseVendorName, sortPurchaseItems, type PurchaseListContext } from "../purchaseListModel";

const task = (id: string, title: string): TaskRecord => ({
  id, projectId: "robot", workTypeId: "robot:planning", responsibleGroupId: null, workstreamIds: [],
  title, summary: "", subsystemIds: [], mechanismIds: [], partInstanceIds: [], scheduleRefs: [], requestedById: null,
  ownerId: null, assigneeIds: [], mentorId: null, startDate: "", dueDate: "", priority: "medium", status: "not-started",
  checklistItems: [], manufacturingDetails: null, estimatedHours: 0, actualHours: 0, requiresDocumentation: false,
});

const purchase = (id: string, quantity: number, amount: number): PurchaseItemRecord => ({
  id, taskId: `task-${id}`, kind: "cots-goods", partDefinitionId: null, materialId: null, title: `Item ${id}`, quantity,
  quotes: [{ id: `quote-${id}`, vendorId: "vendor", reference: null, amount: { amount, currency: "USD" }, quotedAt: null }],
  selectedQuoteId: `quote-${id}`, approvalStatus: "pending", approvedById: null, approvedAt: null,
  purchaseOrderNumber: null, orderStatus: "not-ordered", finalCost: null, expectedDeliveryDate: null,
  trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null,
});

const context: PurchaseListContext = {
  tasksById: { "task-10": task("task-10", "Buy motor controllers"), "task-2": task("task-2", "Order fasteners") },
  vendorsById: { vendor: { id: "vendor", name: "Vendor" } },
};

describe("purchase list behavior", () => {
  const rows = [purchase("10", 10, 120), purchase("2", 2, 30)];

  it("sorts quantity numerically and procurement work by its linked Task", () => {
    expect(sortPurchaseItems(rows, "quantity", "ascending", context).map(({ id }) => id)).toEqual(["2", "10"]);
    expect(sortPurchaseItems(rows, "task", "ascending", context).map(({ id }) => id)).toEqual(["10", "2"]);
  });

  it("uses the selected quote as the vendor source and filters commercial state", () => {
    expect(getPurchaseVendorName(rows[0], context)).toBe("Vendor");
    expect(filterPurchaseItems(rows, { approval: ["pending"], vendor: ["Vendor"] }, context).map(({ id }) => id)).toEqual(["10", "2"]);
  });

  it("does not invent a vendor when an item has no selected quote", () => {
    const item = { ...rows[0], selectedQuoteId: null };
    expect(getPurchaseVendorName(item, context)).toBe("No selected quote");
  });
});
