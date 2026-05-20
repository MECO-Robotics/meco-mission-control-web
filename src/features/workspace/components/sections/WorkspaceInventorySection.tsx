import { ArtifactInventoryView } from "@/features/workspace/views/ArtifactInventoryView";
import { MaterialsView } from "@/features/workspace/views/MaterialsView";
import { PartsView } from "@/features/workspace/views/PartsView";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const DOCUMENT_ARTIFACT_KINDS: readonly ["document", "nontechnical"] = ["document", "nontechnical"];

export function WorkspaceInventorySection(props: WorkspaceContentPanelsViewProps) {
  const {
    artifacts,
    bootstrap,
    disablePanelAnimations = false,
    effectiveInventoryView,
    inventorySwipeDirection,
    isNonRobotProject,
    openCreateArtifactModal,
    openCreateMaterialModal,
    openCreatePartDefinitionModal,
    openCreatePurchaseModal,
    openEditArtifactModal,
    openEditMaterialModal,
    openEditPartDefinitionModal,
    openEditPurchaseModal,
    partDefinitionsById,
    mechanismsById,
    membersById,
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
        {isNonRobotProject ? (
          <ArtifactInventoryView
            artifacts={artifacts}
            bootstrap={bootstrap}
            createKind="document"
            kinds={DOCUMENT_ARTIFACT_KINDS}
            openCreateArtifactModal={openCreateArtifactModal}
            openEditArtifactModal={openEditArtifactModal}
            title="Documents"
          />
        ) : (
          <MaterialsView
            bootstrap={bootstrap}
            openCreateMaterialModal={openCreateMaterialModal}
            openEditMaterialModal={openEditMaterialModal}
          />
        )}
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={!isNonRobotProject && effectiveInventoryView === "parts"}
        swipeDirection={inventorySwipeDirection}
      >
        <PartsView
          bootstrap={bootstrap}
          openCreatePartDefinitionModal={openCreatePartDefinitionModal}
          openEditPartDefinitionModal={openEditPartDefinitionModal}
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
          membersById={membersById}
          openCreatePurchaseModal={openCreatePurchaseModal}
          openEditPurchaseModal={openEditPurchaseModal}
          subsystemsById={subsystemsById}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
