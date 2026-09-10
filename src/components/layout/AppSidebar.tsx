import { useState, type MouseEvent as ReactMouseEvent } from "react";

import {
  type InventoryViewTab,
  type ManufacturingViewTab,
  type NavigationSection,
  type NavigationTarget,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
  resolveViewAvailabilityContext,
} from "@/lib/workspaceNavigation";
import type { SessionUser } from "@/lib/auth/types";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";

import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarPopups,
  CREATE_SEASON_OPTION_VALUE,
} from "./AppSidebarPopups";
import { AppSidebarProjectFooter } from "./AppSidebarProjectFooter";
import { AppSidebarQuickActions } from "./AppSidebarQuickActions";
import { AppSidebarSections } from "./AppSidebarSections";
import { useSidebarScrollHints } from "./sidebar/useSidebarScrollHints";
import { useAppSidebarNavigationModels } from "./sidebar/useAppSidebarNavigationModels";
import type { AppSidebarScopePanel } from "./AppSidebarScopeMenuPopup";
import { useAppSidebarPopupState } from "./useAppSidebarPopupState";

interface AppSidebarProps {
  activeTab: ViewTab;
  canSignIn: boolean;
  handleSignOut: () => void;
  isDarkMode: boolean;
  isMyViewActive: boolean;
  onSelectTarget: (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => void;
  isCollapsed: boolean;
  isNotificationQueueOpen: boolean;
  myViewMemberName: string | null;
  notificationCount: number;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateSeason: () => void;
  onCreateTask: () => void;
  onRefreshWorkspace: () => void;
  onSignIn: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  onToggleNotificationQueue: () => void;
  toggleSidebar: () => void;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  inventoryView: InventoryViewTab;
  manufacturingView?: ManufacturingViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  seasons: SeasonRecord[];
  sessionUser: SessionUser | null;
  taskView: TaskViewTab;
  toggleDarkMode: () => void;
  worklogsView: WorklogsViewTab;
  onSelectProject: (projectId: string | null) => void;
  onCreateRobot: () => void;
  onEditSelectedRobot: () => void;
}

export function AppSidebar({
  activeTab,
  canSignIn,
  handleSignOut,
  isDarkMode,
  isMyViewActive,
  onSelectTarget,
  isCollapsed,
  isNotificationQueueOpen,
  myViewMemberName,
  notificationCount,
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateSeason,
  onCreateTask,
  onRefreshWorkspace,
  onSignIn,
  onSelectSeason,
  onToggleMyView,
  onToggleNotificationQueue,
  toggleSidebar,
  projects,
  selectedProjectId,
  selectedSeasonId,
  inventoryView,
  manufacturingView = "all",
  rosterView,
  riskManagementView,
  seasons,
  sessionUser,
  taskView,
  toggleDarkMode,
  worklogsView,
  onSelectProject,
  onCreateRobot,
  onEditSelectedRobot,
}: AppSidebarProps) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;
  const viewAvailabilityContext = resolveViewAvailabilityContext({
    hasProjects: projects.length > 0,
    hasSeasons: seasons.length > 0,
    selectedProjectType: selectedProject?.projectType ?? null,
  });
  const canEditSelectedRobot = selectedProject?.projectType === "robot";
  const selectedProjectLabel = selectedProject?.name ?? "All projects";
  const selectedScopeLabel = selectedSeason
    ? `${selectedSeason.name} - ${selectedProjectLabel}`
    : selectedProjectLabel;
  const [activeScopePanel, setActiveScopePanel] = useState<AppSidebarScopePanel | null>(null);

  const {
    activeSection,
    getSectionSubItems,
    sectionModels,
  } = useAppSidebarNavigationModels({
    activeTab,
    inventoryView,
    manufacturingView,
    rosterView,
    riskManagementView,
    taskView,
    viewAvailabilityContext,
    worklogsView,
  });

  const {
    isProjectPopupOpen,
    projectPopupRef,
    projectPopupTop,
    projectTriggerRef,
    setIsProjectPopupOpen,
    setProjectPopupTop,
    sidebarShellRef,
  } = useAppSidebarPopupState({
    projectPopupLayoutKey: activeScopePanel,
  });
  const {
    hasBottomHint,
    hasTopHint,
    sidebarScrollRef,
  } = useSidebarScrollHints();

  const handleSectionClick = (section: NavigationSection) => {
    const firstEnabledSubItem = getSectionSubItems(section).find((item) => item.isEnabled);
    if (firstEnabledSubItem) onSelectTarget(firstEnabledSubItem.target, { keepSidebarOpen: true });
  };

  const handleProjectTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const shellRect = sidebarShellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
    setProjectPopupTop(popupTop);

    setActiveScopePanel(null);
    setIsProjectPopupOpen((current) => !current);
  };

  const handleProjectOptionSelect = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
    } else {
      onSelectProject(value || null);
    }

    setIsProjectPopupOpen(false);
    setActiveScopePanel(null);
  };

  const handleSeasonOptionSelect = (value: string) => {
    if (value === CREATE_SEASON_OPTION_VALUE) {
      onCreateSeason();
      setIsProjectPopupOpen(false);
      setActiveScopePanel(null);
      return;
    }

    onSelectSeason(value || null);
    setIsProjectPopupOpen(false);
    setActiveScopePanel(null);
  };

  const handleHelpSelect = () => {
    setIsProjectPopupOpen(false);
    setActiveScopePanel(null);
    onSelectTarget({ tab: "help" }, { keepSidebarOpen: true });
  };
  const handleSidebarFoldClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    setIsProjectPopupOpen(false);
    setActiveScopePanel(null);
    toggleSidebar();
    event.currentTarget.blur();
  };

  return (
    <div
      className="sidebar-shell"
      data-collapsed={isCollapsed ? "true" : "false"}
      data-scroll-bottom-hint={hasBottomHint ? "true" : "false"}
      data-scroll-top-hint={hasTopHint ? "true" : "false"}
      ref={sidebarShellRef}
    >
      <nav
        aria-label="Workspace views"
        className="sidebar"
        data-collapsed={isCollapsed ? "true" : "false"}
        ref={sidebarScrollRef}
      >
        <AppSidebarQuickActions
          isCollapsed={isCollapsed}
          onCreateMilestone={onCreateMilestone}
          onCreatePart={onCreatePart}
          onCreateQaReport={onCreateQaReport}
          onCreateTask={onCreateTask}
          onToggleSidebar={handleSidebarFoldClick}
        />

        <AppSidebarSections
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          sectionModels={sectionModels}
        />

        <AppSidebarProjectFooter
          isCollapsed={isCollapsed}
          activeTab={activeTab}
          canSignIn={canSignIn}
          canSignOut={sessionUser !== null}
          isDarkMode={isDarkMode}
          isMyViewActive={isMyViewActive}
          isNotificationQueueOpen={isNotificationQueueOpen}
          isProjectPopupOpen={isProjectPopupOpen}
          myViewMemberName={myViewMemberName}
          onHelpSelect={handleHelpSelect}
          onProjectTriggerClick={handleProjectTriggerClick}
          onRefreshWorkspace={onRefreshWorkspace}
          onSignIn={onSignIn}
          onSignOut={handleSignOut}
          onToggleMyView={onToggleMyView}
          onToggleDarkMode={toggleDarkMode}
          onNotificationQueueToggle={onToggleNotificationQueue}
          notificationCount={notificationCount}
          projectTriggerRef={projectTriggerRef}
          selectedScopeLabel={selectedScopeLabel}
          sessionUser={sessionUser}
        />
      </nav>
      <AppSidebarPopups
        activeScopePanel={activeScopePanel}
        isProjectPopupOpen={isProjectPopupOpen}
        isScopePopupOpen={isProjectPopupOpen}
        canEditSelectedRobot={canEditSelectedRobot}
        onEditSelectedRobot={onEditSelectedRobot}
        onSelectProjectOption={handleProjectOptionSelect}
        onSelectSeasonOption={handleSeasonOptionSelect}
        projectPopupRef={projectPopupRef}
        projectPopupTop={projectPopupTop}
        projects={projects}
        seasons={seasons}
        selectedProjectId={selectedProjectId}
        selectedSeasonId={selectedSeasonId}
        setActiveScopePanel={setActiveScopePanel}
      />
    </div>
  );
}
