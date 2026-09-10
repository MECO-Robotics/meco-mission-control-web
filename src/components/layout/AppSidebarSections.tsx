import { useState, type FocusEvent as ReactFocusEvent, type MouseEvent as ReactMouseEvent } from "react";
import { NAVIGATION_SECTION_LABELS, type NavigationSection, type NavigationSubItemId, type NavigationTarget } from "@/lib/workspaceNavigation";
import { subItemIcons } from "./appSidebarIcons";

export interface SidebarSubItemModel {
  id: import("@/lib/workspaceNavigation").NavigationSubItemId;
  label: string;
  target: import("@/lib/workspaceNavigation").NavigationTarget;
  isEnabled: boolean;
}

interface SidebarSectionModel {
  section: NavigationSection;
  subItems: SidebarSubItemModel[];
}

interface AppSidebarSectionsProps {
  activeSubItemId: NavigationSubItemId | null;
  isCollapsed: boolean;
  onSubItemSelect: (target: NavigationTarget) => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({
  activeSubItemId,
  isCollapsed,
  onSubItemSelect,
  sectionModels,
}: AppSidebarSectionsProps) {
  const [hoveredSubItemId, setHoveredSubItemId] = useState<NavigationSubItemId | null>(null);

  const setActiveRollout = (id: NavigationSubItemId) => setHoveredSubItemId(id);
  const clearActiveRollout = () => setHoveredSubItemId(null);

  const handleEnter = (event: ReactMouseEvent<HTMLButtonElement>, id: NavigationSubItemId) => {
    void event;
    setActiveRollout(id);
  };

  const handleFocus = (_event: ReactFocusEvent<HTMLButtonElement>, id: NavigationSubItemId) => {
    setActiveRollout(id);
  };

  return sectionModels.map(({ section, subItems }) => (
    <section className="sidebar-section-group" aria-label={NAVIGATION_SECTION_LABELS[section]} key={section}>
      {!isCollapsed && (
        <h2 className="sidebar-section-heading" data-tutorial-target={`sidebar-tab-${section}`}>
          {NAVIGATION_SECTION_LABELS[section]}
        </h2>
      )}
      {subItems.map((item) => (
        (() => {
          const isRobotDestination = item.id === "resources-structure";
          const isDisabled = isRobotDestination && !item.isEnabled;
          return (
        <button
          className="sidebar-nav-item"
          aria-label={item.label}
          aria-current={activeSubItemId === item.id ? "page" : undefined}
          title={isCollapsed ? item.label : undefined}
          data-active={activeSubItemId === item.id ? "true" : "false"}
          data-enabled={item.isEnabled ? "true" : "false"}
          disabled={isDisabled}
          data-tutorial-target={`sidebar-view-${item.id}`}
          data-active-view={activeSubItemId ?? ""}
          key={item.id}
          onMouseEnter={(event) => handleEnter(event, item.id)}
          onMouseLeave={clearActiveRollout}
          onFocus={(event) => handleFocus(event, item.id)}
          onBlur={clearActiveRollout}
          onClick={() => {
            if (!isDisabled) onSubItemSelect(item.target);
          }}
          type="button"
        >
          <span aria-hidden="true" className="sidebar-nav-item-icon">{subItemIcons[item.id]}</span>
          {!isCollapsed ? <span className="sidebar-nav-item-label">{item.label}</span> : null}
          {isCollapsed ? (
            <span
              aria-hidden="true"
              className="sidebar-nav-item-rollout"
              data-visible={hoveredSubItemId === item.id ? "true" : "false"}
            >
              {item.label}
            </span>
          ) : null}
        </button>
          );
        })()
      ))}
    </section>
  ));
}
