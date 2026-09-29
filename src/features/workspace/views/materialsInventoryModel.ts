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
) {
  const search = filters.search.trim().toLowerCase();

  return materials.filter((material) => {
    const quantity = `${material.onHandQuantity} / ${material.reorderPoint}`;
    const location = material.location || "Unassigned";
    const vendor = material.vendor || "Unknown";
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
