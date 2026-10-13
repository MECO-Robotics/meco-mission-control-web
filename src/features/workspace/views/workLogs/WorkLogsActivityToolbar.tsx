import type { Dispatch, SetStateAction } from "react";

import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
interface WorkLogsActivityToolbarProps {
  activitySortMode: "date" | "title";
  activitySortDirection: "asc" | "desc";
  search: string;
  searchAriaLabel?: string;
  searchPlaceholder?: string;
  setActivitySortMode: Dispatch<SetStateAction<"date" | "title">>;
  setActivitySortDirection: Dispatch<SetStateAction<"asc" | "desc">>;
  setSearch: Dispatch<SetStateAction<string>>;
}

export function WorkLogsActivityToolbar({
  activitySortMode,
  activitySortDirection,
  search,
  searchAriaLabel = "Search activity",
  searchPlaceholder = "Search activity...",
  setActivitySortMode,
  setActivitySortDirection,
  setSearch,
}: WorkLogsActivityToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar worklog-toolbar worklog-toolbar-topbar">
      <TopbarResponsiveSearch
        actionCount={1}
        actions={<WorkspaceSortMenu direction={activitySortDirection} field={activitySortMode} label="activity" onDirectionChange={setActivitySortDirection} onFieldChange={(field) => setActivitySortMode(field as "date" | "title")} options={[{ label: "Date", value: "date" }, { label: "Title", value: "title" }]} />}
        ariaLabel={searchAriaLabel}
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder={searchPlaceholder}
        value={search}
      />
    </div>
  );
}
