import { type ChangeEvent, type Dispatch, type SetStateAction } from "react";

import {
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
  MECO_PROFILE_AVATAR_SIZE,
} from "@/lib/branding";
import {
  BASE_SECTION_LABELS,
  RISK_MANAGEMENT_VIEW_OPTIONS,
  MANUFACTURING_VIEW_OPTIONS,
  NON_ROBOT_INVENTORY_VIEW_OPTIONS,
  ROBOT_INVENTORY_VIEW_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_VIEW_OPTIONS,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type WorklogsViewTab,
  type ViewOption,
  type ViewTab,
} from "@/lib/workspaceNavigation";
import type { SessionUser } from "@/lib/auth";
import type { SeasonRecord } from "@/types";
import { IconEye, IconRefresh } from "@/components/shared";

const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

function TopbarTabs<T extends string>({
  activeValue,
  ariaLabel,
  onChange,
  options,
  tutorialPrefix,
}: {
  activeValue: T;
  ariaLabel: string;
  onChange: Dispatch<SetStateAction<T>>;
  options: readonly ViewOption<T>[];
  tutorialPrefix?: string;
}) {
  return (
    <div className="tabbar workspace-section-tabs app-topbar-section-tabs" aria-label={ariaLabel} role="group">
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <button
            key={option.value}
            aria-pressed={isActive}
            className="tab"
            data-active={isActive ? "true" : "false"}
            data-tutorial-target={
              tutorialPrefix ? `${tutorialPrefix}-${option.value}` : undefined
            }
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function TopbarNavigation({
  activeTab,
  inventoryView,
  isNonRobotProject,
  manufacturingView,
  riskManagementView,
  worklogsView,
  setInventoryView,
  setManufacturingView,
  setRiskManagementView,
  setWorklogsView,
  setTaskView,
  subsystemsLabel,
  taskView,
}: {
  activeTab: ViewTab;
  inventoryView: InventoryViewTab;
  isNonRobotProject: boolean;
  manufacturingView: ManufacturingViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<RiskManagementViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  subsystemsLabel: string;
  taskView: TaskViewTab;
}) {
  const effectiveInventoryView =
    isNonRobotProject && inventoryView === "parts" ? "materials" : inventoryView;

  switch (activeTab) {
    case "tasks":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.tasks}</span>
          <TopbarTabs
            activeValue={taskView}
            ariaLabel="Task views"
            onChange={setTaskView}
            options={TASK_VIEW_OPTIONS}
            tutorialPrefix="task-view"
          />
        </>
      );
    case "risk-management":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS["risk-management"]}</span>
          <TopbarTabs
            activeValue={riskManagementView}
            ariaLabel="Risk management views"
            onChange={setRiskManagementView}
            options={RISK_MANAGEMENT_VIEW_OPTIONS}
            tutorialPrefix="risk-management-view"
          />
        </>
      );
    case "worklogs":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.worklogs}</span>
          <TopbarTabs
            activeValue={worklogsView}
            ariaLabel="Work log views"
            onChange={setWorklogsView}
            options={WORKLOG_VIEW_OPTIONS}
            tutorialPrefix="worklogs-view"
          />
        </>
      );
    case "manufacturing":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.manufacturing}</span>
          <TopbarTabs
            activeValue={manufacturingView}
            ariaLabel="Manufacturing views"
            onChange={setManufacturingView}
            options={MANUFACTURING_VIEW_OPTIONS}
            tutorialPrefix="manufacturing-view"
          />
        </>
      );
    case "inventory":
      return (
        <>
          <span className="app-topbar-page-label">{BASE_SECTION_LABELS.inventory}</span>
          <TopbarTabs
            activeValue={effectiveInventoryView}
            ariaLabel="Inventory views"
            onChange={setInventoryView}
            options={
              isNonRobotProject
                ? NON_ROBOT_INVENTORY_VIEW_OPTIONS
                : ROBOT_INVENTORY_VIEW_OPTIONS
            }
            tutorialPrefix="inventory-view"
          />
        </>
      );
    default:
      return (
        <span className="app-topbar-page-label">
          {activeTab === "subsystems" ? subsystemsLabel : BASE_SECTION_LABELS[activeTab]}
        </span>
      );
  }
}

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
  riskManagementView: RiskManagementViewTab;
  myViewMemberName: string | null;
  sessionUser: SessionUser | null;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setRiskManagementView: Dispatch<SetStateAction<RiskManagementViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  setWorklogsView: Dispatch<SetStateAction<WorklogsViewTab>>;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
  subsystemsLabel: string;
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  toggleDarkMode: () => void;
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
  riskManagementView,
  myViewMemberName,
  sessionUser,
  setInventoryView,
  setManufacturingView,
  setRiskManagementView,
  setTaskView,
  setWorklogsView,
  taskView,
  worklogsView,
  seasons,
  selectedSeasonId,
  subsystemsLabel,
  onCreateSeason,
  onSelectSeason,
  onToggleMyView,
  toggleDarkMode,
}: AppTopbarProps) {
  const themeToggleMenuLabel = isDarkMode ? "Light mode" : "Dark mode";
  const themeToggleMenuTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  const handleSeasonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    if (nextValue === CREATE_SEASON_OPTION_VALUE) {
      event.target.value = selectedSeasonId ?? "";
      onCreateSeason();
      return;
    }

    onSelectSeason(nextValue || null);
  };

  return (
    <header
      className="topbar app-topbar"
      data-collapsed={isSidebarCollapsed ? "true" : "false"}
    >
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
      <div className="app-topbar-left">
      </div>

      <div className="app-topbar-nav">
        <TopbarNavigation
          activeTab={activeTab}
          inventoryView={inventoryView}
          isNonRobotProject={isNonRobotProject}
          manufacturingView={manufacturingView}
          riskManagementView={riskManagementView}
          worklogsView={worklogsView}
          setInventoryView={setInventoryView}
          setManufacturingView={setManufacturingView}
          setRiskManagementView={setRiskManagementView}
          setWorklogsView={setWorklogsView}
          setTaskView={setTaskView}
          subsystemsLabel={subsystemsLabel}
          taskView={taskView}
        />
      </div>

      <div className="topbar-right app-topbar-right">
        <button
          aria-label={isMyViewActive ? "Clear My View filter" : "Show My View filter"}
          aria-pressed={isMyViewActive}
          className={
            isMyViewActive
              ? "app-topbar-my-view-button is-active"
              : "app-topbar-my-view-button"
          }
          disabled={!myViewMemberName}
          onClick={onToggleMyView}
          title={
            myViewMemberName
              ? isMyViewActive
                ? `Showing ${myViewMemberName}`
                : `Filter workspace to ${myViewMemberName}`
              : "No roster member matches the signed-in user"
          }
          type="button"
        >
          <IconEye />
        </button>

        {sessionUser ? (
          <div className="profile-menu">
            <button
              aria-haspopup="menu"
              className="user-chip profile-trigger"
              title={sessionUser.name}
              type="button"
            >
              {sessionUser.picture ? (
                <img
                  alt={`${sessionUser.name} profile`}
                  className="profile-avatar"
                  height={MECO_PROFILE_AVATAR_SIZE}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  src={sessionUser.picture}
                  width={MECO_PROFILE_AVATAR_SIZE}
                />
              ) : (
                <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                  {sessionUser.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
            <div aria-label="Profile menu" className="profile-menu-popover" role="menu">
              <label className="profile-menu-context-picker">
                <span className="profile-menu-context-label">Season</span>
                <select
                  className="profile-menu-context-select"
                  data-tutorial-target="season-select"
                  onChange={handleSeasonChange}
                  value={selectedSeasonId ?? ""}
                >
                  {seasons.length === 0 ? (
                    <option value="">No seasons</option>
                  ) : (
                    seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))
                  )}
                  <option value={CREATE_SEASON_OPTION_VALUE}>Create new season</option>
                </select>
              </label>
              <button
                className="profile-menu-item profile-menu-item-theme-toggle"
                onClick={toggleDarkMode}
                role="menuitem"
                title={themeToggleMenuTitle}
                type="button"
              >
                <span aria-hidden="true" className="profile-menu-item-icon">
                  {isDarkMode ? "\u2600" : "\u263E"}
                </span>
                <span className="profile-menu-item-theme-label">{themeToggleMenuLabel}</span>
              </button>
              <button
                className="profile-menu-item"
                onClick={handleSignOut}
                role="menuitem"
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="user-chip app-topbar-user-chip">
            <strong>Local access</strong>
          </div>
        )}

        {!sessionUser ? (
          <button
            aria-label="Toggle dark mode"
            className="app-topbar-icon-button"
            onClick={toggleDarkMode}
            title="Toggle dark mode"
            type="button"
          >
            <span aria-hidden="true">{isDarkMode ? "\u2600" : "\u263E"}</span>
          </button>
        ) : null}

        <button
          aria-label="Refresh workspace"
          className={
            isLoadingData
              ? "icon-button refresh-button app-topbar-icon-button is-loading"
              : "icon-button refresh-button app-topbar-icon-button"
          }
          onClick={() => void loadWorkspace()}
          title="Refresh workspace"
          type="button"
        >
          <IconRefresh />
        </button>
      </div>
    </header>
  );
}
