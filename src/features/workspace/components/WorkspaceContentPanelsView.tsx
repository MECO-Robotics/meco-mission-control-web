import type { WorkspaceToastDismissReason } from "@/features/workspace/workspaceToastQueue";
import { WorkspaceToastStack, type WorkspaceToastStackItem } from "../WorkspaceStatusToast";
import { WorkspaceTaskSection } from "./sections/WorkspaceTaskSection";
import { WorkspaceRiskSection } from "./sections/WorkspaceRiskSection";
import { WorkspaceWorklogsSection } from "./sections/WorkspaceWorklogsSection";
import { WorkspaceInventorySection } from "./sections/WorkspaceInventorySection";
import { WorkspaceSubsystemsSection } from "./sections/WorkspaceSubsystemsSection";
import { WorkspaceRosterSection } from "./sections/WorkspaceRosterSection";
import { WorkspaceHelpSection } from "./sections/WorkspaceHelpSection";
import { WorkspaceCadSection } from "./sections/WorkspaceCadSection";
import { WorkspaceManufacturingSection } from "./sections/WorkspaceManufacturingSection";
import { WorkspaceHomeSection } from "./overview/WorkspaceOverviewSections";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";
export function WorkspaceContentPanelsView(props: WorkspaceContentPanelsViewProps) {
  const toastItems: WorkspaceToastStackItem[] = [
    ...props.taskEditNotices.map((notice) => ({
      message: notice.message,
      onDismiss: (reason: WorkspaceToastDismissReason) =>
        props.onDismissTaskEditNotice(notice.id, reason),
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
  const historyItems: WorkspaceToastStackItem[] = props.notificationHistory.map(
    (notice) => ({
      message: notice.message,
      onDismiss: () => props.onDismissNotificationHistoryItem(notice.id),
      title: notice.title,
      tone: notice.tone,
      id: notice.id,
    }),
  );
  const shouldRenderToastStack =
    toastItems.length > 0 || props.isNotificationQueueOpen;

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
      {shouldRenderToastStack ? (
        <WorkspaceToastStack
          historyItems={historyItems}
          isHistoryOpen={props.isNotificationQueueOpen}
          items={toastItems}
        />
      ) : null}
      {props.isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      <WorkspaceHomeSection {...props} />
      <WorkspaceTaskSection {...props} />
      <WorkspaceRiskSection {...props} />
      <WorkspaceWorklogsSection {...props} />
      <WorkspaceManufacturingSection {...props} />
      <WorkspaceInventorySection {...props} />
      <WorkspaceCadSection {...props} />
      <WorkspaceSubsystemsSection {...props} />
      <WorkspaceRosterSection {...props} />
      <WorkspaceHelpSection {...props} />
    </div>
  );
}
