import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";

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
            <div aria-label={`Sort ${label} direction`} className="resource-sort-direction" role="group">
              <button
                aria-label={`Sort ${label} ascending`}
                aria-pressed={direction === "ascending"}
                className="resource-sort-direction-button"
                onClick={() => onDirectionChange("ascending")}
                title="Ascending"
                type="button"
              >
                <ArrowUp aria-hidden="true" size={15} />
              </button>
              <button
                aria-label={`Sort ${label} descending`}
                aria-pressed={direction === "descending"}
                className="resource-sort-direction-button"
                onClick={() => onDirectionChange("descending")}
                title="Descending"
                type="button"
              >
                <ArrowDown aria-hidden="true" size={15} />
              </button>
            </div>
          ),
        },
      ]}
    />
  );
}
