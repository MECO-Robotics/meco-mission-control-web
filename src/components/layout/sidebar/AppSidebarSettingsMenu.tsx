import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { LogIn, LogOut, RefreshCw, Settings as SettingsIcon } from "lucide-react";

interface AppSidebarSettingsMenuProps {
  canSignIn: boolean;
  canSignOut: boolean;
  isCollapsed: boolean;
  isDarkMode: boolean;
  onRefreshWorkspace: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDarkMode: () => void;
}

export function AppSidebarSettingsMenu({
  canSignIn,
  canSignOut,
  isCollapsed,
  isDarkMode,
  onRefreshWorkspace,
  onSignIn,
  onSignOut,
  onToggleDarkMode,
}: AppSidebarSettingsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hoverOpenedSettingsRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themeLabel = isDarkMode ? "Dark" : "Light";
  const themeTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  useEffect(() => {
    if (!isMenuOpen || !hoverOpenedSettingsRef.current) {
      return;
    }

    const sidebar = menuRef.current?.closest(".sidebar");
    if (!sidebar) {
      return;
    }

    const closeHoverMenu = () => {
      if (!hoverOpenedSettingsRef.current) {
        return;
      }

      hoverOpenedSettingsRef.current = false;
      setIsMenuOpen(false);
    };

    sidebar.addEventListener("mouseleave", closeHoverMenu);
    return () => {
      sidebar.removeEventListener("mouseleave", closeHoverMenu);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      hoverOpenedSettingsRef.current = false;
      setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePointer);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    hoverOpenedSettingsRef.current = false;
    setIsMenuOpen(false);
  };
  const handleSettingsHover = () => {
    if (isMenuOpen) {
      return;
    }

    hoverOpenedSettingsRef.current = true;
    setIsMenuOpen(true);
  };
  const handleSettingsClick = () => {
    if (hoverOpenedSettingsRef.current) {
      hoverOpenedSettingsRef.current = false;
      setIsMenuOpen(true);
      return;
    }

    setIsMenuOpen((current) => !current);
  };
  const handleSettingsKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    event.currentTarget.blur();
    closeMenu();
  };
  const handleThemeClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onToggleDarkMode();
    event.currentTarget.blur();
    closeMenu();
  };
  const handleRefreshWorkspaceClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onRefreshWorkspace();
    event.currentTarget.blur();
    closeMenu();
  };
  const handleSignOutClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onSignOut();
    event.currentTarget.blur();
    closeMenu();
  };
  const handleSignInClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onSignIn();
    event.currentTarget.blur();
    closeMenu();
  };

  return (
    <div
      className={`sidebar-settings-menu${isCollapsed ? " sidebar-settings-menu-collapsed" : ""}`}
      data-open={isMenuOpen ? "true" : "false"}
      onMouseEnter={handleSettingsHover}
      ref={menuRef}
    >
      <button
        aria-expanded={isMenuOpen ? "true" : "false"}
        aria-haspopup="menu"
        aria-label="Settings"
        className={`sidebar-quick-action sidebar-settings-summary sidebar-footer-action-settings${isCollapsed ? " sidebar-settings-collapsed-trigger" : ""}`}
        data-active={isMenuOpen ? "true" : "false"}
        onClick={handleSettingsClick}
        onKeyDown={handleSettingsKeyDown}
        title="Settings"
        type="button"
      >
        <SettingsIcon aria-hidden="true" size={14} strokeWidth={2} />
      </button>
      <div aria-label="Settings menu" className="sidebar-settings-popover" role="menu">
        <button
          className="sidebar-settings-menu-item"
          onClick={handleThemeClick}
          role="menuitem"
          title={themeTitle}
          type="button"
        >
          <span className="sidebar-settings-menu-copy">
            <span className="sidebar-settings-menu-title">Theme mode</span>
            <span className="sidebar-settings-menu-value">{themeLabel}</span>
          </span>
          <span
            aria-hidden="true"
            className={`profile-mode-selector ${isDarkMode ? "is-dark" : "is-light"}`}
          >
            <span className="profile-mode-selector-track">
              <span className="profile-mode-selector-thumb">
                <span className="profile-mode-selector-icon">{isDarkMode ? "\u263E" : "\u2600"}</span>
              </span>
            </span>
          </span>
        </button>
        <button
          className="sidebar-settings-menu-item"
          onClick={handleRefreshWorkspaceClick}
          role="menuitem"
          type="button"
        >
          <span className="sidebar-settings-menu-copy">
            <span className="sidebar-settings-menu-title">Refresh workspace</span>
            <span className="sidebar-settings-menu-value">Reload data</span>
          </span>
          <span aria-hidden="true" className="sidebar-settings-menu-icon">
            <RefreshCw size={14} strokeWidth={2} />
          </span>
        </button>
        {canSignOut ? (
          <button
            className="sidebar-settings-menu-item sidebar-settings-sign-out-item"
            onClick={handleSignOutClick}
            role="menuitem"
            type="button"
          >
            <span className="sidebar-settings-menu-copy">
              <span className="sidebar-settings-menu-title">Sign out</span>
              <span className="sidebar-settings-menu-value">Account</span>
            </span>
            <span aria-hidden="true" className="sidebar-settings-menu-icon">
              <LogOut size={14} strokeWidth={2} />
            </span>
          </button>
        ) : canSignIn ? (
          <button
            className="sidebar-settings-menu-item"
            onClick={handleSignInClick}
            role="menuitem"
            type="button"
          >
            <span className="sidebar-settings-menu-copy">
              <span className="sidebar-settings-menu-title">Sign in</span>
              <span className="sidebar-settings-menu-value">Account</span>
            </span>
            <span aria-hidden="true" className="sidebar-settings-menu-icon">
              <LogIn size={14} strokeWidth={2} />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
