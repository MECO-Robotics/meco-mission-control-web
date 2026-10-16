import type { CSSProperties, RefObject } from "react";
import { createPortal } from "react-dom";

import { useModalPortalTarget } from "@/components/useModalPortalTarget";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import type { ScopePanelConfig } from "./sidebar/SidebarScopePanel";
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
  projectPopupLeft?: number;
  projectPopupTop: number;
  projects: ProjectRecord[];
  seasons?: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId?: string | null;
  setActiveScopePanel: (panel: AppSidebarScopePanel) => void;
  scopePanels: ScopePanelConfig[];
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
  projectPopupLeft = 0,
  projectPopupTop,
  projects,
  seasons = [],
  selectedProjectId,
  selectedSeasonId = null,
  setActiveScopePanel,
  scopePanels,
}: AppSidebarPopupsProps) {
  const portalTarget = useModalPortalTarget();
  const shouldShowScopePopup = isScopePopupOpen ?? isProjectPopupOpen;
  const shouldShowEditRobot = canEditSelectedRobot ?? Boolean(onEditSelectedRobot);
  const popup = shouldShowScopePopup ? (
    <div
      className="sidebar-compact-popup sidebar-scope-popup-shell"
      ref={projectPopupRef}
      style={{
        top: `${projectPopupTop}px`,
        left: `${projectPopupLeft}px`,
        "--sidebar-popup-left": `${projectPopupLeft}px`,
        "--shell-sidebar-width": `${projectPopupLeft}px`,
        "--shell-topbar-height": "58px",
      } as CSSProperties}
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
        scopePanels={scopePanels}
      />
    </div>
  ) : null;

  return (
    popup && portalTarget ? createPortal(popup, portalTarget) : popup
  );
}

export { ADD_ROBOT_PROJECT_VALUE, CREATE_SEASON_OPTION_VALUE };
