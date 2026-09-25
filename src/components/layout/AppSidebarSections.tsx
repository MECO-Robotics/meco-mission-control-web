import { NAVIGATION_SECTION_LABELS, type NavigationSection } from "@/lib/workspaceNavigation";
import { SidebarItem, type SidebarItemConfig } from "./sidebar/SidebarItem";
import { useSidebarContext } from "./sidebar/context/SidebarContext";

export type SidebarSubItemModel = SidebarItemConfig;

export interface SidebarSectionModel {
  section: NavigationSection;
  subItems: SidebarSubItemModel[];
}

export function AppSidebarSections() {
  const { activeSubItemId, isCollapsed, onSelectTarget, onDisabledSubItemSelect, sectionModels } =
    useSidebarContext();

  return sectionModels.map(({ section, subItems }) => (
    <section className="sidebar-section-group" aria-label={NAVIGATION_SECTION_LABELS[section]} key={section}>
      {!isCollapsed && (
        <h2 className="sidebar-section-heading" data-tutorial-target={`sidebar-tab-${section}`}>
          {NAVIGATION_SECTION_LABELS[section]}
        </h2>
      )}
      {subItems.map((item) => (
        <SidebarItem
          config={item}
          isActive={activeSubItemId === item.id}
          activeViewId={activeSubItemId ?? ""}
          isCollapsed={isCollapsed}
          onSelect={(config) => onSelectTarget(config.target)}
          onDisabledSelect={() => onDisabledSubItemSelect()}
          key={item.id}
        />
      ))}
    </section>
  ));
}
