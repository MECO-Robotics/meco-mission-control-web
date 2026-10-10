import { filterSelectionIncludes, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { PurchaseApprovalStatus, PurchaseOrderStatus } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";
import type { PurchaseItemRecord } from "@/types/recordsInventory";

export const PURCHASE_COLUMNS = [
  { field: "item", label: "Item" },
  { field: "task", label: "Procurement task" },
  { field: "vendor", label: "Vendor" },
  { field: "quantity", label: "Qty" },
  { field: "approval", label: "Approval" },
  { field: "order", label: "Order" },
  { field: "final", label: "Final cost" },
] as const;
export type PurchaseColumn = (typeof PURCHASE_COLUMNS)[number]["field"];
export type PurchaseColumnFilters = Partial<Record<PurchaseColumn, FilterSelection>>;

export interface PurchaseListContext {
  tasksById: Record<string, TaskRecord>;
  vendorsById: Record<string, { id: string; name: string }>;
}

export function getSelectedPurchaseQuote(item: PurchaseItemRecord) {
  return item.quotes.find((quote) => quote.id === item.selectedQuoteId) ?? null;
}

export function getPurchaseVendorName(item: PurchaseItemRecord, context: PurchaseListContext) {
  const quote = getSelectedPurchaseQuote(item);
  return quote ? context.vendorsById[quote.vendorId]?.name ?? "Unknown vendor" : "No selected quote";
}

export function getPurchaseColumnValue(item: PurchaseItemRecord, field: PurchaseColumn, context: PurchaseListContext): string | number {
  switch (field) {
    case "item": return item.title;
    case "task": return context.tasksById[item.taskId]?.title ?? "Missing procurement task";
    case "vendor": return getPurchaseVendorName(item, context);
    case "quantity": return item.quantity;
    case "approval": return item.approvalStatus;
    case "order": return item.orderStatus;
    case "final": return item.finalCost?.amount ?? -1;
  }
}

export function getPurchaseFilterValue(item: PurchaseItemRecord, field: PurchaseColumn, context: PurchaseListContext): string {
  const value = getPurchaseColumnValue(item, field, context);
  if (field === "final") return value === -1 ? "Pending" : `${value} ${item.finalCost?.currency ?? ""}`.trim();
  return String(value);
}

export function filterPurchaseItems(items: PurchaseItemRecord[], filters: PurchaseColumnFilters, context: PurchaseListContext): PurchaseItemRecord[] {
  return items.filter((item) => PURCHASE_COLUMNS.every(({ field }) => filterSelectionIncludes(filters[field] ?? [], getPurchaseFilterValue(item, field, context))));
}

export function sortPurchaseItems(items: PurchaseItemRecord[], field: PurchaseColumn | null, direction: "ascending" | "descending", context: PurchaseListContext): PurchaseItemRecord[] {
  if (!field) return items;
  const multiplier = direction === "ascending" ? 1 : -1;
  return [...items].sort((left, right) => {
    const a = getPurchaseColumnValue(left, field, context); const b = getPurchaseColumnValue(right, field, context);
    return multiplier * (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }));
  });
}

export const PURCHASE_ORDER_STATUS_OPTIONS: Array<{ id: PurchaseOrderStatus; name: string }> = [
  { id: "not-ordered", name: "Not ordered" },
  { id: "ordered", name: "Ordered" },
  { id: "shipped", name: "Shipped" },
  { id: "delivered", name: "Delivered" },
  { id: "cancelled", name: "Cancelled" },
];

export const PURCHASE_APPROVAL_STATUS_OPTIONS: Array<{ id: PurchaseApprovalStatus; name: string }> = [
  { id: "pending", name: "Pending" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
];
