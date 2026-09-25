import { type MouseEvent as ReactMouseEvent } from "react";

import {
  type InventoryViewTab,
  type ManufacturingViewTab,
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
import type { WorkspaceEditToastNotice } from "@/features/workspace/workspaceEditToastNotice";

import {
  ADD_ROBOT_PROJECT_VALUE,
  AppSidebarPopups,
  CREATE_SEASON_OPTION_VALUE,
} from "./AppSidebarPopups";
import { AppSidebarProjectFooter } from "./AppSidebarProjectFooter";
import { AppSidebarQuickActions } from "./AppSidebarQuickActions";
import { AppSidebarSections } from "./AppSidebarSections";
import { SidebarProvider, type SidebarState } from "./sidebar/context/SidebarContext";
import { useSidebarScrollHints } from "./sidebar/useSidebarScrollHints";
import { useAppSidebarNavigationModels } from "./sidebar/useAppSidebarNavigationModels";
import { useAppSidebarPopupState } from "./useAppSidebarPopupState";

interface AppSidebarProps {
  activeTab: ViewTab;
  canSignIn: boolean;
  handleSignOut: () => void;
  isDarkMode: boolean;
  onSelectTarget: (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => void;
  isCollapsed: boolean;
  isNotificationQueueOpen: boolean;
  notificationCount: number;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateSeason: () => void;
  onCreateTask: () => void;
  onRefreshWorkspace: () => void;
  onSignIn: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onOpenProfileEditor: () => void;
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
  onEnqueueNotification: (notice: WorkspaceEditToastNotice) => void;
  localMode?: "demo" | "tutorial" | null;
  onResetDemo?: () => void;
}

export function AppSidebar({
  activeTab,
  canSignIn,
  handleSignOut,
  isDarkMode,
  onSelectTarget,
  isCollapsed,
  isNotificationQueueOpen,
  notificationCount,
  onCreateMilestone,
  onCreatePart,
  onCreateQaReport,
  onCreateSeason,
  onCreateTask,
  onRefreshWorkspace,
  onSignIn,
  onSelectSeason,
  onOpenProfileEditor,
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
  onEnqueueNotification,
  localMode,
  onResetDemo,
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
  const {
    activeSubItemId,
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
    popup,
    projectPopupRef,
    projectTriggerRef,
    closePopup,
    togglePopup,
    setActivePanel,
    sidebarShellRef,
  } = useAppSidebarPopupState();
  const {
    hasBottomHint,
    hasTopHint,
    sidebarScrollRef,
  } = useSidebarScrollHints();

  const handleSubItemSelect = (target: NavigationTarget) => {
    onSelectTarget(target);
  };

  const handleDisabledSubItemSelect = () => onEnqueueNotification({
    title: "Select Robot Project",
    message: "Select a robot project first to open this view.",
    tone: "error",
  });

  const handleProjectTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const shellRect = sidebarShellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
    togglePopup(popupTop);
  };

  const handleProjectOptionSelect = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
    } else {
      onSelectProject(value || null);
    }

    closePopup();
  };

  const handleSeasonOptionSelect = (value: string) => {
    if (value === CREATE_SEASON_OPTION_VALUE) {
      onCreateSeason();
      closePopup();
      return;
    }

    onSelectSeason(value || null);
    closePopup();
  };

  const handleHelpSelect = () => {
    closePopup();
    onSelectTarget({ tab: "help" }, { keepSidebarOpen: true });
  };
  const handleSidebarFoldClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    closePopup();
    toggleSidebar();
    event.currentTarget.blur();
  };

  const sidebarState: SidebarState = {
    // Navigation
    activeTab,
    activeSubItemId,
    sectionModels,
    onSelectTarget,
    onDisabledSubItemSelect: handleDisabledSubItemSelect,
    // Shell
    isCollapsed,
    toggleSidebar: handleSidebarFoldClick,
    // Scope
    projects,
    seasons,
    selectedProjectId,
    selectedSeasonId,
    selectedScopeLabel,
    canEditSelectedRobot,
    onSelectProject,
    onSelectSeason,
    onCreateRobot,
    onCreateSeason,
    onEditSelectedRobot,
    // Popup
    popup,
    projectPopupRef,
    projectTriggerRef,
    sidebarShellRef,
    onProjectTriggerClick: handleProjectTriggerClick,
    onProjectOptionSelect: handleProjectOptionSelect,
    onSeasonOptionSelect: handleSeasonOptionSelect,
    onPanelChange: setActivePanel,
    closePopup,
    // Quick actions
    sessionUser,
    onCreateMilestone,
    onCreatePart,
    onCreateQaReport,
    onCreateTask,
    onOpenProfileEditor,
    // Footer / settings
    canSignIn,
    handleSignOut,
    onSignIn,
    isDarkMode,
    toggleDarkMode,
    onRefreshWorkspace,
    isNotificationQueueOpen,
    notificationCount,
    onToggleNotificationQueue,
    onHelpSelect: handleHelpSelect,
    // Local mode
    localMode: localMode ?? null,
    onResetDemo: onResetDemo ?? (() => undefined),
    // Notifications
    onEnqueueNotification,
  };

  return (
    <SidebarProvider value={sidebarState}>
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
          <AppSidebarQuickActions />
          <AppSidebarSections />
          <AppSidebarProjectFooter />
        </nav>
        <AppSidebarPopups />
      </div>
    </SidebarProvider>
  );
}
