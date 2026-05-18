import {
  Bell,
  Boxes,
  FileText,
  Flag,
  Home,
  ListTodo,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";

import type { NavigationTarget, ViewTab } from "@/lib/workspaceNavigation";

interface AppSidebarQuickActionsProps {
  activeTab: ViewTab;
  isCollapsed: boolean;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateTask: () => void;
  onSelectTarget: (target: NavigationTarget) => void;
  notificationCount: number;
}

interface AddAction {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}

export function AppSidebarQuickActions({
  activeTab,
  isCollapsed,
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateTask,
  onSelectTarget,
  notificationCount,
}: AppSidebarQuickActionsProps) {
  const notificationLabel =
    notificationCount > 0 ? `Notifications (${notificationCount})` : "Notifications";
  const addActions: AddAction[] = [
    {
      icon: <ListTodo size={14} strokeWidth={2} />,
      label: "Add task",
      onSelect: onCreateTask,
    },
    {
      icon: <FileText size={14} strokeWidth={2} />,
      label: "Add report",
      onSelect: onCreateQaReport,
    },
    {
      icon: <Flag size={14} strokeWidth={2} />,
      label: "Add milestone",
      onSelect: onCreateMilestone,
    },
    {
      icon: <Boxes size={14} strokeWidth={2} />,
      label: "Add part",
      onSelect: onCreatePart,
    },
  ];

  return (
    <div className="sidebar-quick-actions" data-collapsed={isCollapsed ? "true" : "false"}>
      <button
        aria-label="Home"
        className="sidebar-quick-action sidebar-quick-action-home"
        data-active={activeTab === "home" ? "true" : "false"}
        onClick={() => onSelectTarget({ tab: "home" })}
        title="Home"
        type="button"
      >
        <Home aria-hidden="true" size={14} strokeWidth={2} />
      </button>

      <details className="sidebar-add-menu">
        <summary
          aria-label="Add new"
          className="sidebar-quick-action sidebar-quick-action-add"
          title="Add"
        >
          <Plus aria-hidden="true" size={14} strokeWidth={2} />
        </summary>
        <div className="sidebar-add-menu-panel">
          {addActions.map((action) => (
            <button
              className="sidebar-add-menu-item"
              key={action.label}
              onClick={action.onSelect}
              type="button"
            >
              <span aria-hidden="true" className="sidebar-add-menu-icon">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </details>

      <button
        aria-label={notificationLabel}
        className="sidebar-quick-action sidebar-quick-action-notifications"
        data-active="false"
        title={notificationLabel}
        type="button"
      >
        <Bell aria-hidden="true" size={14} strokeWidth={2} />
        {notificationCount > 0 ? (
          <span className="sidebar-quick-action-badge">{notificationCount}</span>
        ) : null}
      </button>
    </div>
  );
}
