import { type Dispatch, type SetStateAction } from "react";

import { MECO_MAIN_LOGO_HEIGHT, MECO_MAIN_LOGO_LIGHT_SRC, MECO_MAIN_LOGO_WHITE_SRC, MECO_MAIN_LOGO_WIDTH } from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";
import {
  type InventoryViewTab,
  type ManufacturingViewTab,
  type ReportsViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type WorklogsViewTab,
  type ViewTab,
} from "@/lib/workspaceNavigation";
import type { SeasonRecord } from "@/types/recordsOrganization";

import { AppTopbarNavigation } from "./AppTopbarNavigation";
import { AppTopbarRightRail } from "./AppTopbarRightRail";

interface AppTopbarProps {
  activeTab: ViewTab;
  handleSignOut: () => void;
  inventoryView: InventoryViewTab;
  isLoadingData: boolean;
  isDarkMode: boolean;
  isMyViewActive: boolean;
  isNonRobotProject: boolean;
  isSidebarCollapsed: boolean;
  loadWorkspace: () => Promise<void>;
  manufacturingView: ManufacturingViewTab;
  myViewMemberName: string | null;
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  reportsView: ReportsViewTab;
  riskManagementView: RiskManagementViewTab;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
  sessionUser: SessionUser | null;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setReportsView: Dispatch<SetStateAction<ReportsViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<RiskManagementViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  subsystemsLabel: string;
  taskView: TaskViewTab;
  toggleDarkMode: () => void;
  worklogsView: WorklogsViewTab;
}

export function AppTopbar({
  activeTab,
  handleSignOut,
  inventoryView,
  isLoadingData,
  isDarkMode,
  isMyViewActive,
  isNonRobotProject,
  isSidebarCollapsed,
  loadWorkspace,
  manufacturingView,
  myViewMemberName,
  onCreateSeason,
  onSelectSeason,
  onToggleMyView,
  reportsView,
  riskManagementView,
  seasons,
  selectedSeasonId,
  sessionUser,
  setInventoryView,
  setManufacturingView,
  setReportsView,
  setRiskManagementView,
  setTaskView,
  setWorklogsView,
  subsystemsLabel,
  taskView,
  toggleDarkMode,
  worklogsView,
}: AppTopbarProps) {
  return (
    <header className="topbar app-topbar" data-collapsed={isSidebarCollapsed ? "true" : "false"}>
      <div className="app-topbar-brand">
        <img
          alt="MECO main logo"
          className="app-topbar-brand-icon"
          fetchPriority="high"
          height={MECO_MAIN_LOGO_HEIGHT}
          loading="eager"
          width={MECO_MAIN_LOGO_WIDTH}
          src={isDarkMode ? MECO_MAIN_LOGO_WHITE_SRC : MECO_MAIN_LOGO_LIGHT_SRC}
        />
      </div>
      <div className="app-topbar-left" />

      <div className="app-topbar-nav">
        <AppTopbarNavigation
          activeTab={activeTab}
          inventoryView={inventoryView}
          isNonRobotProject={isNonRobotProject}
          manufacturingView={manufacturingView}
          reportsView={reportsView}
          riskManagementView={riskManagementView}
          setInventoryView={setInventoryView}
          setManufacturingView={setManufacturingView}
          setReportsView={setReportsView}
          setRiskManagementView={setRiskManagementView}
          setTaskView={setTaskView}
          setWorklogsView={setWorklogsView}
          subsystemsLabel={subsystemsLabel}
          taskView={taskView}
          worklogsView={worklogsView}
        />
      </div>

      <AppTopbarRightRail
        handleSignOut={handleSignOut}
        isDarkMode={isDarkMode}
        isLoadingData={isLoadingData}
        isMyViewActive={isMyViewActive}
        loadWorkspace={loadWorkspace}
        myViewMemberName={myViewMemberName}
        onCreateSeason={onCreateSeason}
        onSelectSeason={onSelectSeason}
        onToggleMyView={onToggleMyView}
        selectedSeasonId={selectedSeasonId}
        seasons={seasons}
        sessionUser={sessionUser}
        toggleDarkMode={toggleDarkMode}
      />
    </header>
  );
}
