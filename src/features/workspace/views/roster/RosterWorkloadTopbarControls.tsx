import type { Dispatch, SetStateAction } from "react";

import { IconSort } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { RosterAvailabilityStatus } from "@/types/rosterInsights";

import type { RosterMemberSortMode } from "./rosterInsightsViewModel";

export function RosterWorkloadTopbarControls({
  availabilityFilter,
  availabilityOptions,
  searchText,
  setAvailabilityFilter,
  setSearchText,
  setSortMode,
  sortMode,
  sortOptions,
}: {
  availabilityFilter: RosterAvailabilityStatus | "all";
  availabilityOptions: Array<{ id: RosterAvailabilityStatus | "all"; name: string }>;
  searchText: string;
  setAvailabilityFilter: Dispatch<SetStateAction<RosterAvailabilityStatus | "all">>;
  setSearchText: Dispatch<SetStateAction<string>>;
  setSortMode: Dispatch<SetStateAction<RosterMemberSortMode>>;
  sortMode: RosterMemberSortMode;
  sortOptions: Array<{ id: RosterMemberSortMode; name: string }>;
}) {
  return (
    <div className="panel-actions filter-toolbar roster-workload-topbar-controls">
      <TopbarResponsiveSearch
        actionCount={2}
        actions={
          <>
            <CompactFilterMenu
              activeCount={availabilityFilter === "all" ? 0 : 1}
              ariaLabel="Filter availability"
              buttonLabel="Status"
              items={[
                {
                  label: "Availability",
                  content: (
                    <select
                      aria-label="Filter members by availability"
                      className="task-queue-sort-menu-select"
                      onChange={(event) =>
                        setAvailabilityFilter(event.target.value as RosterAvailabilityStatus | "all")
                      }
                      value={availabilityFilter}
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
              ]}
            />
            <CompactFilterMenu
              activeCount={sortMode === "availability" ? 0 : 1}
              ariaLabel="Sort workload"
              buttonLabel="Sort"
              icon={<IconSort />}
              items={[
                {
                  label: "Sort by",
                  content: (
                    <select
                      aria-label="Sort members"
                      className="task-queue-sort-menu-select"
                      onChange={(event) => setSortMode(event.target.value as RosterMemberSortMode)}
                      value={sortMode}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
              ]}
            />
          </>
        }
        ariaLabel="Search members"
        onChange={setSearchText}
        placeholder="Search members or tasks..."
        value={searchText}
      />
    </div>
  );
}
