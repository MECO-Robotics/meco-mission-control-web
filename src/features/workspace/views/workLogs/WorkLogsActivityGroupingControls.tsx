import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

import type { WorkLogActivityGroupMode } from "./workLogsActivityGrouping";

interface WorkLogsActivityGroupingControlsProps {
  activeGroupMode: WorkLogActivityGroupMode;
  ariaLabel: string;
  groupOptions: readonly DropdownOption[];
  onGroupModeChange: (groupMode: WorkLogActivityGroupMode) => void;
  tutorialPrefix: string;
}

export function WorkLogsActivityGroupingControls({
  activeGroupMode,
  ariaLabel,
  groupOptions,
  onGroupModeChange,
  tutorialPrefix,
}: WorkLogsActivityGroupingControlsProps) {
  return (
    <div aria-label={ariaLabel} className="worklog-activity-grouping-controls" role="group">
      {groupOptions.map((option) => {
        const groupMode = option.id as WorkLogActivityGroupMode;
        const isActive = activeGroupMode === groupMode;

        return (
          <button
            aria-pressed={isActive}
            className="worklog-activity-grouping-button"
            data-active={isActive ? "true" : "false"}
            data-tutorial-target={`${tutorialPrefix}-${option.id}`}
            key={option.id}
            onClick={() => onGroupModeChange(groupMode)}
            type="button"
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
