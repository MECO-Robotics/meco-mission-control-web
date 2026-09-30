import { IconFilter } from "@/components/shared/Icons";

import type { DropdownOption } from "../model/workspaceTypes";
import { type FilterSelection } from "./workspaceFilterUtils";
import { FilterDropdown } from "./FilterDropdown";

export function ColumnFilterDropdown({
  allLabel,
  ariaLabel,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel: string;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  value: FilterSelection;
}) {
  return (
    <FilterDropdown
      allLabel={allLabel}
      ariaLabel={ariaLabel}
      appearance="column"
      buttonContent={<IconFilter />}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
