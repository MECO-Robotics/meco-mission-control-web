import {
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";

import {
  type InventoryViewTab,
  type NavigationSection,
  type NavigationSubItemId,
  type NavigationTarget,
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
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
import { AppSidebarSections, type SidebarSubItemModel } from "./AppSidebarSections";
import { useAppSidebarPopupState } from "./useAppSidebarPopupState";

interface AppSidebarProps {
  activeTab: ViewTab;
  favoriteViewIds: readonly NavigationSubItemId[];
  handleSignOut: () => void;
  items: import("@/lib/workspaceNavigation").NavigationItem[];
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
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  onToggleNotificationQueue: () => void;
  toggleSidebar: () => void;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  inventoryView: InventoryViewTab;
  reportsView: ReportsViewTab;
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
  favoriteViewIds,
  handleSignOut,
  items,
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
  onSelectSeason,
  onToggleMyView,
  onToggleNotificationQueue,
  toggleSidebar,
  projects,
  selectedProjectId,
  selectedSeasonId,
  inventoryView,
  reportsView,
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
  const isRobotProject = selectedProject?.projectType === "robot";
  const canEditSelectedRobot = selectedProject?.projectType === "robot";
  const selectedProjectLabel = selectedProject?.name ?? "All projects";

  const visibleTabs = useMemo(() => new Set(items.map((item) => item.value)), [items]);

  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    manufacturingView: "cnc",
    rosterView,
    reportsView,
    riskManagementView,
    taskView,
    worklogsView,
  });
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : null;

  const {
    compactPopupRef,
    compactPopupSection,
    compactPopupTop,
    expandedSection,
    isProjectPopupOpen,
    projectPopupRef,
    projectPopupTop,
    projectTriggerRef,
    setCompactPopupSection,
    setCompactPopupTop,
    setExpandedSection,
    setIsProjectPopupOpen,
    setProjectPopupTop,
    sidebarShellRef,
  } = useAppSidebarPopupState({ activeSection, isCollapsed });

  const isSubItemEnabled = useCallback(
    (subItemId: NavigationSubItemId) => {
      const subItem = NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId);
      if (subItem && !visibleTabs.has(subItem.target.tab)) {
        return false;
      }

      if (subItemId === "config-robot-model") {
        return isRobotProject;
      }

      if (subItemId === "config-cad") {
        return isRobotProject;
      }

      if (subItemId === "config-part-mappings") {
        return isRobotProject;
      }

      if (subItemId === "inventory-parts") {
        return isRobotProject;
      }

      return true;
    },
    [isRobotProject, visibleTabs],
  );

  const getSectionSubItems = useCallback(
    (section: NavigationSection): SidebarSubItemModel[] =>
      NAVIGATION_SUB_ITEMS_BY_SECTION[section].map((subItem) => ({
        ...subItem,
        isEnabled: isSubItemEnabled(subItem.id),
      })),
    [isSubItemEnabled],
  );

  const sectionModels = useMemo(
    () =>
      NAVIGATION_SECTION_ORDER.map((section) => {
        const subItems = getSectionSubItems(section);
        return {
          section,
          subItems,
          isEnabled: subItems.some((subItem) => subItem.isEnabled),
        };
      }),
    [getSectionSubItems],
  );
  const favoriteSubItems = useMemo(() => {
    const requestedFavoriteIds = new Set(favoriteViewIds);
    return NAVIGATION_SUB_ITEMS
      .filter((subItem) => requestedFavoriteIds.has(subItem.id))
      .map((subItem) => ({
        ...subItem,
        isEnabled: isSubItemEnabled(subItem.id),
      }));
  }, [favoriteViewIds, isSubItemEnabled]);

  const handleSectionClick = (section: NavigationSection, event: ReactMouseEvent<HTMLButtonElement>) => {
    const subItems = getSectionSubItems(section);
    const firstEnabledSubItem = subItems.find((subItem) => subItem.isEnabled);

    if (isCollapsed) {
      const shellRect = sidebarShellRef.current?.getBoundingClientRect();
      const targetRect = event.currentTarget.getBoundingClientRect();
      const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
      setCompactPopupTop(popupTop);
      setIsProjectPopupOpen(false);
      setCompactPopupSection((current) => (current === section ? null : section));
      return;
    }

    setExpandedSection(section);

    if (firstEnabledSubItem) {
      onSelectTarget(firstEnabledSubItem.target, { keepSidebarOpen: true });
    }
  };

  const handleSubItemSelect = (target: NavigationTarget, isEnabled: boolean) => {
    if (!isEnabled) {
      return;
    }

    onSelectTarget(target);
    setCompactPopupSection(null);
  };

  const handleProjectTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const shellRect = sidebarShellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
    setProjectPopupTop(popupTop);

    if (isCollapsed) {
      setCompactPopupSection(null);
    }

    setIsProjectPopupOpen((current) => !current);
  };

  const handleProjectOptionSelect = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
    } else {
      onSelectProject(value || null);
    }

    setIsProjectPopupOpen(false);
  };

  const handleSeasonOptionSelect = (value: string) => {
    if (value === CREATE_SEASON_OPTION_VALUE) {
      onCreateSeason();
      setIsProjectPopupOpen(false);
      return;
    }

    onSelectSeason(value || null);
  };

  const handleHelpSelect = () => {
    setCompactPopupSection(null);
    setIsProjectPopupOpen(false);
    onSelectTarget({ tab: "help" }, { keepSidebarOpen: true });
  };
  const handleSidebarFoldClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    toggleSidebar();
    event.currentTarget.blur();
  };

  return (
    <div className="sidebar-shell" data-collapsed={isCollapsed ? "true" : "false"} ref={sidebarShellRef}>
      <nav aria-label="Workspace views" className="sidebar" data-collapsed={isCollapsed ? "true" : "false"}>
        <AppSidebarQuickActions
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          onCreateMilestone={onCreateMilestone}
          onCreatePart={onCreatePart}
          onCreateQaReport={onCreateQaReport}
          onCreateTask={onCreateTask}
          onSelectTarget={onSelectTarget}
          onToggleSidebar={handleSidebarFoldClick}
        />

        <AppSidebarSections
          activeSection={activeSection}
          activeSubItemId={activeSubItemId}
          expandedSection={expandedSection}
          isCollapsed={isCollapsed}
          onSectionClick={handleSectionClick}
          onSubItemSelect={handleSubItemSelect}
          favoriteSubItems={favoriteSubItems}
          sectionModels={sectionModels}
        />

        <AppSidebarProjectFooter
          activeTab={activeTab}
          canSignOut={sessionUser !== null}
          isDarkMode={isDarkMode}
          isCollapsed={isCollapsed}
          isMyViewActive={isMyViewActive}
          isNotificationQueueOpen={isNotificationQueueOpen}
          isProjectPopupOpen={isProjectPopupOpen}
          myViewMemberName={myViewMemberName}
          onHelpSelect={handleHelpSelect}
          onProjectTriggerClick={handleProjectTriggerClick}
          onRefreshWorkspace={onRefreshWorkspace}
          onSignOut={handleSignOut}
          onToggleMyView={onToggleMyView}
          onToggleDarkMode={toggleDarkMode}
          onNotificationQueueToggle={onToggleNotificationQueue}
          notificationCount={notificationCount}
          projectTriggerRef={projectTriggerRef}
          selectedProjectLabel={selectedProjectLabel}
          sessionUser={sessionUser}
        />
      </nav>
      <AppSidebarPopups
        activeSubItemId={activeSubItemId}
        compactPopupRef={compactPopupRef}
        compactPopupSection={compactPopupSection}
        compactPopupTop={compactPopupTop}
        getSectionSubItems={getSectionSubItems}
        isCollapsed={isCollapsed}
        isProjectPopupOpen={isProjectPopupOpen}
        isScopePopupOpen={isProjectPopupOpen}
        canEditSelectedRobot={canEditSelectedRobot}
        onEditSelectedRobot={onEditSelectedRobot}
        onSelectProjectOption={handleProjectOptionSelect}
        onSelectSeasonOption={handleSeasonOptionSelect}
        onSubItemSelect={handleSubItemSelect}
        projectPopupRef={projectPopupRef}
        projectPopupTop={projectPopupTop}
        projects={projects}
        seasons={seasons}
        selectedProjectId={selectedProjectId}
        selectedSeasonId={selectedSeasonId}
      />
    </div>
  );
}
