import type { WorkspaceContentPanelsProps } from "./WorkspaceContentPanels";
import { WorkspaceContentPanels } from "./WorkspaceContentPanels";

export type WorkspaceContentProps = WorkspaceContentPanelsProps;

export function WorkspaceContent(props: WorkspaceContentProps) {
  return <WorkspaceContentPanels {...props} />;
}
