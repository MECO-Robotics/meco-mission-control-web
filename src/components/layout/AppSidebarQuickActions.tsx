import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { AppSidebarAddMenu } from "./sidebar/AppSidebarAddMenu";

interface AppSidebarQuickActionsProps {
  isCollapsed: boolean;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateTask: () => void;
  onToggleSidebar: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function AppSidebarQuickActions({
  isCollapsed,
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateTask,
  onToggleSidebar,
}: AppSidebarQuickActionsProps) {
  return (
    <div className="sidebar-quick-actions" data-collapsed={isCollapsed ? "true" : "false"}>
      <AppSidebarAddMenu
        onCreateMilestone={onCreateMilestone}
        onCreatePart={onCreatePart}
        onCreateQaReport={onCreateQaReport}
        onCreateTask={onCreateTask}
      />

      <button
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="sidebar-quick-action sidebar-quick-action-fold"
        onClick={onToggleSidebar}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {isCollapsed ? (
          <PanelLeftOpen aria-hidden="true" size={14} strokeWidth={2} />
        ) : (
          <PanelLeftClose aria-hidden="true" size={14} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
