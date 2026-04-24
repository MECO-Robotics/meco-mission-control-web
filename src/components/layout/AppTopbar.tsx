import { type Dispatch, type SetStateAction } from "react";

import {
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
  MECO_PROFILE_AVATAR_SIZE,
} from "../../lib/branding";
import type { SessionUser } from "../../lib/auth";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  TaskViewTab,
  ViewTab,
} from "../../features/workspace/shared/workspaceTypes";
import { IconRefresh } from "../shared/Icons";

const TASK_VIEW_OPTIONS: { value: TaskViewTab; label: string }[] = [
  { value: "timeline", label: "Timeline" },
  { value: "queue", label: "Queue" },
];

const MANUFACTURING_VIEW_OPTIONS: { value: ManufacturingViewTab; label: string }[] = [
  { value: "cnc", label: "CNC" },
  { value: "prints", label: "3D print" },
  { value: "fabrication", label: "Fabrication" },
];

const INVENTORY_VIEW_OPTIONS: { value: InventoryViewTab; label: string }[] = [
  { value: "materials", label: "Materials" },
  { value: "parts", label: "Parts" },
  { value: "purchases", label: "Purchases" },
];

const SECTION_LABELS: Record<ViewTab, string> = {
  tasks: "Tasks",
  worklogs: "Worklogs",
  manufacturing: "Manufacturing",
  inventory: "Inventory",
  subsystems: "Subsystems",
  roster: "Roster",
};

function TopbarTabs<T extends string>({
  activeValue,
  ariaLabel,
  onChange,
  options,
}: {
  activeValue: T;
  ariaLabel: string;
  onChange: Dispatch<SetStateAction<T>>;
  options: { label: string; value: T }[];
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
  manufacturingView,
  setInventoryView,
  setManufacturingView,
  setTaskView,
  taskView,
}: {
  activeTab: ViewTab;
  inventoryView: InventoryViewTab;
  manufacturingView: ManufacturingViewTab;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  taskView: TaskViewTab;
}) {
  switch (activeTab) {
    case "tasks":
      return (
        <>
          <span className="app-topbar-page-label">{SECTION_LABELS.tasks}</span>
          <TopbarTabs
            activeValue={taskView}
            ariaLabel="Task views"
            onChange={setTaskView}
            options={TASK_VIEW_OPTIONS}
          />
        </>
      );
    case "manufacturing":
      return (
        <>
          <span className="app-topbar-page-label">{SECTION_LABELS.manufacturing}</span>
          <TopbarTabs
            activeValue={manufacturingView}
            ariaLabel="Manufacturing views"
            onChange={setManufacturingView}
            options={MANUFACTURING_VIEW_OPTIONS}
          />
        </>
      );
    case "inventory":
      return (
        <>
          <span className="app-topbar-page-label">{SECTION_LABELS.inventory}</span>
          <TopbarTabs
            activeValue={inventoryView}
            ariaLabel="Inventory views"
            onChange={setInventoryView}
            options={INVENTORY_VIEW_OPTIONS}
          />
        </>
      );
    default:
      return <span className="app-topbar-page-label">{SECTION_LABELS[activeTab]}</span>;
  }
}

interface AppTopbarProps {
  activeTab: ViewTab;
  handleSignOut: () => void;
  inventoryView: InventoryViewTab;
  isLoadingData: boolean;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  loadWorkspace: () => Promise<void>;
  manufacturingView: ManufacturingViewTab;
  sessionUser: SessionUser | null;
  setInventoryView: Dispatch<SetStateAction<InventoryViewTab>>;
  setManufacturingView: Dispatch<SetStateAction<ManufacturingViewTab>>;
  setTaskView: Dispatch<SetStateAction<TaskViewTab>>;
  taskView: TaskViewTab;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

export function AppTopbar({
  activeTab,
  handleSignOut,
  inventoryView,
  isLoadingData,
  isDarkMode,
  isSidebarCollapsed,
  loadWorkspace,
  manufacturingView,
  sessionUser,
  setInventoryView,
  setManufacturingView,
  setTaskView,
  taskView,
  toggleDarkMode,
  toggleSidebar,
}: AppTopbarProps) {
  return (
    <header
      className="topbar app-topbar"
      data-collapsed={isSidebarCollapsed ? "true" : "false"}
    >
      <div className="app-topbar-left">
        <button
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="app-topbar-toggle"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          type="button"
        >
          <span aria-hidden="true">{"\u2630"}</span>
        </button>
        {!isSidebarCollapsed ? (
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
        ) : null}
      </div>

      <div className="app-topbar-nav">
        <TopbarNavigation
          activeTab={activeTab}
          inventoryView={inventoryView}
          manufacturingView={manufacturingView}
          setInventoryView={setInventoryView}
          setManufacturingView={setManufacturingView}
          setTaskView={setTaskView}
          taskView={taskView}
        />
      </div>

      <div className="topbar-right app-topbar-right">
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

        <button
          aria-label="Toggle dark mode"
          className="app-topbar-icon-button"
          onClick={toggleDarkMode}
          title="Toggle dark mode"
          type="button"
        >
          <span aria-hidden="true">{isDarkMode ? "\u2600" : "\u263E"}</span>
        </button>

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
