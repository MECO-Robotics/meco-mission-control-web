import { useState } from "react";
import { icons } from "lucide-react";

import type { NavigationSubItem } from "@/lib/workspaceNavigation";

export interface SidebarItemConfig extends NavigationSubItem {
  isEnabled: boolean;
  isDisabled: boolean;
}

interface SidebarItemProps {
  config: SidebarItemConfig;
  isActive: boolean;
  activeViewId: string;
  isCollapsed: boolean;
  onSelect: (config: SidebarItemConfig) => void;
  onDisabledSelect: (config: SidebarItemConfig) => void;
}

export function SidebarItem({ config, isActive, activeViewId, isCollapsed, onSelect, onDisabledSelect }: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = icons[config.icon as keyof typeof icons];

  return (
    <button
      className="sidebar-nav-item"
      aria-label={config.label}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? config.label : undefined}
      data-active={isActive ? "true" : "false"}
      data-enabled={config.isEnabled ? "true" : "false"}
      data-robot-disabled={config.isDisabled ? "true" : "false"}
      aria-disabled={config.isDisabled ? "true" : undefined}
      data-tutorial-target={`sidebar-view-${config.id}`}
      data-active-view={activeViewId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onClick={() => config.isDisabled ? onDisabledSelect(config) : onSelect(config)}
      type="button"
    >
      <span aria-hidden="true" className="sidebar-nav-item-icon">{Icon ? <Icon size={14} /> : null}</span>
      {!isCollapsed ? <span className="sidebar-nav-item-label">{config.label}</span> : null}
      {isCollapsed ? (
        <span aria-hidden="true" className="sidebar-nav-item-rollout" data-visible={isHovered ? "true" : "false"}>
          {config.label}
        </span>
      ) : null}
    </button>
  );
}
