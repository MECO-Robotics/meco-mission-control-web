import { type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { CalendarDays, ChevronRight, LayoutGrid } from "lucide-react";

import { IconHelp } from "@/components/shared/Icons";
import { AppSidebarNotificationButton } from "./sidebar/AppSidebarNotificationButton";
import { AppSidebarSettingsMenu } from "./sidebar/AppSidebarSettingsMenu";

interface AppSidebarProjectFooterProps {
  activeTab: import("@/lib/workspaceNavigation").ViewTab;
  canSignIn: boolean;
  canSignOut: boolean;
  isDarkMode: boolean;
  isCollapsed: boolean;
  isNotificationQueueOpen: boolean;
  isProjectPopupOpen: boolean;
  onHelpSelect: () => void;
  onNotificationQueueToggle: () => void;
  onRefreshWorkspace: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDarkMode: () => void;
  notificationCount: number;
  onProjectTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  projectTriggerRef: RefObject<HTMLButtonElement | null>;
  selectedScopeLabel: string;
  localMode: "demo" | "tutorial" | null;
  onResetDemo: () => void;
}

export function AppSidebarProjectFooter({
  activeTab,
  canSignIn,
  canSignOut,
  isDarkMode,
  isCollapsed,
  isNotificationQueueOpen,
  isProjectPopupOpen,
  onHelpSelect,
  onNotificationQueueToggle,
  onRefreshWorkspace,
  onSignIn,
  onSignOut,
  onToggleDarkMode,
  notificationCount,
  onProjectTriggerClick,
  projectTriggerRef,
  selectedScopeLabel,
  localMode,
  onResetDemo,
}: AppSidebarProjectFooterProps) {
  const settingsMenu = (
    <AppSidebarSettingsMenu
      canSignIn={canSignIn}
      canSignOut={canSignOut}
      isCollapsed={isCollapsed}
      isDarkMode={isDarkMode}
      onRefreshWorkspace={onRefreshWorkspace}
      onSignIn={onSignIn}
      onSignOut={onSignOut}
      onToggleDarkMode={onToggleDarkMode}
    />
  );
  const scopeTrigger = (
    <button
      aria-expanded={isProjectPopupOpen ? "true" : "false"}
      aria-label="Open project and season selector"
      className="sidebar-scope-trigger"
      data-active={isProjectPopupOpen ? "true" : "false"}
      onClick={onProjectTriggerClick}
      ref={projectTriggerRef}
      title={`Project / Season: ${selectedScopeLabel}`}
      type="button"
    >
      <span aria-hidden="true" className="sidebar-scope-trigger-icons">
        <CalendarDays size={13} strokeWidth={2} />
        <LayoutGrid size={13} strokeWidth={2} />
      </span>
      {!isCollapsed ? (
        <span className="sidebar-scope-trigger-copy">
          <span className="sidebar-scope-trigger-line" data-tutorial-target="project-select">
            {selectedScopeLabel}
          </span>
        </span>
      ) : null}
      {!isCollapsed ? (
        <span aria-hidden="true" className="sidebar-scope-trigger-caret">
          <ChevronRight size={14} strokeWidth={2} />
        </span>
      ) : null}
    </button>
  );
  const notificationMenu = (
    <AppSidebarNotificationButton
      isOpen={isNotificationQueueOpen}
      notificationCount={notificationCount}
      onToggle={onNotificationQueueToggle}
    />
  );
  const bottomTriplet = (
    <div className="sidebar-footer-actions" data-collapsed={isCollapsed ? "true" : "false"}>
      {settingsMenu}
      <button
        aria-label="Help"
        className={`sidebar-quick-action sidebar-footer-action-help${isCollapsed ? " sidebar-help-collapsed-trigger" : ""}`}
        data-active={activeTab === "help" ? "true" : "false"}
        onClick={onHelpSelect}
        title="Help"
        type="button"
      >
        <IconHelp />
      </button>
      {notificationMenu}
    </div>
  );

  return !isCollapsed ? (
    <div className="sidebar-footer-stack">
      {localMode ? <div className="sidebar-local-workspace-status" title="Changes stay in this browser tab and are never synced.">
        <span>{localMode === "tutorial" ? "Local tutorial" : "Local demo"} · no sync</span>
        {localMode === "demo" ? <button type="button" className="secondary-action" onClick={onResetDemo}>Reset demo</button> : null}
      </div> : null}
      {scopeTrigger}
      {bottomTriplet}
    </div>
  ) : (
    <div className="sidebar-footer-stack sidebar-footer-stack-collapsed">
      {localMode ? <span className="sidebar-local-workspace-mark" title={localMode === "tutorial" ? "Local tutorial · no sync" : "Local demo · no sync"}>●</span> : null}
      {scopeTrigger}
      {bottomTriplet}
    </div>
  );
}
