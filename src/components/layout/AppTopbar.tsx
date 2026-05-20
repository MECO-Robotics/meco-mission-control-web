import {
  MECO_COMPACT_TEAM_LOGO_SIZE,
  MECO_COMPACT_TEAM_LOGO_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/types";
import type { SeasonRecord } from "@/types/recordsOrganization";
import { Search } from "lucide-react";

import { AppTopbarRightRail } from "./AppTopbarRightRail";
import { APP_TOPBAR_SLOT_IDS } from "./AppTopbarSlotPortal";

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
  const topbarLogo = isSidebarCollapsed
    ? {
        alt: "MECO compact team logo",
        height: MECO_COMPACT_TEAM_LOGO_SIZE,
        src: MECO_COMPACT_TEAM_LOGO_SRC,
        variant: "compact",
        width: MECO_COMPACT_TEAM_LOGO_SIZE,
      }
    : {
        alt: "MECO main logo",
        height: MECO_MAIN_LOGO_HEIGHT,
        src: isDarkMode ? MECO_MAIN_LOGO_WHITE_SRC : MECO_MAIN_LOGO_LIGHT_SRC,
        variant: "full",
        width: MECO_MAIN_LOGO_WIDTH,
      };

  return (
    <header className="topbar app-topbar" data-collapsed={isSidebarCollapsed ? "true" : "false"}>
      <div className="app-topbar-brand">
        <img
          alt={topbarLogo.alt}
          className="app-topbar-brand-icon"
          data-logo-variant={topbarLogo.variant}
          fetchPriority="high"
          height={topbarLogo.height}
          loading="eager"
          width={topbarLogo.width}
          src={topbarLogo.src}
        />
      </div>
      <div className="app-topbar-left">
        <div className="app-topbar-view-title">
          <h1>{activeViewLabel}</h1>
        </div>
      </div>
      <div className="app-topbar-search-slot">
        <div className="app-topbar-controls-host" id={APP_TOPBAR_SLOT_IDS.controls} />
        <div className="app-topbar-search-host" id={APP_TOPBAR_SLOT_IDS.search} />
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
