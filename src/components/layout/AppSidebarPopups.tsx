import { LayoutGrid, Plus } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { NAVIGATION_SECTION_LABELS, type NavigationSection } from "@/lib/workspaceNavigation";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import { IconEdit } from "@/components/shared/Icons";
import { getProjectIcon, getProjectIconColor, subItemIcons } from "./appSidebarIcons";
import type { SidebarSubItemModel } from "./AppSidebarSections";

interface AppSidebarPopupsProps {
  activeSubItemId: import("@/lib/workspaceNavigation").NavigationSubItemId | null;
  compactPopupRef: RefObject<HTMLDivElement | null>;
  compactPopupSection: NavigationSection | null;
  compactPopupTop: number;
  getSectionSubItems: (section: NavigationSection) => SidebarSubItemModel[];
  isCollapsed: boolean;
  isProjectPopupOpen: boolean;
  isScopePopupOpen?: boolean;
  canEditSelectedRobot?: boolean;
  onEditSelectedRobot?: () => void;
  onSelectProjectOption: (value: string) => void;
  onSelectSeasonOption?: (value: string) => void;
  onSubItemSelect: (
    target: import("@/lib/workspaceNavigation").NavigationTarget,
    isEnabled: boolean,
  ) => void;
  projectPopupRef: RefObject<HTMLDivElement | null>;
  projectPopupTop: number;
  projects: ProjectRecord[];
  seasons?: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId?: string | null;
}

const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";
const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

function ScopeOption({
  isActive,
  label,
  onClick,
  icon,
  tutorialTarget,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  tutorialTarget?: string;
}) {
  return (
    <button
      aria-selected={isActive}
      className={`sidebar-project-option sidebar-scope-option${isActive ? " is-selected" : ""}`}
      data-active={isActive ? "true" : "false"}
      data-tutorial-target={tutorialTarget}
      onClick={onClick}
      role="option"
      type="button"
    >
      {icon ? (
        <span aria-hidden="true" className="sidebar-project-option-icon">
          {icon}
        </span>
      ) : null}
      <span className="sidebar-project-option-label">{label}</span>
    </button>
  );
}

export function AppSidebarPopups({
  activeSubItemId,
  compactPopupRef,
  compactPopupSection,
  compactPopupTop,
  getSectionSubItems,
  isCollapsed,
  isProjectPopupOpen,
  isScopePopupOpen,
  canEditSelectedRobot,
  onEditSelectedRobot,
  onSelectProjectOption,
  onSelectSeasonOption,
  onSubItemSelect,
  projectPopupRef,
  projectPopupTop,
  projects,
  seasons = [],
  selectedProjectId,
  selectedSeasonId = null,
}: AppSidebarPopupsProps) {
  const shouldShowScopePopup = isScopePopupOpen ?? isProjectPopupOpen;
  const shouldShowEditRobot = canEditSelectedRobot ?? Boolean(onEditSelectedRobot);
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

      {shouldShowScopePopup ? (
        <div
          className="sidebar-compact-popup sidebar-scope-popup-shell"
          ref={projectPopupRef}
          style={{ top: `${projectPopupTop}px` }}
        >
          <div className="sidebar-scope-target-panel" data-scope-panel="season">
            <p className="sidebar-compact-popup-title">Seasons</p>
            {seasons.length === 0 ? (
              <button className="sidebar-project-option" disabled type="button">
                No seasons
              </button>
            ) : (
              seasons.map((season) => (
                <ScopeOption
                  isActive={selectedSeasonId === season.id}
                  key={season.id}
                  label={season.name}
                  onClick={() => onSelectSeasonOption?.(season.id)}
                  tutorialTarget="season-select"
                />
              ))
            )}
            <ScopeOption
              icon={<Plus size={14} strokeWidth={2} />}
              isActive={false}
              label="Create new season"
              onClick={() => onSelectSeasonOption?.(CREATE_SEASON_OPTION_VALUE)}
            />
          </div>
          <div className="sidebar-scope-target-panel" data-scope-panel="project">
            <p className="sidebar-compact-popup-title">Projects</p>
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
            {shouldShowEditRobot && onEditSelectedRobot ? (
              <ScopeOption
                icon={<IconEdit />}
                isActive={false}
                label="Edit robot name"
                onClick={onEditSelectedRobot}
              />
            ) : null}
            {renderProjectOption(
              "Add robot",
              <Plus size={14} strokeWidth={2} />,
              "var(--meco-blue)",
              false,
              ADD_ROBOT_PROJECT_VALUE,
              ADD_ROBOT_PROJECT_VALUE,
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export { ADD_ROBOT_PROJECT_VALUE, CREATE_SEASON_OPTION_VALUE };
