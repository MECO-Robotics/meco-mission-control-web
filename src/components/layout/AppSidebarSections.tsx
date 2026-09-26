import { NAVIGATION_SECTION_LABELS, type NavigationSection, type NavigationSubItemId, type NavigationTarget } from "@/lib/workspaceNavigation";
import { SidebarItem, type SidebarItemConfig } from "./sidebar/SidebarItem";

export type SidebarSubItemModel = SidebarItemConfig;

interface SidebarSectionModel {
  section: NavigationSection;
  subItems: SidebarSubItemModel[];
}

interface AppSidebarSectionsProps {
  activeSubItemId: NavigationSubItemId | null;
  isCollapsed: boolean;
  onSubItemSelect: (target: NavigationTarget) => void;
  onDisabledSubItemSelect: () => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({
  activeSubItemId,
  isCollapsed,
  onSubItemSelect,
  onDisabledSubItemSelect,
  sectionModels,
}: AppSidebarSectionsProps) {
  return sectionModels.map(({ section, subItems }) => (
    <section className="sidebar-section-group" aria-label={NAVIGATION_SECTION_LABELS[section]} key={section}>
      {!isCollapsed && (
        <h2 className="sidebar-section-heading">
          {NAVIGATION_SECTION_LABELS[section]}
        </h2>
      )}
      {subItems.map((item) => (
        <SidebarItem
          config={item}
          isActive={activeSubItemId === item.id}
          activeViewId={activeSubItemId ?? ""}
          isCollapsed={isCollapsed}
          onSelect={(config) => onSubItemSelect(config.target)}
          onDisabledSelect={() => onDisabledSubItemSelect()}
          key={item.id}
        />
      ))}
    </section>
  ));
}
