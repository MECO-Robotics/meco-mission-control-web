import type { RefObject } from "react";

import { NAVIGATION_SECTION_LABELS, type NavigationSection } from "@/lib/workspaceNavigation";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import { subItemIcons } from "./appSidebarIcons";
import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarScopeMenuPopup,
  CREATE_SEASON_OPTION_VALUE,
  type AppSidebarScopePanel,
} from "./AppSidebarScopeMenuPopup";
import type { SidebarSubItemModel } from "./AppSidebarSections";

interface AppSidebarPopupsProps {
  activeSubItemId: import("@/lib/workspaceNavigation").NavigationSubItemId | null;
  activeScopePanel: AppSidebarScopePanel | null;
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
  setActiveScopePanel: (panel: AppSidebarScopePanel) => void;
}

export function AppSidebarPopups({
  activeSubItemId,
  activeScopePanel,
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
  setActiveScopePanel,
}: AppSidebarPopupsProps) {
  const shouldShowScopePopup = isScopePopupOpen ?? isProjectPopupOpen;
  const shouldShowEditRobot = canEditSelectedRobot ?? Boolean(onEditSelectedRobot);

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
          <AppSidebarScopeMenuPopup
            activePanel={activeScopePanel}
            canEditSelectedRobot={shouldShowEditRobot}
            onEditSelectedRobot={onEditSelectedRobot ?? (() => undefined)}
            onPanelChange={setActiveScopePanel}
            onSelectProjectOption={onSelectProjectOption}
            onSelectSeasonOption={onSelectSeasonOption ?? (() => undefined)}
            projects={projects}
            seasons={seasons}
            selectedProjectId={selectedProjectId}
            selectedSeasonId={selectedSeasonId}
          />
        </div>
      ) : null}
    </>
  );
}

export { ADD_ROBOT_PROJECT_VALUE, CREATE_SEASON_OPTION_VALUE };
