import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export function buildRiskViewSupplySignals(args: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  scopedTasks: Array<Pick<BootstrapPayload["tasks"][number], "linkedPurchaseIds">>;
}) {
  const linkedPurchaseIds = new Set(args.scopedTasks.flatMap((task) => task.linkedPurchaseIds ?? []));
  const purchases = args.activePersonFilter.length > 0 && linkedPurchaseIds.size > 0
    ? args.bootstrap.purchaseItems.filter((purchase) => linkedPurchaseIds.has(purchase.id))
    : args.bootstrap.purchaseItems;
  const pendingPurchaseCount = purchases.filter((purchase) => purchase.status !== "delivered").length;
  const lowStockMaterials = args.bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;

  return {
    lowStockMaterials,
    pendingPurchaseCount,
    supplySignals: pendingPurchaseCount + lowStockMaterials,
  };
}
