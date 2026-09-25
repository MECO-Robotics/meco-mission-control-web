import { CalendarDays, ChevronRight, LayoutGrid } from "lucide-react";

import { IconHelp } from "@/components/shared/Icons";
import { AppSidebarNotificationButton } from "./sidebar/AppSidebarNotificationButton";
import { AppSidebarSettingsMenu } from "./sidebar/AppSidebarSettingsMenu";
import { useSidebarContext } from "./sidebar/context/SidebarContext";

export function AppSidebarProjectFooter() {
  const {
    activeTab,
    canSignIn,
    sessionUser,
    isDarkMode,
    isCollapsed,
    isNotificationQueueOpen,
    popup,
    onHelpSelect,
    onToggleNotificationQueue,
    onRefreshWorkspace,
    onSignIn,
    handleSignOut,
    toggleDarkMode,
    notificationCount,
    onProjectTriggerClick,
    projectTriggerRef,
    selectedScopeLabel,
    localMode,
    onResetDemo,
  } = useSidebarContext();
  const canSignOut = sessionUser !== null;
  const isProjectPopupOpen = popup.isOpen;

  const settingsMenu = (
    <AppSidebarSettingsMenu
      canSignIn={canSignIn}
      canSignOut={canSignOut}
      isCollapsed={isCollapsed}
      isDarkMode={isDarkMode}
      onRefreshWorkspace={onRefreshWorkspace}
      onSignIn={onSignIn}
      onSignOut={handleSignOut}
      onToggleDarkMode={toggleDarkMode}
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
      onToggle={onToggleNotificationQueue}
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
