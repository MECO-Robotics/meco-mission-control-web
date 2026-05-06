import type { WorkspaceContentPanelsProps } from "./WorkspaceContentPanelsCoreImpl";
import { WorkspaceContentPanels } from "./WorkspaceContentPanelsCoreImpl";

export type WorkspaceContentProps = WorkspaceContentPanelsProps;

export function WorkspaceContent(props: WorkspaceContentProps) {
  return <WorkspaceContentPanels {...props} />;
}
