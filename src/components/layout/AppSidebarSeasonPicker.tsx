import { type ChangeEvent } from "react";

import type { SeasonRecord } from "@/types/recordsOrganization";

const CREATE_SEASON_OPTION_VALUE = "__create_new_season__";

interface AppSidebarSeasonPickerProps {
  onCreateSeason: () => void;
  onSelectSeason: (seasonId: string | null) => void;
  seasons: SeasonRecord[];
  selectedSeasonId: string | null;
}

export function AppSidebarSeasonPicker({
  onCreateSeason,
  onSelectSeason,
  seasons,
  selectedSeasonId,
}: AppSidebarSeasonPickerProps) {
  const handleSeasonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    if (nextValue === CREATE_SEASON_OPTION_VALUE) {
      event.target.value = selectedSeasonId ?? "";
      onCreateSeason();
      return;
    }

    onSelectSeason(nextValue || null);
  };

  return (
    <label className="sidebar-context-picker sidebar-season-picker">
      <span className="sidebar-context-label">Season</span>
      <select
        aria-label="Select season"
        className="sidebar-context-select sidebar-season-select"
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
  );
}
