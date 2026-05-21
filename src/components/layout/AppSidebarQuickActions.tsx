import { Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";

import type { NavigationTarget, ViewTab } from "@/lib/workspaceNavigation";

import { AppSidebarAddMenu } from "./sidebar/AppSidebarAddMenu";

interface AppSidebarQuickActionsProps {
  activeTab: ViewTab;
  isCollapsed: boolean;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateTask: () => void;
  onSelectTarget: (target: NavigationTarget) => void;
  onToggleSidebar: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function AppSidebarQuickActions({
  activeTab,
  isCollapsed,
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateTask,
  onSelectTarget,
  onToggleSidebar,
}: AppSidebarQuickActionsProps) {
  return (
    <div className="sidebar-quick-actions" data-collapsed={isCollapsed ? "true" : "false"}>
      <button
        aria-current={activeTab === "home" ? "page" : undefined}
        aria-label="Home"
        className="sidebar-quick-action sidebar-quick-action-home"
        data-active={activeTab === "home" ? "true" : "false"}
        onClick={() => onSelectTarget({ tab: "home" })}
        title="Home"
        type="button"
      >
        <Home aria-hidden="true" size={14} strokeWidth={2} />
      </button>

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
