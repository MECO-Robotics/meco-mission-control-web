import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { DropdownOption } from "../model/workspaceTypes";
import {
  type FilterSelection,
  formatCompactFilterSelectionLabel,
  formatFilterSelectionLabel,
} from "./workspaceFilterUtils";
import { FilterOptionMenu } from "./workspaceFilterDropdownMenu";
import { useTopbarSearchOverride } from "./TopbarSearchOverride";
import {
  useFilterDropdownMenuState,
  usePrunedFilterSelection,
} from "./workspaceFilterDropdownHooks";

export function FilterDropdown({
  allLabel,
  ariaLabel,
  appearance = "toolbar",
  className,
  compactSummary = false,
  buttonDataTutorialTarget,
  buttonInlineEditField,
  buttonContent,
  getOptionToneClassName,
  getSelectedToneClassName,
  hideButtonIcon = false,
  icon,
  menuClassName,
  portalMenu,
  portalMenuPlacement = "auto",
  searchInTopbar = false,
  onChange,
  options,
  selectedAllLabel,
  showAllOption = true,
  singleSelect,
  value,
}: {
  allLabel: string;
  appearance?: "toolbar" | "column";
  ariaLabel?: string;
  className?: string;
  compactSummary?: boolean;
  buttonDataTutorialTarget?: string;
  buttonInlineEditField?: string;
  buttonContent?: ReactNode;
  getOptionToneClassName?: (option: DropdownOption) => string | undefined;
  getSelectedToneClassName?: (value: FilterSelection) => string | undefined;
  icon?: ReactNode;
  hideButtonIcon?: boolean;
  menuClassName?: string;
  portalMenu?: boolean;
  portalMenuPlacement?: "auto" | "above" | "below";
  searchInTopbar?: boolean;
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  selectedAllLabel?: string;
  showAllOption?: boolean;
  singleSelect?: boolean;
  value: FilterSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const topbarSearch = useTopbarSearchOverride();
  const setTopbarSearch = topbarSearch?.setActive;
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(
    selectedAllLabel ?? allLabel,
    options,
    value,
  );
  const selectedOption = options.find((option) => option.id === value[0]);
  const displaySelectedLabel = compactSummary || value.length === 0
    ? formatCompactFilterSelectionLabel(options, value)
    : selectedLabel;
  const selectedIcon = selectedOption?.icon ?? icon;
  const selectedToneClassName = getSelectedToneClassName?.(value);
  const columnAppearance = appearance === "column";
  const accessibleLabel = `${ariaLabel ?? allLabel}${columnAppearance && !isActive ? "" : `: ${selectedLabel}`}`;
  const closeMenu = () => {
    setIsOpen(false);
    setSearchText("");
  };

  const renderMenu = (style?: CSSProperties) => (
    <FilterOptionMenu
      allLabel={allLabel}
      className={menuClassName ?? className}
      getOptionToneClassName={getOptionToneClassName}
      menuId={menuId}
      menuRef={menuRef}
      menuOffsetX={menuOffsetX}
      onChange={onChange}
      options={options}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      hideSearchInput={searchInTopbar}
      showAllOption={showAllOption}
      singleSelect={singleSelect}
      style={style}
      value={value}
    />
  );

  useEffect(() => {
    if (!searchInTopbar || !isOpen || !setTopbarSearch) return;
    const override = { label: allLabel.toLowerCase(), value: searchText, onChange: setSearchText };
    setTopbarSearch(override);
    return () => setTopbarSearch(null);
  }, [allLabel, isOpen, searchInTopbar, searchText, setTopbarSearch]);

  usePrunedFilterSelection(value, options, onChange);
  const { menuOffsetX, menuPosition } = useFilterDropdownMenuState({
    buttonRef,
    filterRef,
    isOpen,
    menuRef,
    onClose: closeMenu,
    portalMenu,
    portalMenuPlacement,
    viewSelector: columnAppearance
      ? ".workspace-panel, .panel, .page-shell"
      : ".workspace-panel, .panel, .page-shell, .modal-card",
  });

  return (
    <span
      className={`${columnAppearance ? "table-column-filter" : "toolbar-filter toolbar-filter-dropdown"}${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${!columnAppearance && selectedToneClassName ? ` ${selectedToneClassName}` : ""}${!columnAppearance && className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={accessibleLabel}
        className={columnAppearance ? "table-column-filter-button" : "toolbar-filter-menu-button"}
        data-tutorial-target={buttonDataTutorialTarget}
        data-inline-edit-field={buttonInlineEditField}
        ref={buttonRef}
        onClick={(event) => {
          if (columnAppearance) event.stopPropagation();
          setIsOpen((current) => {
            if (current) setSearchText("");
            return !current;
          });
        }}
        title={accessibleLabel}
        type="button"
      >
        {columnAppearance ? buttonContent : buttonContent ?? (
          <>
            {hideButtonIcon ? null : <span className="toolbar-filter-icon">{selectedIcon}</span>}
            <span aria-hidden="true" className="toolbar-filter-value">
              {displaySelectedLabel}
            </span>
            <span aria-hidden="true" className="toolbar-filter-chevron" />
          </>
        )}
      </button>
      {isOpen ? (
        portalMenu && typeof document !== "undefined" ? (
          createPortal(
            renderMenu({
                position: "fixed",
                top: `${menuPosition?.top ?? 0}px`,
                left: `${menuPosition?.left ?? 0}px`,
                right: "auto",
                bottom: "auto",
                transform: "none",
                visibility: menuPosition ? "visible" : "hidden",
                zIndex: 50000,
              }),
            buttonRef.current?.closest("dialog") ?? document.body,
          )
        ) : (
          renderMenu()
        )
      ) : null}
    </span>
  );
}
