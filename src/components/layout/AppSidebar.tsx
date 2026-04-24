import type { NavigationItem, ViewTab } from "@/features/workspace";
import type { SeasonRecord } from "@/types";

const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

interface AppSidebarProps {
  activeTab: ViewTab;
  items: NavigationItem[];
  onSelectTab: (tab: ViewTab) => void;
  isCollapsed: boolean;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
  onSelectSeason: (seasonId: string | null) => void;
  onCreateSeason: () => void;
}

export function AppSidebar({
  activeTab,
  items,
  onSelectTab,
  isCollapsed,
  seasons,
  selectedSeasonId,
  onSelectSeason,
  onCreateSeason,
}: AppSidebarProps) {
  return (
    <nav
      aria-label="Workspace views"
      className="sidebar"
      data-collapsed={isCollapsed ? "true" : "false"}
    >
      {items.map(({ value, label, icon }) => {
        const isActive = activeTab === value;

        return (
          <button
            key={value}
            className="tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onSelectTab(value)}
            type="button"
          >
            <span className="sidebar-tab-main">
              <span
                aria-hidden="true"
                className="sidebar-tab-icon"
              >
                {icon}
              </span>
              {!isCollapsed ? (
                <span className="sidebar-tab-label">{label}</span>
              ) : null}
            </span>
          </button>
        );
      })}

      {!isCollapsed ? (
        <label className="sidebar-context-picker">
          <span className="sidebar-context-label">Season</span>
          <select
            className="sidebar-context-select"
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === CREATE_SEASON_OPTION_VALUE) {
                event.target.value = selectedSeasonId ?? "";
                onCreateSeason();
                return;
              }

              onSelectSeason(nextValue || null);
            }}
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
      ) : null}
    </nav>
  );
}
