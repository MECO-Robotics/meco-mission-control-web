import { type ChangeEvent } from "react";

import { MECO_PROFILE_AVATAR_SIZE } from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";
import type { SeasonRecord } from "@/types/recordsOrganization";
import { AppTopbarMyViewToggle, AppTopbarRefreshButton } from "./AppTopbarRightRailControls";

const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

function AppTopbarProfileMenu({
  handleSignOut,
  isDarkMode,
  onCreateSeason,
  onSelectSeason,
  seasons,
  selectedSeasonId,
  sessionUser,
  toggleDarkMode,
}: {
  handleSignOut: () => void;
  isDarkMode: boolean;
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
  sessionUser: SessionUser;
  toggleDarkMode: () => void;
}) {
  const themeToggleMenuTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  const handleSeasonChange = (milestone: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = milestone.target.value;
    if (nextValue === CREATE_SEASON_OPTION_VALUE) {
      milestone.target.value = selectedSeasonId ?? "";
      onCreateSeason();
      return;
    }

    onSelectSeason(nextValue || null);
  };

  return (
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
          <span className="profile-menu-item-theme-copy">
            <span className="profile-menu-item-theme-title">Theme mode</span>
            <span className="profile-menu-item-theme-value">
              {isDarkMode ? "Dark" : "Light"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`profile-mode-selector ${isDarkMode ? "is-dark" : "is-light"}`}
          >
            <span className="profile-mode-selector-track">
              <span className="profile-mode-selector-thumb">
                <span className="profile-mode-selector-icon">
                  {isDarkMode ? "\u263E" : "\u2600"}
                </span>
              </span>
            </span>
          </span>
        </button>
        <button className="profile-menu-item" onClick={handleSignOut} role="menuitem" type="button">
          Sign out
        </button>
      </div>
    </div>
  );
}

function AppTopbarGuestControls({
  isDarkMode,
  toggleDarkMode,
}: {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  return (
    <>
      <div className="user-chip app-topbar-user-chip">
        <strong>Local access</strong>
      </div>
      <button
        aria-label="Toggle dark mode"
        className="app-topbar-icon-button"
        onClick={toggleDarkMode}
        title="Toggle dark mode"
        type="button"
      >
        <span aria-hidden="true">{isDarkMode ? "\u2600" : "\u263E"}</span>
      </button>
    </>
  );
}

interface AppTopbarRightRailProps {
  handleSignOut: () => void;
  isDarkMode: boolean;
  isLoadingData: boolean;
  isMyViewActive: boolean;
  loadWorkspace: () => Promise<void>;
  myViewMemberName: string | null;
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  selectedSeasonId: string | null;
  seasons: SeasonRecord[];
  sessionUser: SessionUser | null;
  toggleDarkMode: () => void;
}

export function AppTopbarRightRail({
  handleSignOut,
  isDarkMode,
  isLoadingData,
  isMyViewActive,
  loadWorkspace,
  myViewMemberName,
  onCreateSeason,
  onSelectSeason,
  onToggleMyView,
  selectedSeasonId,
  seasons,
  sessionUser,
  toggleDarkMode,
}: AppTopbarRightRailProps) {
  return (
    <div className="topbar-right app-topbar-right">
      <AppTopbarMyViewToggle
        isActive={isMyViewActive}
        memberName={myViewMemberName}
        onToggle={onToggleMyView}
      />

      {sessionUser ? (
        <AppTopbarProfileMenu
          handleSignOut={handleSignOut}
          isDarkMode={isDarkMode}
          onCreateSeason={onCreateSeason}
          onSelectSeason={onSelectSeason}
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          sessionUser={sessionUser}
          toggleDarkMode={toggleDarkMode}
        />
      ) : (
        <AppTopbarGuestControls isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      )}

      <AppTopbarRefreshButton isLoadingData={isLoadingData} loadWorkspace={loadWorkspace} />
    </div>
  );
}
