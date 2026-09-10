import type { RefObject } from "react";

import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarScopeMenuPopup,
  CREATE_SEASON_OPTION_VALUE,
  type AppSidebarScopePanel,
} from "./AppSidebarScopeMenuPopup";

interface AppSidebarPopupsProps {
  activeScopePanel: AppSidebarScopePanel | null;
  isProjectPopupOpen: boolean;
  isScopePopupOpen?: boolean;
  canEditSelectedRobot?: boolean;
  onEditSelectedRobot?: () => void;
  onSelectProjectOption: (value: string) => void;
  onSelectSeasonOption?: (value: string) => void;
  projectPopupRef: RefObject<HTMLDivElement | null>;
  projectPopupTop: number;
  projects: ProjectRecord[];
  seasons?: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId?: string | null;
  setActiveScopePanel: (panel: AppSidebarScopePanel) => void;
}

export function AppSidebarPopups({
  activeScopePanel,
  isProjectPopupOpen,
  isScopePopupOpen,
  canEditSelectedRobot,
  onEditSelectedRobot,
  onSelectProjectOption,
  onSelectSeasonOption,
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
