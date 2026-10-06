import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

import type { WorkspaceToastDismissReason } from "@/features/workspace/workspaceToastQueue";
import { WorkspaceToastStack, type WorkspaceToastStackItem } from "../WorkspaceStatusToast";
import { WorkspaceHomeSection } from "./overview/WorkspaceOverviewSections";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";

const WorkspaceTaskSection = lazy(() => import("./sections/WorkspaceTaskSection").then((module) => ({ default: module.WorkspaceTaskSection })));
const WorkspaceWorklogsSection = lazy(() => import("./sections/WorkspaceWorklogsSection").then((module) => ({ default: module.WorkspaceWorklogsSection })));
const WorkspaceInventorySection = lazy(() => import("./sections/WorkspaceInventorySection").then((module) => ({ default: module.WorkspaceInventorySection })));
const WorkspaceSubsystemsSection = lazy(() => import("./sections/WorkspaceSubsystemsSection").then((module) => ({ default: module.WorkspaceSubsystemsSection })));
const WorkspaceRosterSection = lazy(() => import("./sections/WorkspaceRosterSection").then((module) => ({ default: module.WorkspaceRosterSection })));
const WorkspaceHelpSection = lazy(() => import("./sections/WorkspaceHelpSection").then((module) => ({ default: module.WorkspaceHelpSection })));
const WorkspaceCadSection = lazy(() => import("./sections/WorkspaceCadSection").then((module) => ({ default: module.WorkspaceCadSection })));

function RetainVisitedSection({ active, children }: { active: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(active);
  useEffect(() => {
    if (active) setVisited(true);
  }, [active]);
  if (!visited) return null;
  return <Suspense fallback={<p className="banner" role="status">Loading view…</p>}>{children}</Suspense>;
}

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
      <RetainVisitedSection active={props.activeTab === "tasks"}><WorkspaceTaskSection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "worklogs"}><WorkspaceWorklogsSection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "inventory"}><WorkspaceInventorySection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "cad"}><WorkspaceCadSection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "subsystems"}><WorkspaceSubsystemsSection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "roster"}><WorkspaceRosterSection {...props} /></RetainVisitedSection>
      <RetainVisitedSection active={props.activeTab === "help"}><WorkspaceHelpSection {...props} /></RetainVisitedSection>
    </div>
  );
}
