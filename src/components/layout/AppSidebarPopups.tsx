import { LayoutGrid, Plus } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { NAVIGATION_SECTION_LABELS, type NavigationSection } from "@/lib/workspaceNavigation";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { getProjectIcon, getProjectIconColor, subItemIcons } from "./appSidebarIcons";
import type { SidebarSubItemModel } from "./AppSidebarSections";

interface AppSidebarPopupsProps {
  activeSubItemId: import("@/lib/workspaceNavigation").NavigationSubItemId;
  compactPopupRef: RefObject<HTMLDivElement | null>;
  compactPopupSection: NavigationSection | null;
  compactPopupTop: number;
  getSectionSubItems: (section: NavigationSection) => SidebarSubItemModel[];
  isCollapsed: boolean;
  isProjectPopupOpen: boolean;
  onSelectProjectOption: (value: string) => void;
  onSubItemSelect: (
    target: import("@/lib/workspaceNavigation").NavigationTarget,
    isEnabled: boolean,
  ) => void;
  projectPopupRef: RefObject<HTMLDivElement | null>;
  projectPopupTop: number;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
}

const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";

export function AppSidebarPopups({
  activeSubItemId,
  compactPopupRef,
  compactPopupSection,
  compactPopupTop,
  getSectionSubItems,
  isCollapsed,
  isProjectPopupOpen,
  onSelectProjectOption,
  onSubItemSelect,
  projectPopupRef,
  projectPopupTop,
  projects,
  selectedProjectId,
}: AppSidebarPopupsProps) {
  const renderProjectOption = (
    label: string,
    icon: ReactNode,
    iconColor: string,
    isActive: boolean,
    value: string,
    key: string,
  ) => (
    <button
      className="sidebar-project-option"
      data-active={isActive ? "true" : "false"}
      key={key}
      onClick={() => onSelectProjectOption(value)}
      type="button"
    >
      <span aria-hidden="true" className="sidebar-project-option-icon" style={{ color: iconColor }}>
        {icon}
      </span>
      <span className="sidebar-project-option-label">{label}</span>
    </button>
  );

  return (
    <>
      {isCollapsed && compactPopupSection !== null ? (
        <div className="sidebar-compact-popup" ref={compactPopupRef} style={{ top: `${compactPopupTop}px` }}>
          <p className="sidebar-compact-popup-title">{NAVIGATION_SECTION_LABELS[compactPopupSection]}</p>
          {getSectionSubItems(compactPopupSection).map((subItem) => (
            <button
              className="sidebar-compact-popup-item"
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

      {isProjectPopupOpen ? (
        <div
          className="sidebar-compact-popup sidebar-project-compact-popup"
          ref={projectPopupRef}
          style={{ top: `${projectPopupTop}px` }}
        >
          <p className="sidebar-compact-popup-title">Project</p>
          {projects.length === 0 ? (
            <button className="sidebar-project-option" disabled type="button">
              No projects
            </button>
          ) : (
            <>
              {renderProjectOption(
                "All projects",
                <LayoutGrid size={14} strokeWidth={2} />,
                "var(--official-blue)",
                selectedProjectId === null,
                "",
                "all-projects",
              )}
              {projects.map((project) =>
                renderProjectOption(
                  project.name,
                  getProjectIcon(project),
                  getProjectIconColor(project),
                  selectedProjectId === project.id,
                  project.id,
                  project.id,
                ),
              )}
            </>
          )}
          {renderProjectOption(
            "Add robot",
            <Plus size={14} strokeWidth={2} />,
            "var(--meco-blue)",
            false,
            ADD_ROBOT_PROJECT_VALUE,
            ADD_ROBOT_PROJECT_VALUE,
          )}
        </div>
      ) : null}
    </>
  );
}

export { ADD_ROBOT_PROJECT_VALUE };