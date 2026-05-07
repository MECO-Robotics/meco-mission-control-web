import {
  MECO_LOGIN_BACKDROP_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";
import type { SeasonRecord } from "@/types/recordsOrganization";
import { Search } from "lucide-react";

import { AppTopbarRightRail } from "./AppTopbarRightRail";

interface AppTopbarProps {
  activeViewLabel: string;
  handleSignOut: () => void;
  isLoadingData: boolean;
  isDarkMode: boolean;
  isMyViewActive: boolean;
  isSidebarCollapsed: boolean;
  loadWorkspace: () => Promise<void>;
  myViewMemberName: string | null;
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  onToggleMyView: () => void;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
  sessionUser: SessionUser | null;
  toggleDarkMode: () => void;
}

export function AppTopbar({
  activeViewLabel,
  handleSignOut,
  isLoadingData,
  isDarkMode,
  isMyViewActive,
  isSidebarCollapsed,
  loadWorkspace,
  myViewMemberName,
  onCreateSeason,
  onSelectSeason,
  onToggleMyView,
  seasons,
  selectedSeasonId,
  sessionUser,
  toggleDarkMode,
}: AppTopbarProps) {
  const topbarLogoSrc = isSidebarCollapsed
    ? MECO_LOGIN_BACKDROP_SRC
    : isDarkMode
      ? MECO_MAIN_LOGO_WHITE_SRC
      : MECO_MAIN_LOGO_LIGHT_SRC;

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
          src={topbarLogoSrc}
        />
      </div>
      <div className="app-topbar-left">
        <div className="app-topbar-view-title">
          <h1>{activeViewLabel}</h1>
        </div>
      </div>
      <div className="app-topbar-search-slot">
        <label className="app-topbar-search" htmlFor="workspace-topbar-search">
          <span aria-hidden="true" className="app-topbar-search-icon">
            <Search size={14} strokeWidth={2} />
          </span>
          <input
            className="app-topbar-search-input"
            id="workspace-topbar-search"
            placeholder="Search..."
            type="search"
          />
        </label>
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
