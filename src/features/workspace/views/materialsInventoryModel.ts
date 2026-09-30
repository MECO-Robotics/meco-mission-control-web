import type { MaterialRecord } from "@/types/recordsInventory";
import { filterSelectionIncludes } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export interface MaterialInventoryFilters {
  search: string;
  name: string[];
  category: string[];
  quantity: string[];
  location: string[];
  vendor: string[];
  stock: string[];
}

export type MaterialSortField = "name" | "category" | "quantity" | "location" | "vendor" | "status";
export type MaterialSortDirection = "ascending" | "descending";

type MaterialStockValues = Pick<MaterialRecord, "onHandQuantity" | "reorderPoint">;

export function isMaterialBelowReorder(material: MaterialStockValues) {
  return material.onHandQuantity < material.reorderPoint;
}

export function matchesMaterialStockFilter(material: MaterialStockValues, filters: string[]) {
  if (filters.length === 0) {
    return true;
  }

  const isBelowReorder = isMaterialBelowReorder(material);
  const isLowStock = material.onHandQuantity <= material.reorderPoint;

  return filters.some((filter) => {
    if (filter === "below-reorder") {
      return isBelowReorder;
    }
    if (filter === "low") {
      return isLowStock;
    }
    if (filter === "ok") {
      return !isLowStock;
    }
    return false;
  });
}

export function filterMaterialInventory(
  materials: MaterialRecord[],
  filters: MaterialInventoryFilters,
  vendorNames: Record<string, string> = {},
) {
  const search = filters.search.trim().toLowerCase();

  return materials.filter((material) => {
    const quantity = `${material.onHandQuantity} / ${material.reorderPoint}`;
    const location = material.location || "Unassigned";
    const vendor = material.preferredVendorId ? vendorNames[material.preferredVendorId] ?? "Unknown vendor" : "No preferred vendor";
    const matchesSearch =
      !search ||
      material.name.toLowerCase().includes(search) ||
      vendor.toLowerCase().includes(search) ||
      location.toLowerCase().includes(search);

    return (
      matchesSearch &&
      filterSelectionIncludes(filters.name, material.name) &&
      filterSelectionIncludes(filters.category, material.category) &&
      filterSelectionIncludes(filters.quantity, quantity) &&
      filterSelectionIncludes(filters.location, location) &&
      filterSelectionIncludes(filters.vendor, vendor) &&
      matchesMaterialStockFilter(material, filters.stock)
    );
  });
}

export function sortMaterialInventory(
  materials: MaterialRecord[],
  field: MaterialSortField,
  direction: MaterialSortDirection,
  vendorNames: Record<string, string> = {},
) {
  const multiplier = direction === "ascending" ? 1 : -1;
  const compare = (left: MaterialRecord, right: MaterialRecord) => {
    let result = 0;

    switch (field) {
      case "name":
        result = left.name.localeCompare(right.name, undefined, { numeric: true });
        break;
      case "category":
        result = left.category.localeCompare(right.category, undefined, { numeric: true });
        break;
      case "quantity":
        result = left.onHandQuantity - right.onHandQuantity || left.reorderPoint - right.reorderPoint;
        break;
      case "location":
        result = (left.location || "Unassigned").localeCompare(right.location || "Unassigned", undefined, { numeric: true });
        break;
      case "vendor":
        result = (left.preferredVendorId ? vendorNames[left.preferredVendorId] ?? "Unknown vendor" : "No preferred vendor").localeCompare(right.preferredVendorId ? vendorNames[right.preferredVendorId] ?? "Unknown vendor" : "No preferred vendor", undefined, { numeric: true });
        break;
      case "status":
        result = Number(matchesMaterialStockFilter(left, ["low"])) - Number(matchesMaterialStockFilter(right, ["low"]));
        break;
    }

    return multiplier * (result || left.name.localeCompare(right.name, undefined, { numeric: true }));
  };

  return [...materials].sort(compare);
}
