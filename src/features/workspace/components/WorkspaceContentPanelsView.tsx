import type { InventoryViewTab } from "@/lib/workspaceNavigation";
import type { WorkspaceContentPanelsProps } from "../WorkspaceContentPanelsCoreImpl";
import { WorkspaceErrorPopup, WorkspaceInfoToast } from "../WorkspaceStatusToast";
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
      {props.taskEditNotice ? (
        <WorkspaceInfoToast
          message={props.taskEditNotice}
          onDismiss={props.onDismissTaskEditNotice}
        />
      ) : null}
      {props.dataMessage ? (
        <WorkspaceErrorPopup
          message={props.dataMessage}
          onDismiss={props.onDismissDataMessage}
        />
      ) : null}
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

