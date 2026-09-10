import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown } from "lucide-react";
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
  activeSubItemId: string | null;
  onSelectTarget: (target: SidebarSubItemModel["target"]) => void;
  onSectionClick: (section: NavigationSection, event: ReactMouseEvent<HTMLButtonElement>) => void;
  sectionModels: SidebarSectionModel[];
}

export function AppSidebarSections({ activeSection, activeSubItemId, onSectionClick, onSelectTarget, sectionModels }: AppSidebarSectionsProps) {
  const [mobileOpen, setMobileOpen] = useState<NavigationSection | null>(null);
  return (
    <div className="workspace-primary-navigation" onKeyDown={event => { if (event.key === "Escape") setMobileOpen(null); }}>
      {sectionModels.map(({ section, isEnabled, subItems }) => (
        <div className="sidebar-area" key={section} data-active={activeSection === section} data-open={mobileOpen === section}>
          <button
            aria-current={section === "home" && activeSection === section ? "page" : undefined}
            aria-label={NAVIGATION_SECTION_LABELS[section]}
            aria-controls={section !== "home" ? `sidebar-views-${section}` : undefined}
            className="tab sidebar-section-toggle"
            data-active={activeSection === section ? "true" : "false"}
            data-tutorial-target={`sidebar-tab-${section}`}
            disabled={!isEnabled}
            onClick={event => { setMobileOpen(mobileOpen === section ? null : section); onSectionClick(section, event); }}
            type="button"
          >
            <span aria-hidden="true" className="sidebar-tab-icon">{sectionIcons[section]}</span>
            <span className="sidebar-tab-label">{NAVIGATION_SECTION_LABELS[section]}</span>
            {section !== "home" ? <ChevronDown aria-hidden="true" size={14} className="sidebar-area-chevron" /> : null}
          </button>
          {section !== "home" ? <div className="sidebar-subitem-list" id={`sidebar-views-${section}`} aria-label={`${NAVIGATION_SECTION_LABELS[section]} views`}>
            {subItems.filter(item => item.isEnabled).map(item => <button
              key={item.id} type="button" className="sidebar-subitem"
              aria-current={activeSubItemId === item.id ? "page" : undefined}
              data-active={activeSubItemId === item.id}
              data-active-view={activeSubItemId ?? ""}
              data-tutorial-target={`sidebar-view-${item.id}`}
              onClick={() => { onSelectTarget(item.target); setMobileOpen(null); }}
            >{item.label}</button>)}
          </div> : null}
        </div>
      ))}
    </div>
  );
}
