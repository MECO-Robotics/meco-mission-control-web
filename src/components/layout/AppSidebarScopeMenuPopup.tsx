import { ChevronRight, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";

import { IconCalendar, IconEdit, IconPlus } from "@/components/shared/Icons";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import { getProjectIcon, getProjectIconColor } from "./appSidebarIcons";

export const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";
export const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

export type AppSidebarScopePanel = "season" | "project";

interface AppSidebarScopeMenuPopupProps {
  activePanel: AppSidebarScopePanel | null;
  canEditSelectedRobot: boolean;
  onEditSelectedRobot: () => void;
  onPanelChange: (panel: AppSidebarScopePanel) => void;
  onSelectProjectOption: (value: string) => void;
  onSelectSeasonOption: (value: string) => void;
  projects: ProjectRecord[];
  seasons: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
}

function ScopeOption({
  isActive,
  label,
  onClick,
  icon,
  showsNextPanel,
  tutorialTarget,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  showsNextPanel?: boolean;
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
      {showsNextPanel ? (
        <span aria-hidden="true" className="sidebar-scope-option-caret">
          <ChevronRight size={13} strokeWidth={2} />
        </span>
      ) : null}
    </button>
  );
}

export function AppSidebarScopeMenuPopup({
  activePanel,
  canEditSelectedRobot,
  onEditSelectedRobot,
  onPanelChange,
  onSelectProjectOption,
  onSelectSeasonOption,
  projects,
  seasons,
  selectedProjectId,
  selectedSeasonId,
}: AppSidebarScopeMenuPopupProps) {
  const shouldShowEditRobot = canEditSelectedRobot;

  return (
    <>
      <div aria-label="Workspace scope" className="sidebar-scope-kind-panel" role="dialog">
        <p className="sidebar-compact-popup-title">Workspace scope</p>
        <div role="listbox">
          <ScopeOption
            icon={<LayoutGrid size={14} strokeWidth={2} />}
            isActive={activePanel === "project"}
            label="Project"
            onClick={() => onPanelChange("project")}
            showsNextPanel
          />
          <ScopeOption
            icon={<IconCalendar />}
            isActive={activePanel === "season"}
            label="Season"
            onClick={() => onPanelChange("season")}
            showsNextPanel
          />
        </div>
      </div>
      {activePanel === "season" ? (
        <div className="sidebar-scope-target-panel" data-scope-panel="season">
          <p className="sidebar-compact-popup-title">Seasons</p>
          <div role="listbox">
            {seasons.length > 0 ? (
              seasons.map((season) => (
                <ScopeOption
                  isActive={selectedSeasonId === season.id}
                  key={season.id}
                  label={season.name}
                  onClick={() => onSelectSeasonOption(season.id)}
                  tutorialTarget="season-select"
                />
              ))
            ) : (
              <div className="table-column-filter-empty" role="presentation">
                No seasons
              </div>
            )}
            <ScopeOption
              icon={<IconPlus />}
              isActive={false}
              label="Create new season"
              onClick={() => onSelectSeasonOption(CREATE_SEASON_OPTION_VALUE)}
            />
          </div>
        </div>
      ) : null}
      {activePanel === "project" ? (
        <div className="sidebar-scope-target-panel" data-scope-panel="project">
          <p className="sidebar-compact-popup-title">Projects</p>
          <div role="listbox">
            <ScopeOption
              icon={<LayoutGrid size={14} strokeWidth={2} />}
              isActive={selectedProjectId === null}
              label="All projects"
              onClick={() => onSelectProjectOption("")}
              tutorialTarget="project-select"
            />
            {projects.map((project) => (
              <ScopeOption
                icon={
                  <span style={{ color: getProjectIconColor(project) }}>
                    {getProjectIcon(project)}
                  </span>
                }
                isActive={selectedProjectId === project.id}
                key={project.id}
                label={project.name}
                onClick={() => onSelectProjectOption(project.id)}
                tutorialTarget="project-select"
              />
            ))}
            <ScopeOption
              icon={<IconPlus />}
              isActive={false}
              label="Add robot"
              onClick={() => onSelectProjectOption(ADD_ROBOT_PROJECT_VALUE)}
            />
            {shouldShowEditRobot ? (
              <ScopeOption
                icon={<IconEdit />}
                isActive={false}
                label="Edit robot name"
                onClick={onEditSelectedRobot}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
