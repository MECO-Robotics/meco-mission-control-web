import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarScopeMenuPopup,
  CREATE_SEASON_OPTION_VALUE,
} from "./AppSidebarScopeMenuPopup";
import { useSidebarContext } from "./sidebar/context/SidebarContext";

export function AppSidebarPopups() {
  const {
    popup,
    canEditSelectedRobot,
    onEditSelectedRobot,
    onProjectOptionSelect,
    onSeasonOptionSelect,
    onPanelChange,
    projectPopupRef,
    projects,
    seasons,
    selectedProjectId,
    selectedSeasonId,
  } = useSidebarContext();

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
            canEditSelectedRobot={canEditSelectedRobot}
            onEditSelectedRobot={onEditSelectedRobot}
            onPanelChange={onPanelChange}
            onSelectProjectOption={onProjectOptionSelect}
            onSelectSeasonOption={onSeasonOptionSelect}
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
