import type { InventoryViewTab, NavigationTarget } from "@/lib/workspaceNavigation";
import type { WorkspaceContentProps } from "../WorkspaceContent";

export type SwipeDirection = "left" | "right" | null;

export type WorkspaceContentPanelsViewProps = WorkspaceContentProps & {
  effectiveInventoryView: InventoryViewTab;
  onOpenDrilldownTarget: (target: NavigationTarget) => void;
  taskSwipeDirection: SwipeDirection;
  reportsSwipeDirection: SwipeDirection;
  manufacturingSwipeDirection: SwipeDirection;
  inventorySwipeDirection: SwipeDirection;
};
