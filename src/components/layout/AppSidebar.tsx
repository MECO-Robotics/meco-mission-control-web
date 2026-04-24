import type { NavigationItem, ViewTab } from "../../features/workspace/shared/workspaceTypes";

interface AppSidebarProps {
  activeTab: ViewTab;
  items: NavigationItem[];
  onSelectTab: (tab: ViewTab) => void;
  isCollapsed: boolean;
}

export function AppSidebar({ activeTab, items, onSelectTab, isCollapsed }: AppSidebarProps) {
  return (
    <nav
      aria-label="Workspace views"
      className="sidebar"
      data-collapsed={isCollapsed ? "true" : "false"}
    >
      {items.map(({ value, label, icon, count }) => {
        const isActive = activeTab === value;

        return (
          <button
            key={value}
            className="tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onSelectTab(value)}
            type="button"
          >
            <span className="sidebar-tab-main">
              <span
                aria-hidden="true"
                className="sidebar-tab-icon"
              >
                {icon}
              </span>
              {!isCollapsed ? (
                <span className="sidebar-tab-label">{label}</span>
              ) : null}
            </span>

            {!isCollapsed ? (
              <span
                aria-label={`${count} items`}
                className="sidebar-tab-count"
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
