import type { Dispatch, SetStateAction } from "react";

import { IconPerson } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

import {
  DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE,
  WORK_LOG_ACTIVITY_GROUP_OPTIONS,
  type WorkLogActivityGroupMode,
} from "./workLogsActivityGrouping";

interface WorkLogsActivityToolbarProps {
  activityGroupMode: WorkLogActivityGroupMode;
  search: string;
  setActivityGroupMode: Dispatch<SetStateAction<WorkLogActivityGroupMode>>;
  setSearch: Dispatch<SetStateAction<string>>;
}

export function WorkLogsActivityToolbar({
  activityGroupMode,
  search,
  setActivityGroupMode,
  setSearch,
}: WorkLogsActivityToolbarProps) {
  const selectedGroupLabel =
    WORK_LOG_ACTIVITY_GROUP_OPTIONS.find((option) => option.id === activityGroupMode)?.name ?? "Person";
  const groupAriaLabel = `Group activity: ${selectedGroupLabel}`;

  return (
    <div className="panel-actions filter-toolbar worklog-toolbar worklog-toolbar-topbar">
      <TopbarResponsiveSearch
        actionCount={1}
        actions={
          <CompactFilterMenu
            activeCount={activityGroupMode !== DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE ? 1 : 0}
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
                    {WORK_LOG_ACTIVITY_GROUP_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        }
        ariaLabel="Search activity"
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder="Search activity..."
        value={search}
      />
    </div>
  );
}
