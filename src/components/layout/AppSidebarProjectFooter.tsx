import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { Settings as SettingsIcon } from "lucide-react";

import { IconChevronRight, IconEdit, IconHelp } from "@/components/shared/Icons";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import { getProjectIcon, getProjectIconColor } from "./appSidebarIcons";
import { AppSidebarSeasonPicker } from "./AppSidebarSeasonPicker";

interface AppSidebarProjectFooterProps {
  activeTab: import("@/lib/workspaceNavigation").ViewTab;
  canEditSelectedRobot: boolean;
  isDarkMode: boolean;
  isCollapsed: boolean;
  isProjectPopupOpen: boolean;
  onEditSelectedRobot: () => void;
  onCreateSeason: () => void;
  onHelpSelect: () => void;
  onToggleDarkMode: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onProjectTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  projectTriggerRef: RefObject<HTMLButtonElement | null>;
  seasons: SeasonRecord[];
  selectedProject: ProjectRecord | null;
  selectedProjectLabel: string;
  selectedSeasonId: string | null;
}

export function AppSidebarProjectFooter({
  activeTab,
  canEditSelectedRobot,
  isDarkMode,
  isCollapsed,
  isProjectPopupOpen,
  onEditSelectedRobot,
  onCreateSeason,
  onHelpSelect,
  onToggleDarkMode,
  onSelectSeason,
  onProjectTriggerClick,
  projectTriggerRef,
  seasons,
  selectedProject,
  selectedProjectLabel,
  selectedSeasonId,
}: AppSidebarProjectFooterProps) {
  const themeLabel = isDarkMode ? "Dark" : "Light";
  const themeTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  const handleThemeClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onToggleDarkMode();
    event.currentTarget.closest("details")?.removeAttribute("open");
  };
  const settingsMenu = (
    <details className={`sidebar-settings-menu${isCollapsed ? " sidebar-settings-menu-collapsed" : ""}`}>
      <summary
        aria-label={isCollapsed ? "Settings" : undefined}
        className={`tab sidebar-settings-summary${isCollapsed ? " sidebar-settings-collapsed-trigger" : ""}`}
        data-active="false"
      >
        <span className="sidebar-tab-main">
          <span aria-hidden="true" className="sidebar-tab-icon">
            <SettingsIcon aria-hidden="true" size={14} strokeWidth={2} />
          </span>
          {!isCollapsed ? <span className="sidebar-tab-label">Settings</span> : null}
        </span>
      </summary>
      <div aria-label="Settings menu" className="sidebar-settings-popover" role="menu">
        <button
          className="sidebar-settings-menu-item"
          onClick={handleThemeClick}
          role="menuitem"
          title={themeTitle}
          type="button"
        >
          <span className="sidebar-settings-menu-copy">
            <span className="sidebar-settings-menu-title">Theme mode</span>
            <span className="sidebar-settings-menu-value">{themeLabel}</span>
          </span>
          <span
            aria-hidden="true"
            className={`profile-mode-selector ${isDarkMode ? "is-dark" : "is-light"}`}
          >
            <span className="profile-mode-selector-track">
              <span className="profile-mode-selector-thumb">
                <span className="profile-mode-selector-icon">{isDarkMode ? "\u263E" : "\u2600"}</span>
              </span>
            </span>
          </span>
        </button>
      </div>
    </details>
  );

  return !isCollapsed ? (
    <div className="sidebar-footer-stack">
      {settingsMenu}
      <button
        className="tab sidebar-footer-help-button"
        data-active={activeTab === "help" ? "true" : "false"}
        onClick={onHelpSelect}
        type="button"
      >
        <span className="sidebar-tab-main">
          <span aria-hidden="true" className="sidebar-tab-icon">
            <IconHelp />
          </span>
          <span className="sidebar-tab-label">Help</span>
        </span>
      </button>
      <AppSidebarSeasonPicker
        onCreateSeason={onCreateSeason}
        onSelectSeason={onSelectSeason}
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
      />
      <div className="sidebar-context-picker sidebar-project-picker">
        <span className="sidebar-context-label">Project</span>
        <div className="sidebar-project-compact-row" data-tutorial-target="project-select-outreach">
          <button
            aria-expanded={isProjectPopupOpen ? "true" : "false"}
            aria-label="Select project"
            className="sidebar-project-trigger"
            data-tutorial-target="project-select"
            onClick={onProjectTriggerClick}
            ref={projectTriggerRef}
            type="button"
          >
            <span
              aria-hidden="true"
              className="sidebar-tab-icon"
              style={{ color: getProjectIconColor(selectedProject) }}
            >
              {getProjectIcon(selectedProject)}
            </span>
            <span className="sidebar-project-trigger-label">{selectedProjectLabel}</span>
            <span
              aria-hidden="true"
              className={`sidebar-project-trigger-chevron${isProjectPopupOpen ? " is-open" : ""}`}
            >
              <IconChevronRight />
            </span>
          </button>
          {canEditSelectedRobot ? (
            <button
              aria-label="Edit robot name"
              className="sidebar-context-action"
              onClick={onEditSelectedRobot}
              title="Edit robot name"
              type="button"
            >
              <IconEdit />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  ) : (
    <div className="sidebar-footer-stack sidebar-footer-stack-collapsed">
      {settingsMenu}
      <button
        aria-label="Help"
        className="tab sidebar-help-collapsed-trigger"
        data-active={activeTab === "help" ? "true" : "false"}
        onClick={onHelpSelect}
        type="button"
      >
        <span className="sidebar-tab-main">
          <span aria-hidden="true" className="sidebar-tab-icon">
            <IconHelp />
          </span>
        </span>
      </button>
      <div className="sidebar-project-collapsed-slot">
        <button
          aria-expanded={isProjectPopupOpen ? "true" : "false"}
          aria-label="Select project"
          className="tab sidebar-project-collapsed-trigger"
          data-tutorial-target="project-select"
          onClick={onProjectTriggerClick}
          ref={projectTriggerRef}
          type="button"
        >
          <span className="sidebar-tab-main">
            <span
              aria-hidden="true"
              className="sidebar-tab-icon"
              style={{ color: getProjectIconColor(selectedProject) }}
            >
              {getProjectIcon(selectedProject)}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
