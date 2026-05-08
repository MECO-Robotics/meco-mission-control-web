import type { MouseEvent as ReactMouseEvent, RefObject } from "react";

import { IconChevronRight, IconEdit, IconHelp } from "@/components/shared/Icons";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { getProjectIcon, getProjectIconColor } from "./appSidebarIcons";

interface AppSidebarProjectFooterProps {
  activeTab: import("@/lib/workspaceNavigation").ViewTab;
  canEditSelectedRobot: boolean;
  isCollapsed: boolean;
  isProjectPopupOpen: boolean;
  onEditSelectedRobot: () => void;
  onHelpSelect: () => void;
  onProjectTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  projectTriggerRef: RefObject<HTMLButtonElement | null>;
  selectedProject: ProjectRecord | null;
  selectedProjectLabel: string;
}

export function AppSidebarProjectFooter({
  activeTab,
  canEditSelectedRobot,
  isCollapsed,
  isProjectPopupOpen,
  onEditSelectedRobot,
  onHelpSelect,
  onProjectTriggerClick,
  projectTriggerRef,
  selectedProject,
  selectedProjectLabel,
}: AppSidebarProjectFooterProps) {
  return !isCollapsed ? (
    <div className="sidebar-footer-stack">
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