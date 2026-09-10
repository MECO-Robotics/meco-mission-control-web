import { ManufacturingQueueView } from "@/features/workspace/views/manufacturing/ManufacturingQueueView";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceManufacturingSection(props: WorkspaceContentPanelsViewProps) {
  const process = props.manufacturingView === "prints" ? "3d-print" : props.manufacturingView === "fabrication" ? "fabrication" : "cnc";
  return (
    <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "manufacturing"} tabSwitchDirection={props.tabSwitchDirection}>
      <ManufacturingQueueView
        activePersonFilter={props.activePersonFilter}
        addButtonAriaLabel="Add manufacturing job"
        bootstrap={props.bootstrap}
        emptyStateMessage="No manufacturing jobs match the current filters."
        items={props.bootstrap.manufacturingItems}
        membersById={props.membersById}
        onCreate={() => props.openCreateManufacturingModal(process)}
        onEdit={props.openEditManufacturingModal}
        onProcessFilterChange={props.setManufacturingView}
        onQuickStatusChange={props.onCncQuickStatusChange}
        processFilterValue={props.manufacturingView}
        showMentorQuickActions={props.showCncMentorQuickActions}
        showInHouseColumn
        subsystemsById={props.subsystemsById}
        title="Manufacturing"
        tutorialTargetPrefix="manufacturing"
      />
    </WorkspaceSectionPanel>
  );
}
