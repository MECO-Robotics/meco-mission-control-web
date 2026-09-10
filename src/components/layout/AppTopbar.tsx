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
import { Star, StarOff } from "lucide-react";

import type { NavigationSubItemId, NavigationTarget } from "@/lib/workspaceNavigation";
import { APP_TOPBAR_SLOT_IDS } from "./AppTopbarSlotPortal";

interface AppTopbarProps {
  activeViewId?: NavigationSubItemId | null;
  views?: readonly { id: NavigationSubItemId; label: string; target: NavigationTarget }[];
  favorites?: readonly { id: NavigationSubItemId; label: string; target: NavigationTarget }[];
  onNavigate?: (target: NavigationTarget) => void;
  localMode?: "demo" | "tutorial" | null;
  onResetDemo?: () => void;
  activeViewLabel: string;
  isActiveViewFavorite: boolean;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  onToggleActiveViewFavorite: (() => void) | null;
}

export function AppTopbar({
  activeViewId, views = [], favorites = [], onNavigate,
  localMode,
  onResetDemo,
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
          {views.length > 1 || favorites.length > 0 ? (
            <><h1 className="navigation-heading">{activeViewLabel}</h1><select data-active-view={activeViewId ?? ""} aria-label="View" className="workspace-view-selector" value={activeViewId ?? ""}
              onChange={(event) => {
                const view = [...views, ...favorites].find((item) => item.id === event.target.value);
                if (view) onNavigate?.(view.target);
              }}>
              {views.map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}
              {favorites.some((item) => !views.some((view) => view.id === item.id)) ? (
                <optgroup label="Favorites">{favorites.filter((item) => !views.some((view) => view.id === item.id)).map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}</optgroup>
              ) : null}
            </select></>
          ) : <h1>{activeViewLabel}</h1>}
          {localMode ? (
            <div className="local-workspace-status">
              <span title="Changes stay in this browser tab and are never synced.">{localMode === "tutorial" ? "Local tutorial" : "Local demo"} · no sync</span>
              {localMode === "demo" ? <button type="button" className="secondary-action" onClick={onResetDemo}>Reset demo</button> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="app-topbar-search-slot">
        <div className="app-topbar-controls-host" id={APP_TOPBAR_SLOT_IDS.controls} />
        <div className="app-topbar-search-host" id={APP_TOPBAR_SLOT_IDS.search} />

      </div>
    </header>
  );
}
