import { ArrowDownUp } from "lucide-react";

import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { ResourceSortDirection } from "./ResourceColumnHeader";

export function ResourceSortMenu({
  direction,
  field,
  label,
  onDirectionChange,
  onFieldChange,
  options,
}: {
  direction: ResourceSortDirection;
  field: string;
  label: string;
  onDirectionChange: (direction: ResourceSortDirection) => void;
  onFieldChange: (field: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <CompactFilterMenu
      activeCount={1}
      ariaLabel={`Sort ${label}`}
      buttonLabel="Sort"
      icon={<ArrowDownUp size={14} />}
      iconOnly
      className="resource-sort-menu"
      items={[
        {
          label: "Sort by",
          labelControl: (
            <SortDirectionToggle direction={direction} label={label} onChange={onDirectionChange} />
          ),
          content: (
            <FilterDropdown
              allLabel={`Sort ${label} by`}
              ariaLabel={`Sort ${label} by`}
              className="task-queue-filter-menu-submenu"
              onChange={(selection) => onFieldChange(selection[0] ?? options[0]?.value ?? field)}
              options={options.map(({ label: optionLabel, value }) => ({ id: value, name: optionLabel }))}
              showAllOption={false}
              singleSelect
              value={[field]}
            />
          ),
        },
      ]}
    />
  );
}
