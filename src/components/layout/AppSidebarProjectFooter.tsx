import { type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { CalendarDays, ChevronRight, LayoutGrid } from "lucide-react";

import { IconHelp } from "@/components/shared/Icons";
import type { SessionUser } from "@/lib/auth/types";

import { AppProfileAssembly } from "./AppProfileAssembly";
import { AppSidebarNotificationButton } from "./sidebar/AppSidebarNotificationButton";
import { AppSidebarSettingsMenu } from "./sidebar/AppSidebarSettingsMenu";

interface AppSidebarProjectFooterProps {
  activeTab: import("@/lib/workspaceNavigation").ViewTab;
  canSignIn: boolean;
  canSignOut: boolean;
  isDarkMode: boolean;
  isCollapsed: boolean;
  isMyViewActive: boolean;
  isNotificationQueueOpen: boolean;
  isProjectPopupOpen: boolean;
  myViewMemberName: string | null;
  onHelpSelect: () => void;
  onNotificationQueueToggle: () => void;
  onRefreshWorkspace: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleMyView: () => void;
  onToggleDarkMode: () => void;
  notificationCount: number;
  onProjectTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  projectTriggerRef: RefObject<HTMLButtonElement | null>;
  selectedScopeLabel: string;
  sessionUser: SessionUser | null;
}

export function AppSidebarProjectFooter({
  activeTab,
  canSignIn,
  canSignOut,
  isDarkMode,
  isCollapsed,
  isMyViewActive,
  isNotificationQueueOpen,
  isProjectPopupOpen,
  myViewMemberName,
  onHelpSelect,
  onNotificationQueueToggle,
  onRefreshWorkspace,
  onSignIn,
  onSignOut,
  onToggleMyView,
  onToggleDarkMode,
  notificationCount,
  onProjectTriggerClick,
  projectTriggerRef,
  selectedScopeLabel,
  sessionUser,
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
  const profileToggle = (
    <div className="sidebar-footer-profile" data-collapsed={isCollapsed ? "true" : "false"}>
      <AppProfileAssembly
        isMyViewActive={isMyViewActive}
        myViewMemberName={myViewMemberName}
        onToggleMyView={onToggleMyView}
        sessionUser={sessionUser}
      />
    </div>
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
      {profileToggle}
      {scopeTrigger}
      {bottomTriplet}
    </div>
  ) : (
    <div className="sidebar-footer-stack sidebar-footer-stack-collapsed">
      {profileToggle}
      {scopeTrigger}
      {bottomTriplet}
    </div>
  );
}
