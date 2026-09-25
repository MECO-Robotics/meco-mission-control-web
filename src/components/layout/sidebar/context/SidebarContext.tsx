import { createContext, useContext } from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";
import type { NavigationTarget, NavigationSubItemId, ViewTab } from "@/lib/workspaceNavigation";
import type { SessionUser } from "@/lib/auth/types";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import type { WorkspaceEditToastNotice } from "@/features/workspace/workspaceEditToastNotice";
import type { SidebarSectionModel } from "../../AppSidebarSections";
import type { AppSidebarScopePanel } from "../../AppSidebarScopeMenuPopup";

/**
 * Single source of truth for everything the sidebar renders.
 *
 * Replaces the ~40-prop interface previously threaded through
 * AppSidebar -> AppSidebarSections / AppSidebarQuickActions /
 * AppSidebarProjectFooter / AppSidebarPopups.
 */
export interface SidebarState {
  // --- Navigation ---
  activeTab: ViewTab;
  activeSubItemId: NavigationSubItemId | null;
  sectionModels: SidebarSectionModel[];
  onSelectTarget: (target: NavigationTarget, options?: { keepSidebarOpen?: boolean }) => void;
  onDisabledSubItemSelect: () => void;

  // --- Shell / collapse ---
  isCollapsed: boolean;
  toggleSidebar: (event: MouseEvent<HTMLButtonElement>) => void;

  // --- Scope (project / season) ---
  projects: ProjectRecord[];
  seasons: SeasonRecord[];
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  selectedScopeLabel: string;
  canEditSelectedRobot: boolean;
  onSelectProject: (projectId: string | null) => void;
  onSelectSeason: (seasonId: string | null) => void;
  onCreateRobot: () => void;
  onCreateSeason: () => void;
  onEditSelectedRobot: () => void;

  // --- Popup (scope menu) ---
  popup: {
    activePanel: AppSidebarScopePanel | null;
    isOpen: boolean;
    top: number;
  };
  projectPopupRef: RefObject<HTMLDivElement | null>;
  projectTriggerRef: RefObject<HTMLButtonElement | null>;
  sidebarShellRef: RefObject<HTMLDivElement | null>;
  onProjectTriggerClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onProjectOptionSelect: (value: string) => void;
  onSeasonOptionSelect: (value: string) => void;
  onPanelChange: (panel: AppSidebarScopePanel) => void;
  closePopup: () => void;

  // --- Quick actions ---
  sessionUser: SessionUser | null;
  onCreateMilestone: () => void;
  onCreatePart: () => void;
  onCreateQaReport: () => void;
  onCreateTask: () => void;
  onOpenProfileEditor: () => void;

  // --- Footer / settings ---
  canSignIn: boolean;
  handleSignOut: () => void;
  onSignIn: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onRefreshWorkspace: () => void;
  isNotificationQueueOpen: boolean;
  notificationCount: number;
  onToggleNotificationQueue: () => void;
  onHelpSelect: () => void;

  // --- Local mode ---
  localMode: "demo" | "tutorial" | null;
  onResetDemo: () => void;

  // --- Notifications ---
  onEnqueueNotification: (notice: WorkspaceEditToastNotice) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebarContext(): SidebarState {
  const context = useContext(SidebarContext);
  if (context === null) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SidebarState;
}) {
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
