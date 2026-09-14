import type { RefObject } from "react";

import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarScopeMenuPopup,
  CREATE_SEASON_OPTION_VALUE,
  type AppSidebarScopePanel,
} from "./AppSidebarScopeMenuPopup";
import type { AppSidebarPopupState } from "./useAppSidebarPopupState";
import { scopePanels as sidebarScopePanels } from "./sidebar/sidebarItems.json";

interface AppSidebarPopupsProps {
  popup: AppSidebarPopupState;
  canEditSelectedRobot?: boolean;
  onEditSelectedRobot?: () => void;
  onSelectProjectOption: (value: string) => void;
  onSelectSeasonOption?: (value: string) => void;
  onPanelChange: (panel: AppSidebarScopePanel) => void;
  projectPopupRef: RefObject<HTMLDivElement | null>;
  projects: ProjectRecord[];
  seasons?: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId?: string | null;
  scopePanels?: any[];
}

export function AppSidebarPopups({
  popup,
  canEditSelectedRobot,
  onEditSelectedRobot,
  onSelectProjectOption,
  onSelectSeasonOption,
  onPanelChange,
  projectPopupRef,
  projects,
  seasons = [],
  selectedProjectId,
  selectedSeasonId = null,
  scopePanels: externalScopePanels,
}: AppSidebarPopupsProps) {
  const shouldShowEditRobot = canEditSelectedRobot ?? Boolean(onEditSelectedRobot);
  const panels = externalScopePanels ?? (sidebarScopePanels as any)?.find((p: any) => p.id === "scope-panels")?.panels ?? [{ id: "project", label: "Project" }, { id: "season", label: "Season" }];

  return (
    <>
      {popup.isOpen ? (
        <div
          className="sidebar-compact-popup sidebar-scope-popup-shell"
          ref={projectPopupRef}
          style={{ top: `${popup.top}px` }}
        >
          <AppSidebarScopeMenuPopup
            activePanel={popup.activePanel}
            canEditSelectedRobot={shouldShowEditRobot}
            onEditSelectedRobot={onEditSelectedRobot ?? (() => undefined)}
            onPanelChange={onPanelChange}
            onSelectProjectOption={onSelectProjectOption}
            onSelectSeasonOption={onSelectSeasonOption ?? (() => undefined)}
            projects={projects}
            seasons={seasons}
            selectedProjectId={selectedProjectId}
            selectedSeasonId={selectedSeasonId}
            scopePanels={panels}
          />
        </div>
      ) : null}
    </>
  );
}

export { ADD_ROBOT_PROJECT_VALUE, CREATE_SEASON_OPTION_VALUE };
