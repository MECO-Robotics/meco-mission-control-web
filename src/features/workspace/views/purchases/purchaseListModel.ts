import { formatCurrency } from "@/lib/appUtils/common";
import { filterSelectionIncludes, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { PurchaseItemRecord } from "@/types/recordsInventory";

export const PURCHASE_COLUMNS = [
  { field: "item", label: "Item" },
  { field: "vendor", label: "Vendor" },
  { field: "quantity", label: "Qty" },
  { field: "status", label: "Status" },
  { field: "mentor", label: "Mentor" },
  { field: "estimated", label: "Est." },
  { field: "final", label: "Final" },
] as const;
export type PurchaseColumn = (typeof PURCHASE_COLUMNS)[number]["field"];
export type PurchaseColumnFilters = Partial<Record<PurchaseColumn, FilterSelection>>;

export function getPurchaseColumnValue(item: PurchaseItemRecord, field: PurchaseColumn): string | number {
  switch (field) {
    case "item": return item.title;
    case "vendor": return item.vendor;
    case "quantity": return item.quantity;
    case "status": return item.status;
    case "mentor": return item.approvedByMentor ? "Approved" : "Waiting";
    case "estimated": return item.estimatedCost;
    case "final": return item.finalCost ?? -1;
  }
}

export function getPurchaseFilterValue(item: PurchaseItemRecord, field: PurchaseColumn): string {
  const value = getPurchaseColumnValue(item, field);
  if (field === "estimated" || field === "final") return value === -1 ? "Pending" : formatCurrency(value as number);
  return String(value);
}

export function filterPurchaseItems(items: PurchaseItemRecord[], filters: PurchaseColumnFilters): PurchaseItemRecord[] {
  return items.filter((item) => PURCHASE_COLUMNS.every(({ field }) => filterSelectionIncludes(filters[field] ?? [], getPurchaseFilterValue(item, field))));
}

export function sortPurchaseItems(items: PurchaseItemRecord[], field: PurchaseColumn | null, direction: "ascending" | "descending"): PurchaseItemRecord[] {
  if (!field) return items;
  const multiplier = direction === "ascending" ? 1 : -1;
  return [...items].sort((left, right) => {
    const a = getPurchaseColumnValue(left, field); const b = getPurchaseColumnValue(right, field);
    return multiplier * (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }));
  });
}
