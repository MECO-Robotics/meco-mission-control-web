import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export function buildRiskViewSupplySignals(args: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  scopedTasks: Array<Pick<BootstrapPayload["tasks"][number], "id">>;
}) {
  const scopedTaskIds = new Set(args.scopedTasks.map((task) => task.id));
  const purchases = args.activePersonFilter.length > 0
    ? args.bootstrap.purchaseItems.filter((purchase) => scopedTaskIds.has(purchase.taskId))
    : args.bootstrap.purchaseItems;
  const pendingPurchaseCount = purchases.filter((purchase) => !["delivered", "cancelled"].includes(purchase.orderStatus)).length;
  const lowStockMaterials = args.bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;

  return {
    lowStockMaterials,
    pendingPurchaseCount,
    supplySignals: pendingPurchaseCount + lowStockMaterials,
  };
}
