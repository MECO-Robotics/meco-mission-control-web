import type { MouseEvent as ReactMouseEvent } from "react";
import { IconChevronRight } from "@/components/shared/Icons";
import {
  type NavigationSection,
  NAVIGATION_SECTION_LABELS,
} from "@/lib/workspaceNavigation";
import { sectionIcons, subItemIcons } from "./appSidebarIcons";

export interface SidebarSubItemModel {
  id: import("@/lib/workspaceNavigation").NavigationSubItemId;
  label: string;
  target: import("@/lib/workspaceNavigation").NavigationTarget;
  isEnabled: boolean;
}

interface SidebarSectionModel {
  section: NavigationSection;
  subItems: SidebarSubItemModel[];
  isEnabled: boolean;
}

interface AppSidebarSectionsProps {
  activeSection: NavigationSection;
  activeSubItemId: import("@/lib/workspaceNavigation").NavigationSubItemId | null;
  expandedSection: NavigationSection;
  isCollapsed: boolean;
  onSectionClick: (section: NavigationSection, event: ReactMouseEvent<HTMLButtonElement>) => void;
  onSubItemSelect: (
    target: import("@/lib/workspaceNavigation").NavigationTarget,
    isEnabled: boolean,
  ) => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({
  activeSection,
  activeSubItemId,
  expandedSection,
  isCollapsed,
  onSectionClick,
  onSubItemSelect,
  sectionModels,
}: AppSidebarSectionsProps) {
  return (
    <>
      {sectionModels.map(({ section, subItems, isEnabled: isSectionEnabled }) => {
        const isExpanded = !isCollapsed && expandedSection === section;

        return (
          <div className="sidebar-section-group" key={section}>
            <button
              aria-disabled={!isSectionEnabled}
              className="tab sidebar-section-toggle"
              data-active={activeSection === section ? "true" : "false"}
              data-enabled={isSectionEnabled ? "true" : "false"}
              data-tutorial-target={`sidebar-tab-${section}`}
              onClick={(event) => onSectionClick(section, event)}
              type="button"
            >
              <span className="sidebar-tab-main">
                <span aria-hidden="true" className="sidebar-tab-icon">
                  {sectionIcons[section]}
                </span>
                {!isCollapsed ? (
                  <span className="sidebar-tab-label">{NAVIGATION_SECTION_LABELS[section]}</span>
                ) : null}
              </span>
              {!isCollapsed ? (
                <span
                  aria-hidden="true"
                  className={`sidebar-section-chevron${isExpanded ? " is-expanded" : ""}`}
                >
                  <IconChevronRight />
                </span>
              ) : null}
            </button>

            {isExpanded ? (
              <div className="sidebar-subtab-list">
                {subItems.map((subItem) => (
                  <button
                    className="sidebar-subtab"
                    data-active={activeSubItemId === subItem.id ? "true" : "false"}
                    data-enabled={subItem.isEnabled ? "true" : "false"}
                    disabled={!subItem.isEnabled}
                    key={subItem.id}
                    onClick={() => onSubItemSelect(subItem.target, subItem.isEnabled)}
                    type="button"
                  >
                    <span aria-hidden="true" className="sidebar-subtab-icon">
                      {subItemIcons[subItem.id]}
                    </span>
                    <span className="sidebar-subtab-label">{subItem.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
