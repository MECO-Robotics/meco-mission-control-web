import { createPortal } from "react-dom";
import { useId, useRef, useState, type ReactNode } from "react";

import type { DropdownOption } from "../model/workspaceTypes";
import {
  type FilterSelection,
  formatFilterSelectionLabel,
} from "./workspaceFilterUtils";
import { FilterOptionMenu } from "./workspaceFilterDropdownMenu";
import {
  useFilterDropdownMenuState,
  usePrunedFilterSelection,
} from "./workspaceFilterDropdownHooks";

export function FilterDropdown({
  allLabel,
  ariaLabel,
  className,
  buttonDataTutorialTarget,
  buttonInlineEditField,
  buttonContent,
  getOptionToneClassName,
  getSelectedToneClassName,
  icon,
  menuClassName,
  portalMenu,
  portalMenuPlacement = "auto",
  onChange,
  options,
  showAllOption = true,
  singleSelect,
  value,
}: {
  allLabel: string;
  ariaLabel?: string;
  className?: string;
  buttonDataTutorialTarget?: string;
  buttonInlineEditField?: string;
  buttonContent?: ReactNode;
  getOptionToneClassName?: (option: DropdownOption) => string | undefined;
  getSelectedToneClassName?: (value: FilterSelection) => string | undefined;
  icon: ReactNode;
  menuClassName?: string;
  portalMenu?: boolean;
  portalMenuPlacement?: "auto" | "above" | "below";
  onChange: (value: FilterSelection) => void;
  options: DropdownOption[];
  showAllOption?: boolean;
  singleSelect?: boolean;
  value: FilterSelection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isActive = value.length > 0;
  const selectedLabel = formatFilterSelectionLabel(allLabel, options, value);
  const selectedOption = options.find((option) => option.id === value[0]);
  const selectedIcon = selectedOption?.icon ?? icon;
  const selectedToneClassName = getSelectedToneClassName?.(value);

  usePrunedFilterSelection(value, options, onChange);
  const { menuOffsetX, menuPosition } = useFilterDropdownMenuState({
    buttonRef,
    filterRef,
    isOpen,
    menuRef,
    onClose: () => setIsOpen(false),
    portalMenu,
    portalMenuPlacement,
    viewSelector: ".workspace-panel, .panel, .page-shell, .modal-card",
  });

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}${selectedToneClassName ? ` ${selectedToneClassName}` : ""}${className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel ?? allLabel}: ${selectedLabel}`}
        className="toolbar-filter-menu-button"
        data-tutorial-target={buttonDataTutorialTarget}
        data-inline-edit-field={buttonInlineEditField}
        ref={buttonRef}
        onClick={() => setIsOpen((current) => !current)}
        title={`${ariaLabel ?? allLabel}: ${selectedLabel}`}
        type="button"
      >
        {buttonContent ?? (
          <>
            <span className="toolbar-filter-icon">{selectedIcon}</span>
            <span aria-hidden="true" className="toolbar-filter-value">
              {selectedLabel}
            </span>
            <span aria-hidden="true" className="toolbar-filter-chevron" />
          </>
        )}
      </button>
      {isOpen ? (
        portalMenu && typeof document !== "undefined" ? (
          createPortal(
            <FilterOptionMenu
              allLabel={allLabel}
              className={menuClassName ?? className}
              getOptionToneClassName={getOptionToneClassName}
              menuId={menuId}
              menuRef={menuRef}
              menuOffsetX={menuOffsetX}
              onChange={onChange}
              options={options}
              showAllOption={showAllOption}
              singleSelect={singleSelect}
              style={{
                position: "fixed",
                top: `${menuPosition?.top ?? 0}px`,
                left: `${menuPosition?.left ?? 0}px`,
                right: "auto",
                bottom: "auto",
                transform: "none",
                visibility: menuPosition ? "visible" : "hidden",
                zIndex: 50000,
              }}
              value={value}
            />,
            document.body,
          )
        ) : (
          <FilterOptionMenu
            allLabel={allLabel}
            className={menuClassName ?? className}
            getOptionToneClassName={getOptionToneClassName}
            menuId={menuId}
            menuRef={menuRef}
            menuOffsetX={menuOffsetX}
            onChange={onChange}
            options={options}
            showAllOption={showAllOption}
            singleSelect={singleSelect}
            value={value}
          />
        )
      ) : null}
    </span>
  );
}
