import type { MaterialRecord } from "@/types/recordsInventory";

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
