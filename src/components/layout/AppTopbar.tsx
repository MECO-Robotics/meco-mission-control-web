import {
  MECO_COMPACT_TEAM_LOGO_SIZE,
  MECO_COMPACT_TEAM_LOGO_SRC,
  MECO_COMPACT_TEAM_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";
import { Search, Star, StarOff } from "lucide-react";

import { APP_TOPBAR_SLOT_IDS } from "./AppTopbarSlotPortal";

interface AppTopbarProps {
  activeViewLabel: string;
  isActiveViewFavorite: boolean;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  onToggleActiveViewFavorite: (() => void) | null;
}

export function AppTopbar({
  activeViewLabel,
  isActiveViewFavorite,
  isDarkMode,
  isSidebarCollapsed,
  onToggleActiveViewFavorite,
}: AppTopbarProps) {
  const canToggleFavorite = Boolean(onToggleActiveViewFavorite);
  const topbarLogo = isSidebarCollapsed
    ? {
        alt: "MECO compact team logo",
        height: MECO_COMPACT_TEAM_LOGO_SIZE,
        src: isDarkMode ? MECO_COMPACT_TEAM_LOGO_WHITE_SRC : MECO_COMPACT_TEAM_LOGO_SRC,
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
  const favoriteLabel = canToggleFavorite
    ? isActiveViewFavorite
      ? `Remove ${activeViewLabel} from favorites`
      : `Add ${activeViewLabel} to favorites`
    : `${activeViewLabel} cannot be favorited`;
  const FavoriteIcon = canToggleFavorite ? Star : StarOff;

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
          <button
            aria-label={favoriteLabel}
            aria-pressed={isActiveViewFavorite}
            className="app-topbar-favorite-button"
            data-active={isActiveViewFavorite ? "true" : "false"}
            data-enabled={canToggleFavorite ? "true" : "false"}
            disabled={!canToggleFavorite}
            onClick={onToggleActiveViewFavorite ?? undefined}
            title={favoriteLabel}
            type="button"
          >
            <FavoriteIcon
              aria-hidden="true"
              fill={isActiveViewFavorite ? "currentColor" : "none"}
              size={15}
              strokeWidth={2}
            />
          </button>
          <h1>{activeViewLabel}</h1>
        </div>
      </div>
      <div className="app-topbar-search-slot">
        <div className="app-topbar-controls-host" id={APP_TOPBAR_SLOT_IDS.controls} />
        <div className="app-topbar-search-host" id={APP_TOPBAR_SLOT_IDS.search} />
        <label
          className="app-topbar-search toolbar-filter toolbar-filter-compact toolbar-search"
          htmlFor="workspace-topbar-search"
        >
          <span aria-hidden="true" className="toolbar-filter-icon app-topbar-search-icon">
            <Search size={14} strokeWidth={2} />
          </span>
          <input
            aria-label="Search workspace"
            className="toolbar-search-input app-topbar-search-input"
            id="workspace-topbar-search"
            placeholder="Search..."
            type="text"
          />
        </label>
      </div>
    </header>
  );
}
