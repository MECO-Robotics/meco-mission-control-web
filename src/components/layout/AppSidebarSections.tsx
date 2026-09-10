import type { MouseEvent as ReactMouseEvent } from "react";
import {
  type NavigationSection,
  NAVIGATION_SECTION_LABELS,
} from "@/lib/workspaceNavigation";
import { sectionIcons } from "./appSidebarIcons";

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
  activeSection: NavigationSection | null;
  onSectionClick: (section: NavigationSection, event: ReactMouseEvent<HTMLButtonElement>) => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({ activeSection, onSectionClick, sectionModels }: AppSidebarSectionsProps) {
  return (
    <div className="workspace-primary-navigation">
      {sectionModels.map(({ section, isEnabled }) => (
        <button
          aria-current={activeSection === section ? "page" : undefined}
          aria-label={NAVIGATION_SECTION_LABELS[section]}
          className="tab sidebar-section-toggle"
          data-active={activeSection === section ? "true" : "false"}
          data-tutorial-target={`sidebar-tab-${section}`}
          disabled={!isEnabled}
          key={section}
          onClick={(event) => onSectionClick(section, event)}
          type="button"
        >
          <span aria-hidden="true" className="sidebar-tab-icon">{sectionIcons[section]}</span>
          <span className="sidebar-tab-label">{NAVIGATION_SECTION_LABELS[section]}</span>
        </button>
      ))}
    </div>
  );
}
