import { Users } from "lucide-react";

import { MECO_PROFILE_AVATAR_SIZE } from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";

const LOCAL_DEV_PROFILE_INITIAL = "L";

function getProfileFallbackInitial(sessionUser: SessionUser) {
  if (sessionUser.accountId === "local-dev") {
    return LOCAL_DEV_PROFILE_INITIAL;
  }

  const name = sessionUser.name.trim();
  const email = sessionUser.email.trim();

  return (name || email || LOCAL_DEV_PROFILE_INITIAL).slice(0, 1).toUpperCase();
}

function ProfileAvatar({ sessionUser }: { sessionUser: SessionUser }) {
  if (sessionUser.picture) {
    return (
      <img
        alt={`${sessionUser.name} profile`}
        className="profile-avatar"
        height={MECO_PROFILE_AVATAR_SIZE}
        loading="eager"
        referrerPolicy="no-referrer"
        src={sessionUser.picture}
        width={MECO_PROFILE_AVATAR_SIZE}
      />
    );
  }

  return (
    <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
      {getProfileFallbackInitial(sessionUser)}
    </span>
  );
}

function ThemeModeMenuItem({
  isDarkMode,
  toggleDarkMode,
}: {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const themeToggleMenuTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      className="profile-menu-item profile-menu-item-theme-toggle"
      onClick={toggleDarkMode}
      role="menuitem"
      title={themeToggleMenuTitle}
      type="button"
    >
      <span className="profile-menu-item-theme-copy">
        <span className="profile-menu-item-theme-title">Theme mode</span>
        <span className="profile-menu-item-theme-value">{isDarkMode ? "Dark" : "Light"}</span>
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
  );
}

function SignedInProfileAssembly({
  handleSignOut,
  isDarkMode,
  isMyViewActive,
  myViewMemberName,
  onToggleMyView,
  sessionUser,
  toggleDarkMode,
}: AppProfileAssemblyProps & { sessionUser: SessionUser }) {
  const myViewTitle = myViewMemberName
    ? isMyViewActive
      ? `Showing ${myViewMemberName}`
      : `Filter workspace to ${myViewMemberName}`
    : "No roster member matches the signed-in user";
  const isMyViewAvailable = myViewMemberName !== null;

  const handleMyViewClick = () => {
    if (!isMyViewAvailable) {
      return;
    }

    onToggleMyView();
  };
  const handleAllMembersClick = () => {
    if (isMyViewActive) {
      onToggleMyView();
    }
  };

  return (
    <div className="profile-menu">
      <div aria-label="My View filter" className="profile-view-toggle" role="group">
        <button
          aria-label={isMyViewActive ? "Show all workspace members" : "All workspace members"}
          aria-pressed={!isMyViewActive}
          className={
            isMyViewActive
              ? "profile-view-toggle-option profile-view-group-button"
              : "profile-view-toggle-option profile-view-group-button is-active"
          }
          onClick={handleAllMembersClick}
          title={isMyViewActive ? "Show all workspace members" : "Showing all workspace members"}
          type="button"
        >
          <span className="profile-avatar profile-view-group-icon" aria-hidden="true">
            <Users size={17} strokeWidth={2} />
          </span>
        </button>
        <button
          aria-label={isMyViewActive ? "Clear My View filter" : "Show My View filter"}
          aria-disabled={!isMyViewAvailable}
          aria-pressed={isMyViewActive}
          className={
            isMyViewActive
              ? "profile-view-toggle-option profile-view-avatar-button is-active"
              : "profile-view-toggle-option profile-view-avatar-button"
          }
          onClick={handleMyViewClick}
          title={myViewTitle}
          type="button"
        >
          <ProfileAvatar sessionUser={sessionUser} />
        </button>
      </div>
      <div aria-label="Profile menu" className="profile-menu-popover" role="menu">
        <ThemeModeMenuItem isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <button className="profile-menu-item" onClick={handleSignOut} role="menuitem" type="button">
          Sign out
        </button>
      </div>
    </div>
  );
}

function LocalProfileAssembly({
  isDarkMode,
  toggleDarkMode,
}: {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  return (
    <div className="profile-menu">
      <span
        aria-label="Local dev profile"
        className="user-chip profile-trigger app-profile-my-view-button"
        role="img"
      >
        <span className="profile-avatar profile-avatar-fallback app-topbar-local-avatar">
          {LOCAL_DEV_PROFILE_INITIAL}
        </span>
      </span>
      <div aria-label="Local profile menu" className="profile-menu-popover" role="menu">
        <ThemeModeMenuItem isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </div>
    </div>
  );
}

export interface AppProfileAssemblyProps {
  handleSignOut: () => void;
  isDarkMode: boolean;
  isMyViewActive: boolean;
  myViewMemberName: string | null;
  onToggleMyView: () => void;
  sessionUser: SessionUser | null;
  toggleDarkMode: () => void;
}

export function AppProfileAssembly(props: AppProfileAssemblyProps) {
  if (props.sessionUser) {
    return <SignedInProfileAssembly {...props} sessionUser={props.sessionUser} />;
  }

  return <LocalProfileAssembly isDarkMode={props.isDarkMode} toggleDarkMode={props.toggleDarkMode} />;
}
