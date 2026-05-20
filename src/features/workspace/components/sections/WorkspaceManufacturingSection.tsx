import { CncView } from "@/features/workspace/views/manufacturing/CncView";
import { FabricationView } from "@/features/workspace/views/manufacturing/FabricationView";
import { PrintsView } from "@/features/workspace/views/manufacturing/PrintsView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceManufacturingSection(props: WorkspaceContentPanelsViewProps) {
  const {
    activePersonFilter,
    bootstrap,
    cncItems,
    disablePanelAnimations = false,
    fabricationItems,
    manufacturingSwipeDirection,
    manufacturingView,
    membersById,
    onCncQuickStatusChange,
    openEditManufacturingModal,
    printItems,
    showCncMentorQuickActions,
    tabSwitchDirection,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "manufacturing"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={manufacturingView === "cnc"}
        swipeDirection={manufacturingSwipeDirection}
      >
        <CncView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          items={cncItems}
          membersById={membersById}
          onCreate={() => props.openCreateManufacturingModal("cnc")}
          onEdit={openEditManufacturingModal}
          onQuickStatusChange={onCncQuickStatusChange}
          showMentorQuickActions={showCncMentorQuickActions}
          subsystemsById={props.subsystemsById}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={manufacturingView === "prints"}
        swipeDirection={manufacturingSwipeDirection}
      >
        <PrintsView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          items={printItems}
          membersById={membersById}
          onCreate={() => props.openCreateManufacturingModal("3d-print")}
          onEdit={openEditManufacturingModal}
          subsystemsById={props.subsystemsById}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={manufacturingView === "fabrication"}
        swipeDirection={manufacturingSwipeDirection}
      >
        <FabricationView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          items={fabricationItems}
          membersById={membersById}
          onCreate={() => props.openCreateManufacturingModal("fabrication")}
          onEdit={openEditManufacturingModal}
          subsystemsById={props.subsystemsById}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
