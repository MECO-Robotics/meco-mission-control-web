import { ArrowDownUp } from "lucide-react";

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
  field: string | null;
  label: string;
  onDirectionChange: (direction: ResourceSortDirection) => void;
  onFieldChange: (field: string | null) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <CompactFilterMenu
      activeCount={field ? 1 : 0}
      ariaLabel={`Sort ${label}`}
      buttonLabel="Sort"
      icon={<ArrowDownUp size={14} />}
      iconOnly
      className="resource-sort-menu"
      menuTitle="Sort"
      items={[
        {
          label: "Column",
          content: (
            <select aria-label={`Sort ${label} by`} className="toolbar-filter-select" onChange={(event) => onFieldChange(event.target.value || null)} value={field ?? ""}>
              <option value="">Default order</option>
              {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ),
        },
        {
          label: "Direction",
          content: (
            <select aria-label={`Sort ${label} direction`} className="toolbar-filter-select" onChange={(event) => onDirectionChange(event.target.value as ResourceSortDirection)} value={direction}>
              <option value="ascending">Ascending</option>
              <option value="descending">Descending</option>
            </select>
          ),
        },
      ]}
    />
  );
}
