import { ArrowDownUp } from "lucide-react";

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
            <select aria-label={`Sort ${label} by`} className="toolbar-filter-select" onChange={(event) => onFieldChange(event.target.value)} value={field}>
              {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ),
        },
      ]}
    />
  );
}
