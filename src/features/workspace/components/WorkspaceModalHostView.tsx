import { WorkspaceAssetModalsSection } from "./WorkspaceAssetModalsSection";
import { WorkspaceReportModalsSection } from "./WorkspaceReportModalsSection";
import { WorkspaceStructureModalsSection } from "./WorkspaceStructureModalsSection";
import { WorkspaceTaskModalsSection } from "./WorkspaceTaskModalsSection";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceModalHost(props: WorkspaceModalHostViewProps) {
  return (
    <>
      <WorkspaceTaskModalsSection {...props} />
      <WorkspaceStructureModalsSection {...props} />
      <WorkspaceAssetModalsSection {...props} />
      <WorkspaceReportModalsSection {...props} />
    </>
  );
}
