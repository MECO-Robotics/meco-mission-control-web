import { Filter } from "lucide-react";

import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { CompactFilterMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export function createResourceFilterMenuItem({
  allLabel,
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel: string;
  label: string;
  onChange: (value: FilterSelection) => void;
  options: Array<{ id: string; name: string }>;
  value: FilterSelection;
}): CompactFilterMenuItem {
  return {
    label,
    content: <FilterDropdown allLabel={allLabel} ariaLabel={ariaLabel} className="task-queue-filter-menu-submenu" icon={<Filter size={14} />} onChange={onChange} options={options} value={value} />,
  };
}
