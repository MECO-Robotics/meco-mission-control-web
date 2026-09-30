import type { Dispatch, SetStateAction } from "react";

import { IconPerson } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

import {
  DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE,
  WORK_LOG_ACTIVITY_GROUP_OPTIONS,
  type WorkLogActivityGroupMode,
} from "./workLogsActivityGrouping";

interface WorkLogsActivityToolbarProps {
  activityGroupMode: WorkLogActivityGroupMode;
  activitySortMode: "date" | "title";
  activitySortDirection: "asc" | "desc";
  defaultGroupMode?: WorkLogActivityGroupMode;
  groupOptions?: readonly DropdownOption[];
  search: string;
  searchAriaLabel?: string;
  searchPlaceholder?: string;
  setActivityGroupMode: Dispatch<SetStateAction<WorkLogActivityGroupMode>>;
  setActivitySortMode: Dispatch<SetStateAction<"date" | "title">>;
  setActivitySortDirection: Dispatch<SetStateAction<"asc" | "desc">>;
  setSearch: Dispatch<SetStateAction<string>>;
}

export function WorkLogsActivityToolbar({
  activityGroupMode,
  activitySortMode,
  activitySortDirection,
  defaultGroupMode = DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE,
  groupOptions = WORK_LOG_ACTIVITY_GROUP_OPTIONS,
  search,
  searchAriaLabel = "Search activity",
  searchPlaceholder = "Search activity...",
  setActivityGroupMode,
  setActivitySortMode,
  setActivitySortDirection,
  setSearch,
}: WorkLogsActivityToolbarProps) {
  const selectedGroupLabel =
    groupOptions.find((option) => option.id === activityGroupMode)?.name ?? "Person";
  const groupAriaLabel = `Group activity: ${selectedGroupLabel}`;

  return (
    <div className="panel-actions filter-toolbar worklog-toolbar worklog-toolbar-topbar">
      <TopbarResponsiveSearch
        actionCount={2}
        actions={<>
          <WorkspaceSortMenu direction={activitySortDirection} field={activitySortMode} label="activity" onDirectionChange={setActivitySortDirection} onFieldChange={(field) => setActivitySortMode(field as "date" | "title")} options={[{ label: "Date", value: "date" }, { label: "Title", value: "title" }]} />
          <CompactFilterMenu
            activeCount={activityGroupMode !== defaultGroupMode ? 1 : 0}
            ariaLabel={groupAriaLabel}
            buttonLabel={`Group: ${selectedGroupLabel}`}
            className="worklog-activity-group-menu"
            icon={<IconPerson />}
            items={[
              {
                label: "Group by",
                content: (
                  <select
                    aria-label="Group activity"
                    className="task-queue-sort-menu-select"
                    onChange={(event) =>
                      setActivityGroupMode(event.target.value as WorkLogActivityGroupMode)
                    }
                    value={activityGroupMode}
                  >
                    {groupOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        </>}
        ariaLabel={searchAriaLabel}
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder={searchPlaceholder}
        value={search}
      />
    </div>
  );
}
