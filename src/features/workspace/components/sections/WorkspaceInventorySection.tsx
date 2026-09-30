import { MaterialsView } from "@/features/workspace/views/MaterialsView";
import { PartsView } from "@/features/workspace/views/PartsView";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceInventorySection(props: WorkspaceContentPanelsViewProps) {
  const {
    bootstrap,
    disablePanelAnimations = false,
    effectiveInventoryView,
    inventorySwipeDirection,
    isNonRobotProject,
    openCreateMaterialModal,
    openCreatePartInstanceModal,
    openCreatePartDefinitionModal,
    openCreatePurchaseModal,
    openEditMaterialModal,
    openEditPartDefinitionModal,
    openEditPurchaseModal,
    partDefinitionsById,
    mechanismsById,
    tabSwitchDirection,
    subsystemsById,
    activePersonFilter,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "inventory"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={effectiveInventoryView === "materials"}
        swipeDirection={inventorySwipeDirection}
      >
        <MaterialsView
          bootstrap={bootstrap}
          openCreateMaterialModal={openCreateMaterialModal}
          openEditMaterialModal={openEditMaterialModal}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={!isNonRobotProject && (effectiveInventoryView === "parts" || effectiveInventoryView === "part-mappings")}
        swipeDirection={inventorySwipeDirection}
      >
        <PartsView
          bootstrap={bootstrap}
          openCreatePartDefinitionModal={openCreatePartDefinitionModal}
          openEditPartDefinitionModal={openEditPartDefinitionModal}
          openCreatePartInstanceModal={openCreatePartInstanceModal}
          openEditPartInstanceModal={props.openEditPartInstanceModal}
          mechanismsById={mechanismsById}
          partDefinitionsById={partDefinitionsById}
          subsystemsById={subsystemsById}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={effectiveInventoryView === "purchases"}
        swipeDirection={inventorySwipeDirection}
      >
        <PurchasesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          openCreatePurchaseModal={openCreatePurchaseModal}
          openEditPurchaseModal={openEditPurchaseModal}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
