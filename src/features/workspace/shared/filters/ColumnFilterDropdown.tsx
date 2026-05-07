import { useId, useRef, useState } from "react";

import { IconFilter } from "@/components/shared/Icons";

import type { DropdownOption } from "../model/workspaceTypes";
import { type FilterSelection, formatFilterSelectionLabel } from "./workspaceFilterUtils";
import { FilterOptionMenu } from "./workspaceFilterDropdownMenu";
import { useFilterDropdownMenuState, usePrunedFilterSelection } from "./workspaceFilterDropdownHooks";

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
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);

  usePrunedFilterSelection(value, options, onChange);
  const { menuOffsetX } = useFilterDropdownMenuState({
    buttonRef,
    filterRef,
    isOpen,
    menuRef,
    onClose: () => setIsOpen(false),
    viewSelector: ".workspace-panel, .panel, .page-shell",
  });

  return (
    <span
      className={`table-column-filter${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel}${isActive ? `: ${selectedLabel}` : ""}`}
        className="table-column-filter-button"
        ref={buttonRef}
        onClick={(milestone) => {
          milestone.stopPropagation();
          setIsOpen((current) => !current);
        }}
        title={`${ariaLabel}${isActive ? `: ${selectedLabel}` : ""}`}
        type="button"
      >
        <IconFilter />
      </button>
      {isOpen ? (
        <FilterOptionMenu
          allLabel={allLabel}
          menuId={menuId}
          menuRef={menuRef}
          menuOffsetX={menuOffsetX}
          onChange={onChange}
          options={options}
          value={value}
        />
      ) : null}
    </span>
  );
}
