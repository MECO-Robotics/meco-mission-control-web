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
  onSubItemSelect: (target: NavigationTarget, isEnabled: boolean) => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({ activeSubItemId, isCollapsed, onSubItemSelect, sectionModels }: AppSidebarSectionsProps) {
  return sectionModels.map(({ section, subItems }) => (
    <section className="sidebar-section-group" aria-label={NAVIGATION_SECTION_LABELS[section]} key={section}>
      {!isCollapsed && <h2 className="sidebar-section-heading" data-tutorial-target={`sidebar-tab-${section}`}>{NAVIGATION_SECTION_LABELS[section]}</h2>}
      {subItems.map((item) => (
        <button
          className="sidebar-nav-item"
          aria-label={item.label}
          aria-current={activeSubItemId === item.id ? "page" : undefined}
          title={isCollapsed ? item.label : undefined}
          data-active={activeSubItemId === item.id ? "true" : "false"}
          data-enabled={item.isEnabled ? "true" : "false"}
          disabled={!item.isEnabled}
          data-tutorial-target={`sidebar-view-${item.id}`}
          data-active-view={activeSubItemId ?? ""}
          key={item.id}
          onClick={() => onSubItemSelect(item.target, item.isEnabled)}
          type="button"
        >
          <span aria-hidden="true" className="sidebar-nav-item-icon">{subItemIcons[item.id]}</span>
          {!isCollapsed && <span className="sidebar-nav-item-label">{item.label}</span>}
        </button>
      ))}
    </section>
  ));
}
