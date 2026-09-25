import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { AppSidebarAddMenu } from "./sidebar/AppSidebarAddMenu";
import { AppProfileAssembly } from "./AppProfileAssembly";
import { useSidebarContext } from "./sidebar/context/SidebarContext";

export function AppSidebarQuickActions() {
  const {
    isCollapsed,
    onCreateMilestone,
    onCreatePart,
    onCreateQaReport,
    onCreateTask,
    toggleSidebar,
    onOpenProfileEditor,
    sessionUser,
  } = useSidebarContext();

  return (
    <div className="sidebar-quick-actions" data-collapsed={isCollapsed ? "true" : "false"}>
      <div className="sidebar-quick-action-profile">
        <AppProfileAssembly
          onOpenProfileEditor={onOpenProfileEditor}
          sessionUser={sessionUser}
        />
      </div>

      <AppSidebarAddMenu
        onCreateMilestone={onCreateMilestone}
        onCreatePart={onCreatePart}
        onCreateQaReport={onCreateQaReport}
        onCreateTask={onCreateTask}
      />

      <button
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="sidebar-quick-action sidebar-quick-action-fold"
        onClick={toggleSidebar}
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
