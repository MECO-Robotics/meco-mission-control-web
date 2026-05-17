import type { InventoryViewTab } from "@/lib/workspaceNavigation";
import type { WorkspaceContentPanelsProps } from "../WorkspaceContentPanelsCoreImpl";
import { WorkspaceToastStack, type WorkspaceToastStackItem } from "../WorkspaceStatusToast";
import {
  WorkspaceTaskSection,
  WorkspaceRiskSection,
  WorkspaceWorklogsSection,
  WorkspaceReportsSection,
} from "./WorkspaceTaskAndStatusSections";
import {
  WorkspaceInventorySection,
  WorkspaceSubsystemsSection,
  WorkspaceRosterSection,
  WorkspaceHelpSection,
} from "./WorkspaceInventoryAndAdminSections";
import { WorkspaceCadSection } from "./sections/WorkspaceCadSection";
import { WorkspaceManufacturingSection } from "./WorkspaceManufacturingSection";
import { groupWorkspaceContentPanelProps } from "./workspaceContentPanelsGrouping";
type SwipeDirection = "left" | "right" | null;

type WorkspaceContentPanelsViewProps = WorkspaceContentPanelsProps & {
  effectiveInventoryView: InventoryViewTab;
  taskSwipeDirection: SwipeDirection;
  reportsSwipeDirection: SwipeDirection;
  manufacturingSwipeDirection: SwipeDirection;
  inventorySwipeDirection: SwipeDirection;
};

export function WorkspaceContentPanelsView(props: WorkspaceContentPanelsViewProps) {
  const groupedProps = groupWorkspaceContentPanelProps(props);
  const toastItems: WorkspaceToastStackItem[] = [
    ...groupedProps.shell.taskEditNotices.map((notice) => ({
      message: notice.message,
      onDismiss: () => groupedProps.shell.onDismissTaskEditNotice(notice.id),
      title: notice.title,
      tone: notice.tone,
      id: notice.id,
    })),
    groupedProps.shell.dataMessage
      ? {
          id: "workspace-data-message",
          message: groupedProps.shell.dataMessage,
          onDismiss: groupedProps.shell.onDismissDataMessage,
          title: "Error",
          tone: "error" as const,
        }
      : null,
  ].filter((item): item is WorkspaceToastStackItem => item !== null);

  return (
    <div
      className="dense-shell"
      style={{
        padding: 0,
        margin: 0,
        maxWidth: "none",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        minHeight: "100%",
      }}
    >
      {toastItems.length > 0 ? <WorkspaceToastStack items={toastItems} /> : null}
      {groupedProps.shell.isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      <WorkspaceTaskSection shell={groupedProps.shell} tasks={groupedProps.tasks} />
      <WorkspaceRiskSection {...props} />
      <WorkspaceWorklogsSection {...props} />
      <WorkspaceReportsSection {...props} />
      <WorkspaceManufacturingSection {...props} />
      <WorkspaceInventorySection {...props} />
      <WorkspaceCadSection {...props} />
      <WorkspaceSubsystemsSection {...props} />
      <WorkspaceRosterSection shell={groupedProps.shell} roster={groupedProps.roster} />
      <WorkspaceHelpSection {...props} />
    </div>
  );
}
