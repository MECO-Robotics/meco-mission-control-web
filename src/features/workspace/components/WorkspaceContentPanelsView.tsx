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
import { WorkspaceManufacturingSection } from "./WorkspaceManufacturingSection";
type SwipeDirection = "left" | "right" | null;

type WorkspaceContentPanelsViewProps = WorkspaceContentPanelsProps & {
  effectiveInventoryView: InventoryViewTab;
  taskSwipeDirection: SwipeDirection;
  reportsSwipeDirection: SwipeDirection;
  manufacturingSwipeDirection: SwipeDirection;
  inventorySwipeDirection: SwipeDirection;
};

export function WorkspaceContentPanelsView(props: WorkspaceContentPanelsViewProps) {
  const toastItems: WorkspaceToastStackItem[] = [
    ...props.taskEditNotices.map((notice) => ({
      message: notice.message,
      onDismiss: () => props.onDismissTaskEditNotice(notice.id),
      title: notice.title,
      tone: notice.tone,
      id: notice.id,
    })),
    props.dataMessage
      ? {
          id: "workspace-data-message",
          message: props.dataMessage,
          onDismiss: props.onDismissDataMessage,
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
      {props.isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      <WorkspaceTaskSection {...props} />
      <WorkspaceRiskSection {...props} />
      <WorkspaceWorklogsSection {...props} />
      <WorkspaceReportsSection {...props} />
      <WorkspaceManufacturingSection {...props} />
      <WorkspaceInventorySection {...props} />
      <WorkspaceSubsystemsSection {...props} />
      <WorkspaceRosterSection {...props} />
      <WorkspaceHelpSection {...props} />
    </div>
  );
}

