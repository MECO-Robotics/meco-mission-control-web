import { SubsystemsView } from "@/features/workspace/views/SubsystemsView";
import { WorkflowView } from "@/features/workspace/views/WorkflowView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceSubsystemsSection(props: WorkspaceContentPanelsViewProps) {
  const {
    artifacts,
    bootstrap,
    disablePanelAnimations = false,
    membersById,
    openCreateMechanismModal,
    openCreatePartInstanceModal,
    openEditMechanismModal,
    openEditPartInstanceModal,
    openEditSubsystemModal,
    tabSwitchDirection,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "subsystems"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive>
        {props.isNonRobotProject ? (
          <WorkflowView
            artifacts={artifacts}
            bootstrap={bootstrap}
            membersById={membersById}
            openEditWorkstreamModal={props.openEditWorkstreamModal}
          />
        ) : (
          <SubsystemsView
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateMechanismModal={openCreateMechanismModal}
            openCreatePartInstanceModal={openCreatePartInstanceModal}
            openEditMechanismModal={openEditMechanismModal}
            openEditPartInstanceModal={openEditPartInstanceModal}
            openEditSubsystemModal={openEditSubsystemModal}
          />
        )}
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
