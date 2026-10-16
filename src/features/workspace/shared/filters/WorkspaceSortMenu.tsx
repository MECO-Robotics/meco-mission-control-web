import { ArrowDownUp } from "lucide-react";

import { FilterDropdown } from "./FilterDropdown";
import { SortDirectionToggle, type SortDirection } from "./SortDirectionToggle";
import { CompactFilterMenu } from "./workspaceCompactFilterMenu";

export function WorkspaceSortMenu<T extends SortDirection>({
  activeCount = 1,
  ariaLabel,
  direction,
  field,
  label,
  onDirectionChange,
  onFieldChange,
  options,
}: {
  activeCount?: number;
  ariaLabel?: string;
  direction: T;
  field: string;
  label: string;
  onDirectionChange: (direction: T) => void;
  onFieldChange: (field: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <CompactFilterMenu
      activeCount={activeCount}
      ariaLabel={ariaLabel ?? `Sort ${label}`}
      buttonLabel="Sort"
      className="task-queue-sort-menu"
      icon={<ArrowDownUp size={14} />}
      iconOnly
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
