import { HelpView } from "@/features/workspace/views/HelpView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceHelpSection(props: WorkspaceContentPanelsViewProps) {
  const {
    disablePanelAnimations = false,
    interactiveTutorialChapters,
    isInteractiveTutorialActive = false,
    onStartInteractiveTutorial,
    onStartInteractiveTutorialChapter,
    tabSwitchDirection,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "help"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive>
        <HelpView
          onStartInteractiveTutorial={onStartInteractiveTutorial}
          onStartInteractiveTutorialChapter={onStartInteractiveTutorialChapter}
          interactiveTutorialChapters={interactiveTutorialChapters}
          isInteractiveTutorialActive={isInteractiveTutorialActive}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
