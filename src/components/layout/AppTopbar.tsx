import {
  MECO_COMPACT_TEAM_LOGO_HEIGHT,
  MECO_COMPACT_TEAM_LOGO_SRC,
  MECO_COMPACT_TEAM_LOGO_WIDTH,
  MECO_COMPACT_TEAM_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";

import { APP_TOPBAR_SLOT_IDS } from "./AppTopbarSlotPortal";

interface AppTopbarProps {
  activeViewLabel: string;
  projectScopeLabel?: string;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
}

export function AppTopbar({
  activeViewLabel,
  isDarkMode,
  isSidebarCollapsed,
}: AppTopbarProps) {
  const topbarLogo = isSidebarCollapsed
    ? {
        alt: "MECO compact team logo",
        height: MECO_COMPACT_TEAM_LOGO_HEIGHT,
        src: isDarkMode ? MECO_COMPACT_TEAM_LOGO_WHITE_SRC : MECO_COMPACT_TEAM_LOGO_SRC,
        variant: "compact",
        width: MECO_COMPACT_TEAM_LOGO_WIDTH,
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

      </div>
    </header>
  );
}
